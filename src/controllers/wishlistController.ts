import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { wishlistService } from "../services/wishlistService.js";
import { sendList, sendNoContent, sendSuccess } from "../utils/response.js";
import type { WishlistController } from "../types/controllerTypes.js";


const list = asyncHandler(async (req: Request, res: Response) => {
  const items = await wishlistService.list(req.user!.userId);
  sendList(res, items);
});

const add = asyncHandler(
  async (req: Request<{ productId: string }>, res: Response) => {
    const item = await wishlistService.add(
      req.user!.userId,
      req.params.productId,
    );
    sendSuccess(res, item, 201);
  },
);

const remove = asyncHandler(
  async (req: Request<{ productId: string }>, res: Response) => {
    await wishlistService.remove(req.user!.userId, req.params.productId);
    sendNoContent(res);
  },
);


export const wishlistController: WishlistController = { list, add, remove };