import axios, { type AxiosInstance } from 'axios'
import { env } from '@/shared/config/env'
import type { ApiClient, ApiError, QueryParams } from './types'

/**
 * Axios tabanlı varsayılan ApiClient.
 * Backend Supabase olursa yerine SupabaseApiClient yazılır — UI DEĞİŞMEZ.
 */
function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const data = error.response?.data as Partial<ApiError> | undefined
    return {
      status,
      code: data?.code ?? 'REQUEST_FAILED',
      message: data?.message ?? error.message,
      ...(data?.fields ? { fields: data.fields } : {}),
    }
  }
  return { status: 0, code: 'UNKNOWN', message: 'Beklenmeyen bir hata oluştu.' }
}

export class HttpApiClient implements ApiClient {
  private readonly instance: AxiosInstance

  constructor(baseURL: string = env.VITE_API_BASE_URL) {
    this.instance = axios.create({
      baseURL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(normalizeError(error)),
    )
  }

  async get<T>(path: string, params?: QueryParams): Promise<T> {
    const { data } = await this.instance.get<T>(path, { params })
    return data
  }

  async post<T, B = unknown>(path: string, body?: B): Promise<T> {
    const { data } = await this.instance.post<T>(path, body)
    return data
  }

  async put<T, B = unknown>(path: string, body?: B): Promise<T> {
    const { data } = await this.instance.put<T>(path, body)
    return data
  }

  async patch<T, B = unknown>(path: string, body?: B): Promise<T> {
    const { data } = await this.instance.patch<T>(path, body)
    return data
  }

  async delete<T>(path: string): Promise<T> {
    const { data } = await this.instance.delete<T>(path)
    return data
  }
}
