import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { calculateDiscount } from "./cartService.js";

interface CreateOrderInput {
  addressId: string;
  idempotencyKey: string;
}

export const orderService = {
  create: async (userId: string, input: CreateOrderInput) => {
    const { addressId, idempotencyKey } = input;

    //! 1-
    const existing = await prisma.order.findUnique({
      where: {
        idempotencyKey,
      },
      include: {
        items: true,
        address: true,
      },
    });

    if (existing) return existing;

    //! 2-
    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        coupon: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
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

    //!3-

    if (!cart || cart.items.length === 0) {
      throw new ValidationError("Sepetinizde ürün bulunmamaktadır.", {
        cart: ["Sepetinizde ürün bulunmamaktadır."],
      });
    }

    //! 4-
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!address) throw new NotFoundError("Adres bulunamadı.");

    const validItems = cart.items.filter(
      (i) => i.product.isActive && i.product.deletedAt === null,
    );
    if (validItems.length === 0) {
      throw new ValidationError("Sepetinizde ürünler artık satışta değil", {
        cart: ["Sepetinizi güncelleyip yeniden deneyin."],
      });
    }

    //! 5-

    const subtotal = validItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    const discountAmaount = cart.coupon
      ? calculateDiscount(cart.coupon, subtotal)
      : 0;

    const totalAmount = Math.max(0, subtotal - discountAmaount);

    //! 6-

    for (const item of validItems) {
      if (item.quantity > item.product.stock) {
        throw new ValidationError(
          `Ürün stokta yeterli miktarda bulunmamaktadır: ${item.product.name}`,
          {
            cart: [
              `Ürün stokta yeterli miktarda bulunmamaktadır: ${item.product.name}`,
            ],
          },
        );
      }
    }

    //! 7-

    try {
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId,
            addressId,
            couponId: cart.coupon?.id ?? null,
            subtotal,
            discountAmount: discountAmaount,
            totalAmount,
            idempotencyKey,
            items: {
              create: validItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                price: i.price,
              })),
            },
          },
          include: {
            items: true,
            address: true,
          },
        });

        for (const item of validItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        if (cart.coupon) {
          await tx.coupon.update({
            where: { id: cart.coupon.id },
            data: {
              usageCount: {
                increment: 1,
              },
            },
          });
        }

        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });
        await tx.cart.update({
          where: { id: cart.id },
          data: {
            couponId: null,
          },
        });

        return created;
      });

      return order;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const existing = await prisma.order.findUnique({
          where: {
            idempotencyKey,
          },
        });
        if (existing) {
          return existing;
        }
      }
      throw err;
    }
  },

  findAllByUser: async (userId: string) => {
    return prisma.order.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        discountAmount: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: { id: true, productId: true, quantity: true, price: true },
        },
      },
    });
  },

  findById: async (userId: string, orderId: string) => {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, deletedAt: null },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        address: true,
        coupon: {
          select: { code: true, discountType: true, discountValue: true },
        },
      },
    });
    if (!order) throw new NotFoundError("Sipariş");
    return order;
  },
};
