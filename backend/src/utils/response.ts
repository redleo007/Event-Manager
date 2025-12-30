export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

export const errorResponse = (error: string): ApiResponse<null> => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
});
