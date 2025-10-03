/**
 * API Error Handler Utilities
 * Centralized error handling for API routes
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error types
 */
export type ApiErrorType = 
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'internal';

/**
 * API Error Class
 */
export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: Error | ApiError | unknown,
  fallbackMessage: string = 'An error occurred'
): NextResponse<ApiResponse> {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Determine status code from error message
    const statusCode = determineStatusCode(error.message);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: fallbackMessage,
      },
      { status: statusCode }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: fallbackMessage,
      message: fallbackMessage,
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Determine HTTP status code from error message
 */
function determineStatusCode(message: string): number {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('please sign in')) {
    return HTTP_STATUS.UNAUTHORIZED;
  }
  
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('not allowed')) {
    return HTTP_STATUS.FORBIDDEN;
  }
  
  if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
    return HTTP_STATUS.NOT_FOUND;
  }
  
  if (lowerMessage.includes('invalid') || lowerMessage.includes('missing') || lowerMessage.includes('required')) {
    return HTTP_STATUS.BAD_REQUEST;
  }
  
  if (lowerMessage.includes('already exists') || lowerMessage.includes('conflict')) {
    return HTTP_STATUS.CONFLICT;
  }
  
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

/**
 * Create success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  );
}

/**
 * Validation error helper
 */
export function validationError(message: string, details?: any): ApiError {
  return new ApiError('validation', message, HTTP_STATUS.BAD_REQUEST, details);
}

/**
 * Authentication error helper
 */
export function authenticationError(message: string = 'Authentication required'): ApiError {
  return new ApiError('authentication', message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Authorization error helper
 */
export function authorizationError(message: string = 'Access denied'): ApiError {
  return new ApiError('authorization', message, HTTP_STATUS.FORBIDDEN);
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string = 'Resource'): ApiError {
  return new ApiError('not_found', `${resource} not found`, HTTP_STATUS.NOT_FOUND);
}

/**
 * Conflict error helper
 */
export function conflictError(message: string): ApiError {
  return new ApiError('conflict', message, HTTP_STATUS.CONFLICT);
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T = any>(
  handler: (...args: any[]) => Promise<NextResponse<ApiResponse<T>>>,
  fallbackMessage?: string
) {
  return async (...args: any[]): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, fallbackMessage);
    }
  };
}


