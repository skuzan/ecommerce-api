import type { Request, Response } from "express";
import { couponService } from "../services/couponService.js";
import type { CouponController } from "../types/controllerTypes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendList, sendNoContent, sendSuccess } from "../utils/response.js";

const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.findAll();
  sendList(res, coupons);
});

const getById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const coupon = await couponService.findById(req.params.id);
    sendSuccess(res, coupon);
  },
);

const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.create(req.body);
  sendSuccess(res, coupon, 201);
});

const update = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const coupon = await couponService.update(req.params.id, req.body);
    sendSuccess(res, coupon);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await couponService.remove(req.params.id);
    sendNoContent(res);
  },
);

const restore = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const coupon = await couponService.restore(req.params.id);
    sendSuccess(res, coupon);
  },
);

const getDeleted = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.findDeleted();
  sendList(res, coupons);
});

export const couponController: CouponController = {
  getAll,
  getById,
  create,
  update,
  remove,
  restore,
  getDeleted,
};
