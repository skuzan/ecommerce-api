import { type Request, type Response } from "express";
import { addressService } from "../services/addressService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendList,
  sendNoContent,
  sendSuccess,
} from "../utils/response.js";
import type { AddressController } from "../types/controllerTypes.js";

const list = asyncHandler(async (req: Request, res: Response) => {
  const items = await addressService.list(req.user!.userId);
  sendList(res, items);
});

const getById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const item = await addressService.findById(req.user!.userId, req.params.id);
    sendSuccess(res, item);
  },
);

const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await addressService.create(req.user!.userId, req.body);
  sendSuccess(res, item, 201);
});

const update = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const item = await addressService.update(
      req.user!.userId,
      req.params.id,
      req.body,
    );
    sendSuccess(res, item);
  },
);

const setDefault = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const item = await addressService.setDefault(
      req.user!.userId,
      req.params.id,
    );
    sendSuccess(res, item);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await addressService.remove(req.user!.userId, req.params.id);
    sendNoContent(res);
  },
);

export const addressController: AddressController = {
  list,
  getById,
  create,
  update,
  setDefault,
  remove,
};
