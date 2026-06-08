import { type Request, type Response } from "express";
import { couponService } from "../services/couponService.js";
import { cartService, calculateDiscount } from "../services/cartService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendList, sendNoContent, sendSuccess } from "../utils/response.js";
import type { CouponController } from "../types/controllerTypes.js";
import type {
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
} from "../schemas/couponSchemas.js";

// Kullanıcıya açık: kuponu kendi sepetine göre ön kontrol et (apply etmeden).
const validate = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body as ValidateCouponInput;
  const subtotal = await cartService.getSubtotal(req.user!.userId);
  const coupon = await couponService.validate(code, subtotal);

  const discount = calculateDiscount(coupon, subtotal);
  sendSuccess(res, {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
  });
});

// ADMIN
const list = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.list();
  sendList(res, coupons);
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.create(req.body as CreateCouponInput);
  sendSuccess(res, coupon, 201);
});

const update = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const coupon = await couponService.update(
      req.params.id,
      req.body as UpdateCouponInput,
    );
    sendSuccess(res, coupon);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await couponService.remove(req.params.id);
    sendNoContent(res);
  },
);

export const couponController: CouponController = {
  validate,
  list,
  create,
  update,
  remove,
};
