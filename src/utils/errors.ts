export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string = "APP-ERROR",
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 404 Kaynak Bulunamadı
export class NotFoundError extends AppError {
  constructor(resource: string = " Kaynak") {
    super(`${resource} bulunamadı`, 404, "NOT_FOUND");
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// 409 Çakışma
export class ConflictError extends AppError {
  constructor(message: string = "Bu kayıt zaten mevcut") {
    super(message, 409, "CONFLICT");
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

// 422 Validasyon HAtası
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details: Record<string, string[]>,
  ) {
    super(message, 422, "VALIDATION_ERROR");
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// 401 Yetkisiz Erişim
export class UnauthorizedError extends AppError {
  constructor(message: string = "Lütfen Giriş yapın") {
    super(message, 401, "UNAUTHORIZED");
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

// 403 Yasaklı Erişim
export class ForbiddenError extends AppError {
  constructor(message: string = "Yetkiniz Yok") {
    super(message, 403, "FORBIDDEN");
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
