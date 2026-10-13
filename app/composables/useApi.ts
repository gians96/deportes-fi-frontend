import { useAuthStore } from '~/stores/auth'

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  formData?: FormData
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const auth = useAuthStore()
    const headers: Record<string, string> = {}

    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`
    }

    let body: BodyInit | undefined
    if (options.formData) {
      body = options.formData
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    return await $fetch<T>(path, {
      baseURL,
      method: options.method ?? 'GET',
      headers,
      query: options.query,
      body,
      onResponseError({ response }) {
        if (response.status === 401) {
          auth.clearSession()
        }
      },
    })
  }

  return {
    get: <T>(path: string, query?: ApiOptions['query']) =>
      request<T>(path, { method: 'GET', query }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    upload: <T>(
      path: string,
      formData: FormData,
      method: 'POST' | 'PATCH' | 'PUT' = 'POST',
    ) => request<T>(path, { method, formData }),
  }
}
