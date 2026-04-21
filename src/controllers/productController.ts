import { type Request, type Response } from "express";
import { productService } from "../services/productService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { type ProductController } from "../types/controllerTypes.js";
import type { ProductQuery } from "../schemas/productSchemas.js";
import { sendNoContent, sendSuccess } from "../utils/response.js";

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const filters = (res.locals.validatedQuery ?? req.query) as ProductQuery;
  const result = await productService.findAll(filters);
  res.json({ success: true, ...result });
});

const getById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const product = await productService.findById(req.params.id);
    res.json({ success: true, data: product, meta: { cache: "no-cache" } });
  },
);

const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.create(req.body);
  sendSuccess(res, product, 201);
});

const update = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const product = await productService.update(req.params.id, req.body);
    sendSuccess(res, product);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await productService.remove(req.params.id);
    sendNoContent(res);
  },
);

const addTags = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const product = await productService.addTags(
      req.params.id,
      req.body.tagIds,
    );
    sendSuccess(res, product);
  },
);

const removeTags = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { tagIds } = req.body as { tagIds: string[] };
    const product = await productService.removeTags(req.params.id, tagIds);
    sendSuccess(res, product);
  },
);

const setTags = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { tagIds } = req.body as { tagIds: string[] };
    const product = await productService.setTags(req.params.id, tagIds);
    sendSuccess(res, product);
  },
);

export const productController: ProductController = {
  getAll,
  getById,
  create,
  update,
  remove,
  addTags,
  removeTags,
  setTags,
};
