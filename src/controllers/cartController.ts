import type { Request, Response } from "express";
import { cartService } from "../services/cartService.js";
import type { CartController } from "../types/controllerTypes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendNoContent, sendSuccess } from "../utils/response.js";

const get = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.get(req.user!.userId);
  sendSuccess(res, cart);
});

const addItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.addItem(req.user!.userId, req.body);
  sendSuccess(res, cart, 201);
});

const updateItem = asyncHandler(
  async (req: Request<{ itemId: string }>, res: Response) => {
    const cart = await cartService.updateItem(
      req.user!.userId,
      req.params.itemId,
      req.body,
    );
    sendSuccess(res, cart);
  },
);

const removeItem = asyncHandler(
  async (req: Request<{ itemId: string }>, res: Response) => {
    await cartService.removeItem(req.user!.userId, req.params.itemId);
    sendNoContent(res);
  },
);

const clear = asyncHandler(async (req: Request, res: Response) => {
  await cartService.clear(req.user!.userId);
  sendNoContent(res);
});

const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.applyCoupon(req.user!.userId, req.body);
  sendSuccess(res, cart);
});

const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeCoupon(req.user!.userId);
  sendSuccess(res, cart);
});

export const cartController: CartController = {
  get,
  addItem,
  updateItem,
  removeItem,
  clear,
  applyCoupon,
  removeCoupon,
};
