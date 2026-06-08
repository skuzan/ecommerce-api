import { prisma } from "../config/database.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { couponService } from "./couponService.js";

// Sepet view modeli — frontend için hesaplanmış alanlar dahil.
interface CartView {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    imageUrl: string | null;
    quantity: number;
    price: number; // snapshot (kuruş)
    lineTotal: number; // price × quantity
    inStock: boolean;
    currentPrice: number; // ürünün şu anki fiyatı
    priceChanged: boolean; // snapshot != currentPrice
  }>;
  coupon: { code: string; discountType: string; discountValue: number } | null;
  subtotal: number;
  discount: number;
  total: number;
}

// Yardımcı — sepet ve sipariş tarafında tekrar kullanılacak saf fonksiyon.
export function calculateDiscount(
  coupon: { discountType: string; discountValue: number },
  subtotal: number,
): number {
  if (coupon.discountType === "PERCENTAGE") {
    // Müşteri lehine floor — round mağaza zararına olur.
    return Math.floor((subtotal * coupon.discountValue) / 100);
  }
  // FIXED — kuruş cinsinden; indirim subtotal'ı aşamaz.
  return Math.min(coupon.discountValue, subtotal);
}

export const cartService = {
  get: async (userId: string): Promise<CartView> => {
    // Cart yoksa boş response (lazy create — addItem'da oluşur).
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        coupon: true,
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                stock: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { id: "", items: [], coupon: null, subtotal: 0, discount: 0, total: 0 };
    }

    // Geçersiz ürünleri (silinmiş/inactive) gösterimden çıkar.
    const validItems = cart.items.filter(
      (i) => i.product.deletedAt === null && i.product.isActive,
    );

    const items = validItems.map((i) => {
      const lineTotal = i.price * i.quantity;
      const currentPrice = i.product.price;
      return {
        id: i.id,
        productId: i.productId,
        name: i.product.name,
        imageUrl: i.product.imageUrl,
        quantity: i.quantity,
        price: i.price,
        lineTotal,
        inStock: i.product.stock >= i.quantity,
        currentPrice,
        priceChanged: currentPrice !== i.price,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const discount = cart.coupon ? calculateDiscount(cart.coupon, subtotal) : 0;
    const total = Math.max(0, subtotal - discount);

    return {
      id: cart.id,
      items,
      coupon: cart.coupon
        ? {
            code: cart.coupon.code,
            discountType: cart.coupon.discountType,
            discountValue: cart.coupon.discountValue,
          }
        : null,
      subtotal,
      discount,
      total,
    };
  },

  // Sadece subtotal lazım olan yerler için (applyCoupon, validate endpoint).
  getSubtotal: async (userId: string): Promise<number> => {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { price: true, isActive: true, deletedAt: true },
            },
          },
        },
      },
    });
    if (!cart) return 0;

    return cart.items
      .filter((i) => i.product.deletedAt === null && i.product.isActive)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  addItem: async (userId: string, productId: string, quantity: number) => {
    // 1) Ürün var ve aktif mi? (varlık kontrolü → findUnique + inline filtre,
    //    review/wishlist/tag servisleriyle aynı kalıp)
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null, isActive: true },
      select: { id: true, price: true, stock: true },
    });
    if (!product) throw new NotFoundError("Ürün");

    // 2) Cart varsa al, yoksa oluştur (lazy create).
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // 3) Bu ürün sepette zaten var mı?
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    const newQuantity = (existing?.quantity ?? 0) + quantity;

    // 4) Stok kontrolü (basit — Gün 48'de transactional).
    if (product.stock < newQuantity) {
      throw new ConflictError(
        `Yetersiz stok: ${product.stock} adet kaldı, ${newQuantity} istendi`,
      );
    }

    // 5) Upsert — varsa quantity artır (price snapshot KORUNUR), yoksa yeni satır.
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price, // ← yeni satır için snapshot
        },
      });
    }

    // 6) Güncel sepet özetini dön.
    return cartService.get(userId);
  },

  updateItem: async (userId: string, itemId: string, quantity: number) => {
    if (quantity < 1) {
      throw new ValidationError("Miktar 1'den az olamaz", {
        quantity: ["en az 1 olmalı"],
      });
    }

    // Ownership: item bu user'ın sepetine mi ait? Filtre where clause'da
    // (removeItem / wishlistService kalıbı) — JS tarafında userId kıyaslaması yok.
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: { product: { select: { stock: true } } },
    });
    if (!item) throw new NotFoundError("Sepet öğesi");

    if (item.product.stock < quantity) {
      throw new ConflictError(`Yetersiz stok: ${item.product.stock} kaldı`);
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }, // price snapshot'a DOKUNULMUYOR
    });

    return cartService.get(userId);
  },

  removeItem: async (userId: string, itemId: string) => {
    // deleteMany + cart.userId filtresi → ownership tek sorguda, bilgi sızdırmaz.
    const result = await prisma.cartItem.deleteMany({
      where: { id: itemId, cart: { userId } },
    });
    if (result.count === 0) throw new NotFoundError("Sepet öğesi");

    return cartService.get(userId);
  },

  applyCoupon: async (userId: string, code: string) => {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true, _count: { select: { items: true } } },
    });

    if (!cart || cart._count.items === 0) {
      throw new ValidationError("Sepet boş", {
        cart: ["Boş sepete kupon uygulanamaz"],
      });
    }

    const subtotal = await cartService.getSubtotal(userId);

    // Validate — throw ediyorsa hata controller'a, oradan kullanıcıya gider.
    const coupon = await couponService.validate(code, subtotal);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    });

    return cartService.get(userId);
  },

  removeCoupon: async (userId: string) => {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) throw new NotFoundError("Sepet");

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });

    return cartService.get(userId);
  },
};
