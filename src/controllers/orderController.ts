import { type Request, type Response } from "express";
import { orderService } from "../services/orderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendList, sendSuccess } from "../utils/response.js";
import type {
  CreateOrderInput,
  UpdateStatusInput,
} from "../schemas/orderSchemas.js";
import type { OrderController } from "../types/controllerTypes.js";

const create = asyncHandler(async (req: Request, res: Response) => {
  const { addressId } = req.body as CreateOrderInput;
  const order = await orderService.create(req.user!.userId, {
    addressId,
    idempotencyKey: req.idempotencyKey!,
  });
  sendSuccess(res, order);
});

const list = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.findAllByUser(req.user!.userId);
  sendList(res, orders);
});

const getById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const order = await orderService.findById(req.user!.userId, req.params.id);
    sendSuccess(res, order);
  },
);

const updateStatus = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { status } = req.body as UpdateStatusInput;
    const order = await orderService.updateStatus(req.params.id, status);
    sendSuccess(res, order);
  },
);

const cancel = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const order = await orderService.cancel(req.params.id, req.user!.userId);
    sendSuccess(res, order);
  },
);

export const orderController: OrderController = {
  create,
  list,
  getById,
  updateStatus,
  cancel,
};
