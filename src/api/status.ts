import type { PageConfig } from '@/types/pages'

const BACKEND_API = import.meta.env.VITE_BACKEND_URI

export const fetchStatus = async (slug: string): Promise<PageConfig> => {
  const response = await fetch(
    `${BACKEND_API}/v1/public/pages/status/${slug}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
