import type { Request, Response } from "express";
import { addressService } from "../services/addressService.js";
import type { AddressController } from "../types/controllerTypes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendList, sendNoContent, sendSuccess } from "../utils/response.js";

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.findAll(req.user!.userId);
  sendList(res, addresses);
});

const getById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const address = await addressService.findById(
      req.user!.userId,
      req.params.id,
    );
    sendSuccess(res, address);
  },
);

const create = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.create(req.user!.userId, req.body);
  sendSuccess(res, address, 201);
});

const update = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const address = await addressService.update(
      req.user!.userId,
      req.params.id,
      req.body,
    );
    sendSuccess(res, address);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await addressService.remove(req.user!.userId, req.params.id);
    sendNoContent(res);
  },
);

const restore = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const address = await addressService.restore(req.user!.userId, req.params.id);
    sendSuccess(res, address);
  },
);

const getDeleted = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.findDeleted(req.user!.userId);
  sendList(res, addresses);
});

const setDefault = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const address = await addressService.setDefault(
      req.user!.userId,
      req.params.id,
    );
    sendSuccess(res, address);
  },
);

export const addressController: AddressController = {
  getAll,
  getById,
  create,
  update,
  remove,
  restore,
  getDeleted,
  setDefault,
};
