import type { Page, PageContent } from '@/types/pages'

const BACKEND_API = import.meta.env.VITE_BACKEND_URI

export const fetchSavePage = async (
  tenantId: string,
  data: PageContent,
  token: string,
): Promise<PageContent> => {
  const response = await fetch(`${BACKEND_API}/v1/tenants/${tenantId}/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    ) as Error & { errors?: string[] }
    error.errors = errorData.errors || []
    throw error
  }

  return response.json()
}

export const fetchUpdatePage = async (
  tenantId: string,
  pageId: string,
  data: PageContent,
  token: string,
): Promise<PageContent> => {
  const response = await fetch(
    `${BACKEND_API}/v1/tenants/${tenantId}/pages/${pageId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    ) as Error & { errors?: string[] }
    error.errors = errorData.errors || []
    throw error
  }

  return response.json()
}

export const fetchPage = async (
  tenantId: string,
  pageId: string,
  token: string,
): Promise<PageContent> => {
  const response = await fetch(
    `${BACKEND_API}/v1/tenants/${tenantId}/pages/${pageId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    )
  }

  return response.json()
}

export const fetchPages = async (
  tenantId: string,
  token: string,
  page: number = 1,
  size: number = 10,
): Promise<Page> => {
  const response = await fetch(
    `${BACKEND_API}/v1/tenants/${tenantId}/pages?page=${page}&size=${size}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    )
  }

  return response.json()
}

export const fetchDeletePage = async (
  tenantId: string,
  pageId: string,
  token: string,
): Promise<string> => {
  const response = await fetch(
    `${BACKEND_API}/v1/tenants/${tenantId}/pages/${pageId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    )
  }

  return response.json()
}

export const fetchCheckSlug = async (
  tenantId: string,
  slug: string,
  token: string,
): Promise<{ available: boolean }> => {
  const response = await fetch(
    `${BACKEND_API}/v1/tenants/${tenantId}/pages/check-slug/${slug}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    )
  }

  return response.json()
}
