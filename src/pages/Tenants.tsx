import { useState, useEffect } from 'react'
import { useGetUserTenants, useDeleteTenantMutation } from '@/hooks/useTenants'
import { useGetUserProfile } from '@/hooks/useProfile'
import { useAuth } from '@/auth/useAuth'
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  ListBulletIcon,
  UserGroupIcon,
  Bars3Icon,
  ShieldCheckIcon,
  Square3Stack3DIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/16/solid'
import Button from '@/components/Button'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import styles from './Tenants.module.css'
import type { UserGroup } from '@/types/profile'
import type { Job, JobStatus } from '@/types/tenants'
import LoadingSpinner from '@/components/LoadingSpinner'

const pageSize = 9

const JOB_NAMES: Record<string, string> = {
  INIT_AMS: 'ARGO Messaging Service (AMS) Status',
  INIT_MONGO: 'MongoDB Status',
  CREATE_DOMAIN_NAMES: 'Domain Names Creation Status',
}

const getStatusDisplay = (status: JobStatus): string => {
  if (status === 'UNKNOWN') return 'Unknown'
  if (status === 'INITIALISING') return 'Initialising'
  if (status === 'INITIALISED') return 'Initialised'
  if (status === 'FAILED_INITIALISATION') return 'Failed Initialisation'
  if (status === 'IN_PROGRESS') return 'In Progress'
  if (status === 'COMPLETED') return 'Completed'
  if (status === 'FAILED') return 'Failed'
  return status
}

const getStatusBadgeClass = (status: JobStatus): string => {
  if (status === 'UNKNOWN') return styles['status-unknown']
  if (status === 'INITIALISING') return styles['status-initialising']
  if (status === 'INITIALISED') return styles['status-initialised']
  if (status === 'FAILED_INITIALISATION')
    return styles['status-failed_initialisation']
  if (status === 'IN_PROGRESS') return styles['status-in_progress']
  if (status === 'COMPLETED') return styles['status-completed']
  if (status === 'FAILED') return styles['status-failed']
  return ''
}

const Tenants = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data: userProfileData } = useGetUserProfile()

  const isSuperAdmin = profile?.roles?.includes('super_admin')

  const { data, isLoading } = useGetUserTenants(
    currentPage,
    pageSize,
    searchQuery,
  )

  const deleteMutation = useDeleteTenantMutation()

  const getRoleForTenant = (tenantName: string): string | null => {
    if (isSuperAdmin || !userProfileData?.groups) return null

    const group = userProfileData?.groups?.find(
      (g: UserGroup) => g?.name === tenantName,
    )
    return group?.role || null
  }

  const isTenantAdmin = (tenantName: string) => {
    if (!tenantName) return false
    if (isSuperAdmin) return false
    if (!userProfileData?.groups) return false

    const group = userProfileData?.groups?.find(
      (g: UserGroup) => g?.name === tenantName,
    )
    return group?.role === 'admin'
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const tenants =
    (data &&
      data?.content?.length > 0 &&
      data.content.map((tenant) => ({
        ...tenant?.info,
        id: tenant?.id,
        status: tenant?.status,
      }))) ||
    []

  const handleEdit = (tenantId: string) => {
    navigate(`/tenants/edit/${tenantId}`)
  }

  const handleAssignProjects = (tenantId: string) => {
    navigate(`/tenants/${tenantId}/projects/assign`)
  }

  const handleManageMembers = (tenantId: string) => {
    navigate(`/tenants/${tenantId}/members`)
  }

  const handleViewDetails = (tenantId: string) => {
    navigate(`/tenants/${tenantId}/details`)
  }

  const handleDeleteClick = (id: string, name: string) => {
    setTenantToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!tenantToDelete) return

    deleteMutation.mutate(tenantToDelete.id, {
      onSuccess: () => {
        toast.success('Tenant deleted successfully!')
        setDeleteDialogOpen(false)
        setTenantToDelete(null)

        if (data?.content && data.content.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1)
        }
      },
      onError: (error) => {
        toast.error(`Failed to delete tenant: ${error.message}`)
      },
    })
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setTenantToDelete(null)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  return (
    <div className="page-container">
      <Toaster richColors position="top-center" duration={2000} />
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Tenant"
        message={
          tenantToDelete ? (
            <>
              Are you sure you want to delete tenant{' '}
              <strong>{tenantToDelete.name}</strong> ?
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
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">
            {isSuperAdmin
              ? 'Manage and create new tenants for the monitoring service'
              : 'View your tenants'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/tenants/create')}
          >
            Create New Tenant
          </Button>
        )}
      </div>

      <div className={styles['search-container']}>
        <div className={styles['search-input-wrapper']}>
          <MagnifyingGlassIcon className={styles['search-icon']} />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles['search-input']}
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className={styles['clear-button']}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      ) : (
        <div className={styles.grid}>
          {tenants && tenants?.length > 0
            ? tenants.map((tenant) => (
                <div key={tenant.id} className={styles.card}>
                  <div className={styles['card-content']}>
                    <div className={styles['card-header']}>
                      <div className={styles['image-container']}>
                        {tenant.image ? (
                          <img
                            className={styles['tenant-image']}
                            src={tenant.image}
                          />
                        ) : (
                          <div className={styles['tenant-fallback']}>
                            <span className={styles['fallback-text']}>
                              {tenant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={styles['info-container']}>
                        <div className={styles['name-role-container']}>
                          <h3
                            className={styles['tenant-name']}
                            title={tenant.name}
                          >
                            {tenant.name}
                          </h3>
                          {(() => {
                            if (isSuperAdmin) {
                              return (
                                <span
                                  className={`${styles['role-badge']} ${styles['admin']}`}
                                >
                                  Super Admin
                                </span>
                              )
                            }
                            const role = getRoleForTenant(tenant.name)
                            return role ? (
                              <span
                                className={`${styles['role-badge']} ${styles[role.toLowerCase()]}`}
                              >
                                {role.toLowerCase() === 'admin'
                                  ? 'Admin'
                                  : role.toLowerCase() === 'viewer'
                                    ? 'Member'
                                    : null}
                              </span>
                            ) : null
                          })()}
                        </div>
                        <p
                          className={styles['tenant-email']}
                          title={tenant.email}
                        >
                          {tenant.email}
                        </p>
                      </div>
                    </div>
                    <p className={styles['tenant-description']}>
                      {tenant.description}
                    </p>
                    {(isSuperAdmin || isTenantAdmin(tenant.name)) &&
                      tenant.status?.jobs &&
                      tenant.status.jobs.length > 0 && (
                        <div className={styles['status-section']}>
                          <div className={styles['status-list']}>
                            {tenant.status.jobs
                              .filter(
                                (job: Job) => job.name !== 'CHECK_READINESS',
                              )
                              .map((job: Job) => (
                                <span
                                  key={job.name}
                                  className={`${styles['status-badge']} ${getStatusBadgeClass(job.status)}`}
                                  title={`${JOB_NAMES[job.name] || job.name}: ${getStatusDisplay(job.status)}`}
                                >
                                  {job.name === 'INIT_AMS'
                                    ? 'AMS'
                                    : job.name === 'INIT_MONGO'
                                      ? 'MongoDB'
                                      : job.name === 'CREATE_DOMAIN_NAMES'
                                        ? 'Domain Names'
                                        : job.name}
                                  : {getStatusDisplay(job.status)}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                  <div className={styles['card-footer']}>
                    <button
                      aria-label="View Tenant Details"
                      className={`${styles['action-button']} ${styles.view} tooltip`}
                      data-tip="View Tenant Details"
                      onClick={() => handleViewDetails(tenant.id!)}
                    >
                      <Bars3Icon className={styles['action-icon']} />
                    </button>
                    {(isSuperAdmin || isTenantAdmin(tenant.name)) && (
                      <>
                        <button
                          aria-label="Edit Tenant"
                          className={`${styles['action-button']} ${styles.edit} tooltip`}
                          data-tip="Edit Tenant"
                          onClick={() => handleEdit(tenant.id!)}
                        >
                          <PencilSquareIcon className={styles['action-icon']} />
                        </button>
                        <button
                          aria-label="Manage Members"
                          className={`${styles['action-button']} ${styles['manage-members']} tooltip`}
                          data-tip="Manage Members"
                          onClick={() => handleManageMembers(tenant.id!)}
                        >
                          <UserGroupIcon className={styles['action-icon']} />
                        </button>
                      </>
                    )}
                    {!isSuperAdmin && (
                      <button
                        aria-label="View Assigned Projects"
                        className={`${styles['action-button']} ${styles.assign} tooltip`}
                        data-tip="View Assigned Projects"
                        onClick={() => handleAssignProjects(tenant.id!)}
                      >
                        <ClipboardDocumentListIcon
                          className={styles['action-icon']}
                        />
                      </button>
                    )}

                    {isSuperAdmin && (
                      <>
                        <button
                          aria-label="Assign Projects"
                          className={`${styles['action-button']} ${styles.assign} tooltip`}
                          data-tip="Assign Projects"
                          onClick={() => handleAssignProjects(tenant.id!)}
                        >
                          <PlusCircleIcon className={styles['action-icon']} />
                        </button>
                      </>
                    )}

                    {(isSuperAdmin || isTenantAdmin(tenant.name)) && (
                      <>
                        <button
                          aria-label="View Status"
                          className={`${styles['action-button']} ${styles.status} tooltip`}
                          data-tip="View Status"
                          onClick={() =>
                            navigate(`/tenants/${tenant.id}/status`)
                          }
                        >
                          <ListBulletIcon className={styles['action-icon']} />
                        </button>
                        <button
                          aria-label="Check Readiness"
                          className={`${styles['action-button']} ${styles.readiness} tooltip`}
                          data-tip="Check Readiness"
                          onClick={() =>
                            navigate(`/tenants/${tenant.id}/readiness`)
                          }
                        >
                          <ShieldCheckIcon className={styles['action-icon']} />
                        </button>
                        <button
                          aria-label="Capabilities"
                          className="tooltip text-amber-600 cursor-pointer hover:bg-amber-50 rounded-[10px] p-[6px]"
                          data-tip="Capabilities"
                          onClick={() =>
                            navigate(`/tenants/${tenant.id}/capabilities`)
                          }
                        >
                          <Square3Stack3DIcon className="w-[1.3rem]" />
                        </button>
                      </>
                    )}

                    {isSuperAdmin && (
                      <button
                        aria-label="Delete Tenant"
                        className={`${styles['action-button']} ${styles.delete} tooltip`}
                        data-tip="Delete Tenant"
                        onClick={() =>
                          handleDeleteClick(tenant.id!, tenant.name)
                        }
                      >
                        <TrashIcon className={styles['action-icon']} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            : null}
        </div>
      )}
      {!data || data?.content?.length === 0 ? (
        <div className={styles['empty-state']}>
          <p className={styles['empty-text']}>No tenants found</p>
        </div>
      ) : null}

      {data?.content && data.content?.length > 0 && (
        <div className="flex items-center justify-between px-4 py-1 border border-gray-200 rounded-lg my-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {data.total_pages}
            </span>
            <span className="text-sm text-gray-500">
              ({data.total_elements} total tenants)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-5 text-gray-600" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(data.total_pages, prev + 1))
              }
              disabled={currentPage >= data.total_pages}
              className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tenants
