import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { producerService } from "../services/producerService.js";
import { type CrudController } from "../types/controllerTypes.js";
import { sendNoContent, sendSuccess } from "../utils/response.js";

const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const producer = await producerService.findAll();
  sendSuccess(res, producer);
});

const getById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const producer = await producerService.findById(req.params.id);
   sendSuccess(res, producer);
  },
);

const create = asyncHandler(async (req: Request, res: Response) => {
  const producer = await producerService.create(req.body);
  sendSuccess(res, producer, 201);
});

const update = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const producer = await producerService.update(
      req.params.id,
      req.body,
    );
    sendSuccess(res, producer);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await producerService.remove(req.params.id);
    sendNoContent(res);
  },
);

export const producerController: CrudController = {
  getAll,
  getById,
  create,
  update,
  remove,
};
