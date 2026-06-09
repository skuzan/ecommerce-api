import { Router, type Router as ExpressRouter } from "express";
import productsRoutes from "./productRoutes.js";
import categoriesRoutes from "./categoryRoutes.js";
import producersRoutes from "./producerRoutes.js";
import tagsRoutes from "./tagRoutes.js";
import authRoutes from "./authRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import addressRoutes from "./addressRoutes.js";
import cartRoutes from "./cartRoutes.js";
import couponRoutes from "./couponRoutes.js";
import orderRoutes from "./orderRoutes.js";
import webhookRoutes from "./webhookRoutes.js";

const router: ExpressRouter = Router();

router.use("/auth", authRoutes);

router.use("/products", productsRoutes);

router.use("/categories", categoriesRoutes)

router.use("/producers", producersRoutes)

router.use("/tags", tagsRoutes)

router.use("/reviews", reviewRoutes);

router.use("/wishlists", wishlistRoutes);

router.use("/addresses", addressRoutes);

router.use("/cart", cartRoutes);

router.use("/coupons", couponRoutes);

router.use("/orders", orderRoutes);

router.use("/webhooks", webhookRoutes)

export default router;
