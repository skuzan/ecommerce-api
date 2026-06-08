import { type Request, type Response } from "express";
import { cartService } from "../services/cartService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import type { CartController } from "../types/controllerTypes.js";
import type {
  AddItemInput,
  ApplyCouponInput,
  UpdateItemInput,
} from "../schemas/cartSchemas.js";

const get = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.get(req.user!.userId);
  sendSuccess(res, cart);
});

const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body as AddItemInput;
  const cart = await cartService.addItem(req.user!.userId, productId, quantity);
  sendSuccess(res, cart);
});

const updateItem = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { quantity } = req.body as UpdateItemInput;
    const cart = await cartService.updateItem(
      req.user!.userId,
      req.params.id,
      quantity,
    );
    sendSuccess(res, cart);
  },
);

const removeItem = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const cart = await cartService.removeItem(req.user!.userId, req.params.id);
    sendSuccess(res, cart);
  },
);

const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body as ApplyCouponInput;
  const cart = await cartService.applyCoupon(req.user!.userId, code);
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
  applyCoupon,
  removeCoupon,
};
