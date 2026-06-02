import { prisma } from "../config/database.js";
import type {
  AddCartItemInput,
  ApplyCouponInput,
  UpdateCartItemInput,
} from "../schemas/cartSchemas.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

const cartInclude = {
  coupon: true,
  items: {
    orderBy: { createdAt: "desc" },
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
} as const;

const calculateDiscount = (
  subtotal: number,
  coupon: {
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderAmount: number;
    isActive: boolean;
    expiresAt: Date | null;
  } | null,
) => {
  if (!coupon) return 0;
  if (!coupon.isActive) return 0;
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return 0;
  if (subtotal < coupon.minOrderAmount) return 0;

  if (coupon.discountType === "PERCENTAGE") {
    return Math.min(
      subtotal,
      Math.floor((subtotal * coupon.discountValue) / 100),
    );
  }

  return Math.min(subtotal, coupon.discountValue);
};

const formatCart = <
  T extends {
    items: { price: number; quantity: number }[];
    coupon: {
      discountType: "PERCENTAGE" | "FIXED";
      discountValue: number;
      minOrderAmount: number;
      isActive: boolean;
      expiresAt: Date | null;
    } | null;
  },
>(
  cart: T,
) => {
  const subtotal = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const discountTotal = calculateDiscount(subtotal, cart.coupon);

  return {
    ...cart,
    summary: {
      subtotal,
      discountTotal,
      total: subtotal - discountTotal,
    },
  };
};

const getOrCreateCart = async (userId: string) => {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });
};

export const cartService = {
  get: async (userId: string) => {
    const cart = await getOrCreateCart(userId);
    return formatCart(cart);
  },

  addItem: async (userId: string, input: AddCartItemInput) => {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, deletedAt: null, isActive: true },
      select: { id: true, price: true, stock: true },
    });
    if (!product) throw new NotFoundError("Ürün");
    if (product.stock < input.quantity) {
      throw new ValidationError("Yetersiz stok", {
        quantity: ["İstenen adet ürün stok miktarını aşıyor"],
      });
    }

    const cart = await getOrCreateCart(userId);
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id },
      select: { id: true, quantity: true },
    });

    if (existingItem) {
      const nextQuantity = existingItem.quantity + input.quantity;
      if (product.stock < nextQuantity) {
        throw new ValidationError("Yetersiz stok", {
          quantity: ["Sepetteki mevcut adet ile birlikte stok miktarı aşılıyor"],
        });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQuantity, price: product.price },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: input.quantity,
          price: product.price,
        },
      });
    }

    const updatedCart = await getOrCreateCart(userId);
    return formatCart(updatedCart);
  },

  updateItem: async (
    userId: string,
    itemId: string,
    input: UpdateCartItemInput,
  ) => {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: {
        product: {
          select: { id: true, stock: true, deletedAt: true, isActive: true },
        },
      },
    });
    if (!item) throw new NotFoundError("Sepet ürünü");
    if (item.product.deletedAt || !item.product.isActive) {
      throw new NotFoundError("Ürün");
    }
    if (item.product.stock < input.quantity) {
      throw new ValidationError("Yetersiz stok", {
        quantity: ["İstenen adet ürün stok miktarını aşıyor"],
      });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: input.quantity },
    });

    const cart = await getOrCreateCart(userId);
    return formatCart(cart);
  },

  removeItem: async (userId: string, itemId: string) => {
    const result = await prisma.cartItem.deleteMany({
      where: { id: itemId, cart: { userId } },
    });
    if (result.count === 0) throw new NotFoundError("Sepet ürünü");
  },

  clear: async (userId: string) => {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) return;

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });
  },

  applyCoupon: async (userId: string, input: ApplyCouponInput) => {
    const cart = await getOrCreateCart(userId);
    const subtotal = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    const coupon = await prisma.coupon.findUnique({
      where: { code: input.code },
    });
    if (!coupon || !coupon.isActive) throw new NotFoundError("Kupon");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new ValidationError("Kupon süresi dolmuş", {
        code: ["Bu kupon artık kullanılamaz"],
      });
    }
    if (subtotal < coupon.minOrderAmount) {
      throw new ValidationError("Minimum sepet tutarı sağlanmadı", {
        code: ["Sepet tutarı kupon minimum tutarından düşük"],
      });
    }

    if (coupon.maxUsage !== null) {
      const usageCount = await prisma.cart.count({
        where: { couponId: coupon.id, id: { not: cart.id } },
      });
      if (usageCount >= coupon.maxUsage) {
        throw new ValidationError("Kupon kullanım limiti dolmuş", {
          code: ["Bu kupon kullanım limitine ulaşmış"],
        });
      }
    }

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
      include: cartInclude,
    });

    return formatCart(updatedCart);
  },

  removeCoupon: async (userId: string) => {
    const cart = await getOrCreateCart(userId);
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
      include: cartInclude,
    });

    return formatCart(updatedCart);
  },
};
