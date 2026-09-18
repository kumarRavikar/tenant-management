import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: unknown;
  error?: {
    code?: string;
    details?: unknown;
  };
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: unknown
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
  };

  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: unknown
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    error: {
      ...(code && { code }),
      ...(details !== undefined && { details }),
    },
  };

  return res.status(statusCode).json(responsePayload);
};
