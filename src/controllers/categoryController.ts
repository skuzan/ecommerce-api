import { type Request, type Response } from "express";
import { categoryService } from "../services/categoryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { type CrudController } from "../types/controllerTypes.js";
import { sendList, sendNoContent, sendSuccess } from "../utils/response.js";

const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.findAll();
  sendSuccess(res, categories);
});

const getById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const category = await categoryService.findById(req.params.id);
    sendSuccess(res, category);
  },
);

const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.create(req.body);
  sendSuccess(res, category, 201);
});

const update = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);

    sendSuccess(res, category);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await categoryService.remove(req.params.id);
    sendNoContent(res);
  },
);

const restore = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const item = await categoryService.restore(req.params.id);
  sendSuccess(res, item);
});

const getDeleted = asyncHandler(async (_req: Request, res: Response) => {
  const items = await categoryService.findDeleted();
  sendList(res, items);
});

export const categoryController: CrudController = {
  getAll,
  getById,
  create,
  update,
  remove,
  restore,
  getDeleted,
};
