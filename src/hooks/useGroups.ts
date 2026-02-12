import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { fetchGroupsApi } from '@/api/data'
import type { StatusItemType } from '@/types/common'

export const useGroupsMutation = () => {
  const { token } = useAuth()

  return useMutation<
    StatusItemType[],
    Error,
    { tenantId: string; reportId: string }
  >({
    mutationFn: ({ tenantId, reportId }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchGroupsApi(tenantId, reportId, token)
    },
    onError: (error) => {
      console.error('Retrieve Page error:', error)
    },
  })
}
