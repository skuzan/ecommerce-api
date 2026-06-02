import { type RequestHandler } from "express";

// ---- Temel CRUD Controller ----

export interface CrudController {
  getAll: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  remove: RequestHandler;
  restore: RequestHandler;
  getDeleted: RequestHandler;
}

// ---- Product Controller (Tag işlemleri ek) ----

export interface ProductController extends CrudController {
  addTags: RequestHandler;
  removeTags: RequestHandler;
  setTags: RequestHandler;
  getDeleted: RequestHandler;
  uploadImage:RequestHandler;
  uploadGallery:RequestHandler;
  removeImage:RequestHandler;
  search:RequestHandler;
}

export interface AuthController {
  register: RequestHandler;
  verifyEmail: RequestHandler;
  login: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  logoutAll: RequestHandler;
  me: RequestHandler;
  session: RequestHandler;
  forgotPassword: RequestHandler;
  resetPassword: RequestHandler;
  resendVerification: RequestHandler;
}

export interface ReviewController {
  list: RequestHandler;
  stats: RequestHandler;
  upsert: RequestHandler;
  remove: RequestHandler;
}

export interface WishlistController {
  list: RequestHandler;
  add: RequestHandler;
  remove: RequestHandler;
}

export interface AddressController extends CrudController {
  setDefault: RequestHandler;
}

export interface CartController {
  get: RequestHandler;
  addItem: RequestHandler;
  updateItem: RequestHandler;
  removeItem: RequestHandler;
  clear: RequestHandler;
  applyCoupon: RequestHandler;
  removeCoupon: RequestHandler;
}

export interface CouponController extends CrudController {}
