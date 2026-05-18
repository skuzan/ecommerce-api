import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { env } from "../config/env.js";
import { ValidationError } from "../utils/errors.js";


const productImageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/products")
    },
    filename: (_req, file, cb) => {
        const randomSuffix = crypto.randomBytes(8).toString("hex")
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `${Date.now()}-${randomSuffix}${ext}`)
    }
})

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (!env.UPLOAD_ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(
            new ValidationError("Geçersiz Dosya Tipi", {
                file: [
                    `İzin verilen tipler: ${env.UPLOAD_ALLOWED_TYPES.join(",")}`
                ]
            })
        )
    }

    cb(null, true)
}

export const uploadProductImage = multer({
    storage: productImageStorage,
    fileFilter,
    limits: {
        fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024
    }
})