import { type Request, type Response } from "express";
import { productService } from "../services/productService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { type ProductController } from "../types/controllerTypes.js";
import type { ProductQuery } from "../schemas/productSchemas.js";
import { sendList, sendNoContent, sendSuccess } from "../utils/response.js";
import { ValidationError } from "../utils/errors.js";
import { productImageService } from "../services/productImageService.js";

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
  // req.body zaten doğrulanmış ve dönüştürülmüş — güvenle kullan
  const product = await productService.create({ ...req.body, ownerId: req.user!.userId });
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

const restore = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const product = await productService.restore(req.params.id);
    sendSuccess(res, product);
  },
);

const getDeleted = asyncHandler(async (_req: Request, res: Response) => {
  const items = await productService.findDeleted();
  sendList(res, items);
});

const uploadImage = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  if (!req.file) {
    throw new ValidationError("Dosya Zorunlu", {
      file: ["Image alanı bir dosya içermeli"]
    })
  }

  const imageUrl = `/uploads/products/${req.file.filename}`
  const product = await productService.setImage(req.params.id, imageUrl)
  sendSuccess(res, product)

})

const uploadGallery = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined

  if (!files || files.length === 0) {
    throw new ValidationError("En az 1 dosya zorunlu", {
      iamges: ["images alanı en az 1 dosya içermeli"]
    })
  }

  const created = await productImageService.addMany(req.params.id, files)
  sendSuccess(res, created, 201)
})

const removeImage = asyncHandler(async (req: Request<{ id: string, imageId: string }>, res: Response) => {
  await productImageService.remove(req.params.id, req.params.imageId)

  sendNoContent(res)

})

export const productController: ProductController = {
  getAll,
  getById,
  create,
  update,
  remove,
  restore,
  addTags,
  removeTags,
  setTags,
  getDeleted,
  uploadImage,
  uploadGallery,
  removeImage
};
