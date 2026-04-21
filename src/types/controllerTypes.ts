import { type RequestHandler } from "express";

// ---- Temel CRUD Controller ----

export interface CrudController {
  getAll: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  remove: RequestHandler;
}

// ---- Product Controller (Tag işlemleri ek) ----

export interface ProductController extends CrudController {
  addTags: RequestHandler;
  removeTags: RequestHandler;
  setTags: RequestHandler;
}
