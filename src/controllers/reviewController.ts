import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { reviewService } from "../services/reviewService.js";
import type {
  ReviewListQuery,
  UpsertReviewInput,
} from "../schemas/reviewSchemas.js";
import { sendNoContent, sendSuccess } from "../utils/response.js";
import type { ReviewController } from "../types/controllerTypes.js";

const list = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { cursor, limit } = res.locals.query as ReviewListQuery;
    const productId = req.params["id"]!;
    const { data, meta } = await reviewService.findAllByProduct(
      productId,
      cursor,
      limit,
    );

    res.json({ success: true, data, meta });
  },
);

const stats = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const result = await reviewService.getStats(req.params.id);
    sendSuccess(res, result);
  },
);

const upsert = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const review = await reviewService.upsert(
      req.user!.userId,
      req.params.id,
      req.body as UpsertReviewInput,
    );
    sendSuccess(res, review);
  },
);

const remove = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    await reviewService.remove(req.user!.userId, req.user!.role, req.params.id);
    sendNoContent(res);
  },
);

export const reviewController: ReviewController = {
  list,
  stats,
  upsert,
  remove,
};