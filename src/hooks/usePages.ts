import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import {
  fetchCheckSlug,
  fetchDeletePage,
  fetchPage,
  fetchPages,
  fetchSavePage,
  fetchUpdatePage,
} from '@/api/pages'
import type { Page, PageContent, PageCreateRequest } from '@/types/pages'

export const useSavePageMutation = () => {
  const queryClient = useQueryClient()
  const { token } = useAuth()
  return useMutation<
    PageContent,
    Error,
    { tenantId: string; data: PageCreateRequest }
  >({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string
      data: PageCreateRequest
    }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      return fetchSavePage(tenantId, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-pages'] })
    },
    onError: (error) => {
      console.error('Page save error:', error)
    },
  })
}

export const useUpdatePageMutation = () => {
  const { token } = useAuth()
  return useMutation<
    PageContent,
    Error,
    { tenantId: string; pageId: string; data: PageCreateRequest }
  >({
    mutationFn: ({
      tenantId,
      pageId,
      data,
    }: {
      tenantId: string
      pageId: string
      data: PageCreateRequest
    }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      return fetchUpdatePage(tenantId, pageId, data, token)
    },
    onError: (error) => {
      console.error('Page update error:', error)
    },
  })
}

export const useGetAllPagesQuery = (
  tenantId: string,
  page: number = 1,
  size: number = 10,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<Page, Error>({
    queryKey: ['all-pages', tenantId, page, size],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      return fetchPages(tenantId, token, page, size)
    },
    retry: false,
    enabled: enabled && !!token && !!tenantId,
  })
}

export const useGetPageQuery = (tenantId: string, pageId: string) => {
  const { token } = useAuth()

  return useQuery<PageContent, Error>({
    queryKey: ['page', tenantId, pageId],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      if (!pageId) {
        throw new Error('Page ID is required')
      }
      return fetchPage(tenantId, pageId, token)
    },
    retry: false,
    enabled: !!token && !!tenantId && !!pageId,
  })
}

export const useDeletePageMutation = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<string, Error, { tenantId: string; pageId: string }>({
    mutationFn: ({
      tenantId,
      pageId,
    }: {
      tenantId: string
      pageId: string
    }) => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      if (!pageId) {
        throw new Error('Page ID is required')
      }
      return fetchDeletePage(tenantId, pageId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-pages'] })
      queryClient.invalidateQueries({ queryKey: ['user-pages'] })
    },
    onError: (error) => {
      console.error('Page delete error:', error)
    },
  })
}

export const useCheckSlugQuery = (
  tenantId: string,
  slug: string,
  enabled: boolean = true,
) => {
  const { token } = useAuth()

  return useQuery<{ available: boolean }, Error>({
    queryKey: ['check-slug', tenantId, slug],
    queryFn: () => {
      if (!token) {
        throw new Error('No authentication token available')
      }
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      if (!slug) {
        throw new Error('Slug is required')
      }
      return fetchCheckSlug(tenantId, slug, token)
    },
    retry: false,
    enabled: !!token && !!tenantId && !!slug && enabled,
  })
}
