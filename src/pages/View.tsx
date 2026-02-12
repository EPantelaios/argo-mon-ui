import { useGetAllPagesQuery, useDeletePageMutation } from '@/hooks/usePages'
import {
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/16/solid'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast, Toaster } from 'sonner'
import { useState } from 'react'
import Button from '@/components/Button'
import { useGetUserTenants } from '@/hooks/useTenants'
import type { PageContent } from '@/types/pages'

const pageSize = 10

// Mock data for testing
const mockPages: PageContent[] = [
  {
    id: '1',
    name: 'Production Services',
    slug: 'production-services',
    tenant_id: 'tenant-1',
    report: 'Critical-Report-A',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-02-10T14:22:00Z',
    config: {
      title: 'Production Services Status',
      description: 'Monitor all production services',
      groups: [],
    },
  },
  {
    id: '2',
    name: 'Development Environment',
    slug: 'dev-environment',
    tenant_id: 'tenant-1',
    report: 'Dev-Report-B',
    created_at: '2025-01-20T08:15:00Z',
    updated_at: '2025-02-09T16:45:00Z',
    config: {
      title: 'Development Status',
      description: 'Development infrastructure monitoring',
      groups: [],
    },
  },
  {
    id: '3',
    name: 'API Gateway Status',
    slug: 'api-gateway',
    tenant_id: 'tenant-1',
    report: 'Gateway-Report-C',
    created_at: '2025-02-01T12:00:00Z',
    updated_at: '2025-02-11T09:30:00Z',
    config: {
      title: 'API Gateway Health',
      description: 'Real-time API gateway metrics',
      groups: [],
    },
  },
  {
    id: '4',
    name: 'Database Cluster',
    slug: 'database-cluster',
    tenant_id: 'tenant-1',
    report: 'DB-Report-D',
    created_at: '2025-01-10T14:20:00Z',
    updated_at: '2025-02-08T11:15:00Z',
    config: {
      title: 'Database Status',
      description: 'Database cluster health monitoring',
      groups: [],
    },
  },
  {
    id: '5',
    name: 'Microservices Overview',
    slug: 'microservices',
    tenant_id: 'tenant-1',
    report: 'Micro-Report-E',
    created_at: '2025-01-25T16:45:00Z',
    updated_at: '2025-02-10T13:20:00Z',
    config: {
      title: 'Microservices Health',
      description: 'All microservices status dashboard',
      groups: [],
    },
  },
]

const View = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [tenantId, setTenantId] = useState<string>('')
  const { data: tenantsData } = useGetUserTenants(1, 100, undefined, true)
  const { data } = useGetAllPagesQuery(tenantId, currentPage, pageSize)

  // Use mock data when tenant is selected but no real data
  const displayData =
    tenantId && (!data || !data.content?.length)
      ? {
          content: mockPages,
          size_of_page: pageSize,
          number_of_page: currentPage,
          total_elements: mockPages.length,
          total_pages: Math.ceil(mockPages.length / pageSize),
          links: [],
        }
      : data
  const deleteMutation = useDeletePageMutation()
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<{
    id: string
    name: string
    tenantId: string
  } | null>(null)

  const handlePageView = (slug: string) => {
    window.open(`/status/${slug}`, '_blank')
  }

  const handlePageEdit = (id: string | undefined) => {
    if (id) {
      navigate(`/build/${id}`)
    }
  }

  const handlePageDeleteClick = (id: string | undefined, name: string) => {
    if (id && tenantId) {
      setPageToDelete({ id, name, tenantId })
      setDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = () => {
    if (!pageToDelete) return

    deleteMutation.mutate(
      { tenantId: pageToDelete.tenantId, pageId: pageToDelete.id },
      {
        onSuccess: () => {
          toast.success('Status page deleted successfully!')
          setDeleteDialogOpen(false)
          setPageToDelete(null)

          if (
            displayData?.content &&
            displayData.content.length === 1 &&
            currentPage > 1
          ) {
            setCurrentPage((prev) => prev - 1)
          }
        },
        onError: (error) => {
          toast.error(`Failed to delete page: ${error.message}`)
        },
      },
    )
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPageToDelete(null)
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <Toaster richColors position="top-center" duration={2000} />
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Status Page"
        message={
          pageToDelete ? (
            <>
              Are you sure you want to delete status page{' '}
              <strong>{pageToDelete.name}</strong> ?
              <br />
              <span className="text-amber-600 font-medium">
                This action cannot be undone.
              </span>
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
      <div className="page-container">
        <div className="pb-1 mb-4 md:mb-6 px-2 md:px-0 flex items-center justify-between">
          <div>
            <h1 className="page-title">Status Pages</h1>
            <p className="page-subtitle">View and manage your pages</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/status-pages/build')}
          >
            Create New Status Page
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant: <span className="text-red-600">*</span>
            </label>
            <select
              className="input w-full max-w-md"
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">Select a tenant</option>
              {tenantsData?.content.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.info.name}
                </option>
              ))}
            </select>
          </div>

          {!tenantId && (
            <div className="text-center py-16">
              <p className="text-base text-gray-500">
                Please select a tenant to view status pages
              </p>
            </div>
          )}

          {tenantId && (
            <div className="max-h-[calc(100vh-280px)] overflow-auto mt-4">
              <table className="w-full table-fixed">
                <thead className="border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="w-[20%] px-2 lg:px-4 py-1 text-left text-sm font-semibold text-gray-900 tracking-wider">
                      Name
                    </th>
                    <th className="w-[20%] px-2 lg:px-4 py-1 text-left text-sm font-semibold text-gray-900 tracking-wider">
                      Path
                    </th>
                    <th className="hidden md:table-cell w-[15%] px-2 lg:px-4 py-1 text-left text-sm font-semibold text-gray-900 tracking-wider">
                      Report
                    </th>
                    <th className="hidden sm:table-cell w-[15%] px-2 lg:px-4 py-1 text-left text-sm font-semibold text-gray-900 tracking-wider">
                      Updated
                    </th>
                    <th className="w-[10%] px-2 lg:px-4 py-1 text-left text-sm font-semibold text-gray-900 tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData?.content && displayData.content?.length > 0 ? (
                    displayData.content.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-2 lg:px-4 py-3 md:py-4">
                          <span className="text-xs md:text-sm text-gray-900 break-words">
                            {item.name}
                          </span>
                        </td>
                        <td className="px-2 lg:px-4 py-3 md:py-4">
                          <span className="text-xs md:text-sm text-gray-700 font-mono break-all">
                            {item.slug}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-2 lg:px-4 py-4 text-sm text-gray-700">
                          <span className="break-words">{item.report}</span>
                        </td>
                        <td className="hidden sm:table-cell px-2 lg:px-4 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                          {item?.updated_at
                            ? new Date(item.updated_at).toLocaleDateString(
                                'en-GB',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'UTC',
                                },
                              )
                            : item?.created_at
                              ? new Date(item.created_at).toLocaleDateString(
                                  'en-GB',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'UTC',
                                  },
                                )
                              : null}
                        </td>
                        <td className="px-1 lg:px-3 py-3 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handlePageView(item.slug)}
                              className="tooltip p-1 md:p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              data-tip="View"
                              aria-label="View Page"
                            >
                              <ArrowTopRightOnSquareIcon className="size-4 md:size-5" />
                            </button>
                            <button
                              onClick={() => handlePageEdit(item.id)}
                              className="tooltip p-1 md:p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              data-tip="Edit"
                              aria-label="Edit Page"
                            >
                              <PencilSquareIcon className="size-4 md:size-5" />
                            </button>
                            <button
                              onClick={() =>
                                handlePageDeleteClick(item.id, item.name)
                              }
                              className="tooltip p-1 md:p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              data-tip="Delete"
                              aria-label="Delete Page"
                            >
                              <TrashIcon className="size-4 md:size-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <p className="text-sm md:text-base text-gray-500">
                          No status pages found for this tenant
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {tenantId &&
          displayData?.content &&
          displayData.content?.length > 0 && (
            <div className="flex items-center justify-between px-4 py-1 border border-gray-200 rounded-lg my-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {displayData.total_pages}
                </span>
                <span className="text-sm text-gray-500">
                  ({displayData.total_elements} total status pages)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="size-5 text-gray-600" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(displayData.total_pages, prev + 1),
                    )
                  }
                  disabled={currentPage >= displayData.total_pages}
                  className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="size-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

export default View
