import type { StatusItemType } from '@/types/common'

const BACKEND_API = import.meta.env.VITE_BACKEND_URI

export const fetchGroupsApi = async (
  tenantId: string,
  reportId: string,
  token: string,
): Promise<StatusItemType[]> => {
  const response = await fetch(
    `${BACKEND_API}/v1/tenants/${tenantId}/reports/${reportId}/groups`,
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
