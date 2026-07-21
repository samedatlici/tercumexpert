import { HttpApiClient } from './http-client'
import type { ApiClient } from './types'

/**
 * Uygulama genelinde kullanılan tekil ApiClient örneği.
 * Backend değişince yalnız burada somut sınıf değişir; çağrı yapan kod aynı kalır.
 */
export const apiClient: ApiClient = new HttpApiClient()

export type { ApiClient } from './types'
