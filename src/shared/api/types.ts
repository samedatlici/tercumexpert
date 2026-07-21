/**
 * API sözleşmeleri (backend-agnostik). UI yalnız bu tipleri görür.
 * Backend Laravel / Node / Supabase olabilir — sözleşme sabittir.
 */
export type QueryParams = Record<string, string | number | boolean | undefined>

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface ApiError {
  status: number
  code: string
  message: string
  fields?: Record<string, string[]>
}

/** Tüm somut client'ların uyacağı arayüz (Axios | Supabase | fetch adapter). */
export interface ApiClient {
  get<T>(path: string, params?: QueryParams): Promise<T>
  post<T, B = unknown>(path: string, body?: B): Promise<T>
  put<T, B = unknown>(path: string, body?: B): Promise<T>
  patch<T, B = unknown>(path: string, body?: B): Promise<T>
  delete<T>(path: string): Promise<T>
}
