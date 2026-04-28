import { Router, type Router as ExpressRouter } from "express";
import productsRoutes from "./productRoutes.js";
import categoriesRoutes from "./categoryRoutes.js";
import producersRoutes from "./producerRoutes.js";
import tagsRoutes from "./tagRoutes.js";
import authRoutes from "./authRoutes.js";

const router: ExpressRouter = Router();

router.use("/auth", authRoutes);

router.use("/products", productsRoutes);

router.use("/categories", categoriesRoutes)

router.use("/producers", producersRoutes)

router.use("/tags", tagsRoutes)


export default router;