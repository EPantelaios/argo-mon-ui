import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import {
  fetchTenants,
  fetchTenantById,
  fetchCreateTenant,
  fetchUpdateTenant,
  fetchDeleteTenant,
  fetchAssignTenantProjects,
  fetchTenantProjects,
  fetchContactTypes,
  fetchUserTenants,
  fetchUserTenantById,
  fetchUpdateUserTenant,
  fetchUserTenantProjects,
  fetchTenantStatus,
  updateTenantStatus,
  fetchMembers,
  fetchTenantMembers,
  addMemberDirectly,
  removeMemberFromTenant,
  revokeInvitation,
  fetchTenantReports,
  fetchTenantReportById,
  fetchTenantMetricProfile,
} from '@/api/tenants'
import type {
  Job,
  Tenant,
  TenantList,
  TenantProjectAssignment,
  Member,
  PaginatedMembersResponse,
  ReportListItem,
  ReportDetail,
  MetricProfileResponse,
} from '@/types/tenants'

export const useGetTenants = (
  page: number = 1,
  size: number = 10,
  search?: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<TenantList, Error>({
    queryKey: ['tenants', page, size, search],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchTenants(token, page, size, search)
    },
    retry: false,
    refetchOnMount: 'always',
    enabled: enabled && !!token,
  })
}

export const useGetTenantById = (id: string, enabled: boolean = true) => {
  const { token } = useAuth()

  return useQuery<Tenant, Error>({
    queryKey: ['tenant', id],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchTenantById(id, token)
    },
    retry: false,
    enabled: enabled && !!token && !!id,
  })
}

export const useCreateTenantMutation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<Tenant, Error, Tenant>({
    mutationFn: (data: Tenant) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchCreateTenant(data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error) => {
      console.error('Tenant create error:', error)
    },
  })
}

export const useUpdateTenantMutation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<Tenant, Error, { id: string; data: Tenant }>({
    mutationFn: ({ id, data }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchUpdateTenant(id, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error) => {
      console.error('Tenant update error:', error)
    },
  })
}

export const useDeleteTenantMutation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchDeleteTenant(id, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error) => {
      console.error('Tenant delete error:', error)
    },
  })
}

export const useAssignTenantProjectsMutation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, TenantProjectAssignment>({
    mutationFn: (data: TenantProjectAssignment) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchAssignTenantProjects(data, token)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-projects', variables.tenant_id],
      })
      queryClient.invalidateQueries({ queryKey: ['all-projects'] })
    },
    onError: (error) => {
      console.error('Tenant project assignment error:', error)
    },
  })
}

export const useGetTenantProjects = (tenantId: string) => {
  const { token } = useAuth()

  return useInfiniteQuery<TenantList, Error>({
    queryKey: ['tenant-projects', tenantId],
    queryFn: ({ pageParam = 1 }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchTenantProjects(tenantId, token, pageParam as number, 10)
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.number_of_page
      const totalPages = lastPage.total_pages
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    initialPageParam: 1,
    retry: false,
    enabled: !!token && !!tenantId,
    refetchOnMount: 'always',
  })
}

export const useGetContactTypes = () => {
  const { token } = useAuth()

  return useQuery<string[], Error>({
    queryKey: ['contact-types'],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchContactTypes(token)
    },
    retry: false,
    enabled: !!token,
  })
}

// Hooks for admin and viewer roles
export const useGetUserTenants = (
  page: number = 1,
  size: number = 10,
  search?: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<TenantList, Error>({
    queryKey: ['user-tenants', page, size, search],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchUserTenants(token, page, size, search)
    },
    retry: false,
    enabled: enabled && !!token,
  })
}

export const useGetUserTenantById = (id: string, enabled: boolean = true) => {
  const { token } = useAuth()

  return useQuery<Tenant, Error>({
    queryKey: ['user-tenant', id],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchUserTenantById(id, token)
    },
    retry: false,
    enabled: enabled && !!token && !!id,
  })
}

export const useUpdateUserTenantMutation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<Tenant, Error, { id: string; data: Tenant }>({
    mutationFn: ({ id, data }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchUpdateUserTenant(id, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['user-tenant'] })
    },
    onError: (error) => {
      console.error('User tenant update error:', error)
    },
  })
}

export const useGetUserTenantProjects = (tenantId: string) => {
  const { token } = useAuth()

  return useInfiniteQuery<TenantList, Error>({
    queryKey: ['user-tenant-projects', tenantId],
    queryFn: ({ pageParam = 1 }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchUserTenantProjects(tenantId, token, pageParam as number, 10)
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.number_of_page
      const totalPages = lastPage.total_pages
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    initialPageParam: 1,
    retry: false,
    enabled: !!token && !!tenantId,
    refetchOnMount: 'always',
  })
}

export const useGetTenantStatus = (id: string) => {
  const { token } = useAuth()

  return useQuery<{ name: string; status: { jobs: Job[] } }, Error>({
    queryKey: ['tenant-status', id],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchTenantStatus(id, token)
    },
    retry: false,
    enabled: !!token && !!id,
  })
}

export const useUpdateTenantStatusMutation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<
    { name: string; status: { jobs: Job[] } },
    Error,
    { id: string; data: { jobs: Job[] } }
  >({
    mutationFn: ({ id, data }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return updateTenantStatus(id, data, token)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-status', variables.id],
      })
    },
    onError: (error) => {
      console.error('Tenant status update error:', error)
    },
  })
}

export const useGetMembers = (
  page?: number,
  size?: number,
  search?: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<PaginatedMembersResponse, Error>({
    queryKey: ['members', page, size, search],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchMembers(token, page, size, search)
    },
    retry: false,
    enabled: enabled && !!token,
  })
}

export const useGetTenantMembers = (
  tenantId: string,
  page: number = 1,
  size: number = 10,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<PaginatedMembersResponse, Error>({
    queryKey: ['tenant-members', tenantId, page, size],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchTenantMembers(tenantId, token, page, size)
    },
    retry: false,
    enabled: enabled && !!token && !!tenantId,
    refetchOnMount: 'always',
  })
}

export const useGetUserProfileById = (
  username: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<Member | undefined, Error>({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      const response = await fetchMembers(token, 1, 1, username)
      return response.content.length > 0 ? response.content[0] : undefined
    },
    retry: false,
    enabled: enabled && !!token && !!username,
    refetchOnMount: 'always',
  })
}

export const useAddMemberDirectly = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<
    void,
    Error,
    {
      tenantId: string
      data: { username: string; email: string; role: string }
    }
  >({
    mutationFn: ({ tenantId, data }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return addMemberDirectly(tenantId, data, token)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-members', variables.tenantId],
      })
    },
    onError: (error) => {
      console.error('Add member error:', error)
    },
  })
}

export const useRemoveMemberFromTenant = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, { tenantId: string; memberId: string }>({
    mutationFn: ({ tenantId, memberId }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return removeMemberFromTenant(tenantId, memberId, token)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-members', variables.tenantId],
      })
      queryClient.invalidateQueries({
        queryKey: ['members'],
      })
      queryClient.invalidateQueries({
        queryKey: ['user-profile', variables.memberId],
      })
    },
    onError: (error) => {
      console.error('Remove member error:', error)
    },
  })
}

export const useGetTenantByName = () => {
  const { token } = useAuth()

  return useMutation<TenantList | null, Error, string>({
    mutationFn: (tenantName: string) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetchTenants(token, 1, 1, tenantName)
    },
    onError: (error) => {
      console.error('Fetch tenant by name error:', error)
    },
  })
}

export const useRevokeInvitation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, { tenantId: string; invitationId: string }>({
    mutationFn: ({ tenantId, invitationId }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      return revokeInvitation(tenantId, invitationId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] })
    },
    onError: (error) => {
      console.error('Revoke invitation error:', error)
    },
  })
}

export const useGetTenantReports = (
  tenantId: string,
  search?: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<ReportListItem[], Error>({
    queryKey: ['tenant-reports', tenantId, search],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      return fetchTenantReports(tenantId, token, search)
    },
    retry: false,
    enabled: enabled && !!token && !!tenantId,
  })
}

export const useGetTenantReportById = (
  tenantId: string,
  reportId: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<ReportDetail, Error>({
    queryKey: ['tenant-report', tenantId, reportId],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId || !reportId) {
        throw new Error('Tenant ID and Report ID are required')
      }
      return fetchTenantReportById(tenantId, reportId, token)
    },
    retry: false,
    enabled: enabled && !!token && !!tenantId && !!reportId,
  })
}

export const useGetTenantMetricProfile = (
  tenantId: string,
  profileId: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<MetricProfileResponse, Error>({
    queryKey: ['tenant-metric-profile', tenantId, profileId],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId || !profileId) {
        throw new Error('Tenant ID and Profile ID are required')
      }
      return fetchTenantMetricProfile(tenantId, profileId, token)
    },
    retry: false,
    enabled: enabled && !!token && !!tenantId && !!profileId,
  })
}
