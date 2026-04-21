import { type Request, type Response } from "express";
import { tagService } from "../services/tagService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { type CrudController } from "../types/controllerTypes.js";
import type { CreateTagInput, UpdateTagInput } from "../schemas/tagSchemas.js";
import { sendNoContent, sendSuccess } from "../utils/response.js";

const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const tags = await tagService.findAll();
  sendSuccess(res, tags);
});

const getById = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const tag = await tagService.findById(req.params.id);
  sendSuccess(res, tag);
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const tag = await tagService.create(req.body as CreateTagInput);
  sendSuccess(res, tag, 201);
});

const update = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const tag = await tagService.update(
    req.params.id,
    req.body as UpdateTagInput,
  );
  sendSuccess(res, tag);
});

const remove = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await tagService.remove(req.params.id);
  sendNoContent(res);
});

export const tagController: CrudController = {
  getAll,
  getById,
  create,
  update,
  remove,
};
