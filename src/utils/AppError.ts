import { HTTP_STATUS } from "../constants";

/** Error carrying an HTTP status code; thrown by services and handled by errorMiddleware. */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = HTTP_STATUS.BAD_REQUEST) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }

  static badRequest(message: string): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  static unauthorized(message: string): AppError {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message: string): AppError {
    return new AppError(message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message: string): AppError {
    return new AppError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, HTTP_STATUS.CONFLICT);
  }

  static internal(message: string): AppError {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
