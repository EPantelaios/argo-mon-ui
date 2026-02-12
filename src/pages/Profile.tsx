import { UserCircleIcon } from '@heroicons/react/16/solid'
import { ArrowLeftIcon, UserMinusIcon } from '@heroicons/react/24/solid'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import {
  useGetUserProfileById,
  useGetTenantByName,
  useRemoveMemberFromTenant,
} from '@/hooks/useTenants'
import { squishEmail } from '@/utils/profile'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast, Toaster } from 'sonner'
import styles from './Profile.module.css'

export const Profile = () => {
  const { id: userId } = useParams<{ id: string }>()

  const { profile } = useAuth()
  const navigate = useNavigate()
  const isSuperAdmin = profile?.roles?.includes('super_admin')

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [tenantToRemove, setTenantToRemove] = useState<{
    id: string
    name: string
    role: string
  } | null>(null)

  const {
    data: userProfileData,
    isLoading,
    error,
  } = useGetUserProfileById(userId || '', !!userId && isSuperAdmin)

  const getTenantByNameMutation = useGetTenantByName()
  const removeMemberMutation = useRemoveMemberFromTenant()

  if (userId && !isSuperAdmin) {
    return <Navigate to="/profile" replace />
  }

  // Determine which profile to display based on route
  const isViewingOtherUser = !!userId
  const displayProfile = isViewingOtherUser ? userProfileData : null

  const handleBack = () => {
    navigate('/administration')
  }

  const handleRemoveClick = (tenantName: string, role: string) => {
    setTenantToRemove({ id: '', name: tenantName, role })
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = () => {
    if (!tenantToRemove || !userId) return

    // Get the tenant ID by name
    getTenantByNameMutation.mutate('TENANT-INVITATIONS-TEST', {
      onSuccess: (tenantData) => {
        let tenantId = ''
        if (!tenantData || (tenantData && tenantData.content.length === 0)) {
          toast.error('Tenant not found')
          return
        }
        tenantId = tenantData.content[0].id || ''

        if (!tenantId) {
          toast.error('Tenant ID not found')
          return
        }

        removeMemberMutation.mutate(
          {
            tenantId: tenantId,
            memberId: userId,
          },
          {
            onSuccess: () => {
              toast.success('Member removed successfully!')
              setRemoveDialogOpen(false)
              setTenantToRemove(null)
            },
            onError: (error) => {
              toast.error(`Failed to remove member: ${error.message}`)
            },
          },
        )
      },
      onError: (error) => {
        toast.error(`Failed to find tenant: ${error.message}`)
      },
    })
  }

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false)
    setTenantToRemove(null)
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    )
  }

  if (isViewingOtherUser && error) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div className={styles['header-content']}>
              <h1 className="page-title">Manage User</h1>
              <p className="page-subtitle">View and manage user account</p>
            </div>
            <Button variant="secondary" size="md" onClick={handleBack}>
              <ArrowLeftIcon className="size-4" />
              Back to Administration
            </Button>
          </div>

          <div className={styles['error-container']}>
            <h3 className={styles['error-title']}>
              Error Loading User Profile
            </h3>
            <p className={styles['error-message']}>
              {error.message || 'Failed to load user profile'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Use displayProfile for viewing other users, profile for own profile
  const currentUsername = isViewingOtherUser
    ? displayProfile?.username || 'N/A'
    : profile?.username || 'N/A'
  const currentFirstName = isViewingOtherUser
    ? displayProfile?.firstName || 'Not available'
    : profile?.name || 'Not available'
  const currentLastName = isViewingOtherUser
    ? displayProfile?.lastName || 'Not available'
    : profile?.surname || 'Not available'
  const currentEmail = isViewingOtherUser
    ? displayProfile?.email || 'Not available'
    : profile?.email || 'Not available'

  const currentGroups = isViewingOtherUser
    ? displayProfile?.tenants || []
    : profile?.groups || []

  // Remove a specific record if the name is equal to "members"
  currentGroups.forEach((group, index) => {
    if (group.name === 'members') {
      currentGroups.splice(index, 1)
    }
  })

  return (
    <div className={styles.container}>
      <Toaster richColors position="top-center" duration={2000} />
      <ConfirmDialog
        isOpen={removeDialogOpen}
        title="Remove from Tenant"
        message={
          tenantToRemove ? (
            <>
              Are you sure you want to remove this user from tenant{' '}
              <strong>{tenantToRemove.name}</strong> ?
              <br />
              <span className="text-amber-600 font-medium">
                The user will lose access to this tenant.
              </span>
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
      />
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles['header-content']}>
            <h1 className="page-title">
              {isViewingOtherUser ? 'Manage User' : 'Profile'}
            </h1>
            <p className="page-subtitle">
              {isViewingOtherUser
                ? 'View and manage user account'
                : 'View your account information'}
            </p>
          </div>
          {isViewingOtherUser && (
            <Button variant="secondary" size="md" onClick={handleBack}>
              <ArrowLeftIcon className="size-4" />
              Back to Administration
            </Button>
          )}
        </div>

        {(profile || displayProfile) && (
          <div className={styles['profile-card']}>
            <div className={styles['profile-header']}>
              <div className={styles['profile-header-content']}>
                <div className={styles['icon-wrapper']}>
                  <UserCircleIcon className={styles.icon} />
                </div>
                <div>
                  <label className={styles['username-label']}>Username</label>
                  <h2
                    className={styles['username-value']}
                    title={currentUsername}
                  >
                    {squishEmail(currentUsername, 12, 12)}
                  </h2>
                </div>
              </div>
            </div>

            <div className={styles['profile-body']}>
              <div className={styles['profile-grid']}>
                <div>
                  <h3 className={styles['section-title']}>Account Details</h3>
                </div>
                <div className={styles['details-container']}>
                  <div className={styles['field-container']}>
                    <label className={styles['field-label']}>First Name</label>
                    <p
                      className={
                        currentFirstName !== 'Not available'
                          ? styles['field-value']
                          : styles['field-value-unavailable']
                      }
                    >
                      {currentFirstName}
                    </p>
                  </div>

                  <div className={styles['field-container']}>
                    <label className={styles['field-label']}>Last Name</label>
                    <p
                      className={
                        currentLastName !== 'Not available'
                          ? styles['field-value']
                          : styles['field-value-unavailable']
                      }
                    >
                      {currentLastName}
                    </p>
                  </div>

                  <div className={styles['field-container']}>
                    <label className={styles['field-label']}>Email</label>
                    <p
                      className={
                        currentEmail !== 'Not available'
                          ? styles['field-value']
                          : styles['field-value-unavailable']
                      }
                    >
                      {currentEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles['section-divider']}></div>

              <div className={styles['profile-grid']}>
                <div>
                  <h3 className={styles['section-title']}>
                    Tenant Memberships
                  </h3>
                </div>
                <div className={styles['details-container']}>
                  <div className={styles['field-container']}>
                    <label className={`${styles['field-label']} mb-4`}>
                      Tenants
                    </label>
                    <div className={styles['tenants-section']}>
                      {currentGroups && currentGroups.length > 0 ? (
                        <div className={styles['tenants-list']}>
                          {currentGroups.map((tenant, index) => (
                            <div key={index} className={styles['tenant-item']}>
                              <div className={styles['tenant-info']}>
                                <span className={styles['tenant-name']}>
                                  {tenant.name}
                                </span>
                                <span
                                  className={`${styles['role-badge']} ${
                                    tenant.role === 'admin'
                                      ? styles['role-admin']
                                      : styles['role-viewer']
                                  }`}
                                >
                                  {tenant.role === 'super_admin'
                                    ? 'Super Admin'
                                    : tenant.role}
                                </span>
                              </div>
                              {isSuperAdmin && isViewingOtherUser && (
                                <button
                                  aria-label="Remove from tenant"
                                  className={`${styles['action-button']} ${styles.delete}`}
                                  onClick={() =>
                                    handleRemoveClick(tenant.name, tenant.role)
                                  }
                                  title="Remove user from this tenant"
                                >
                                  <UserMinusIcon
                                    className={styles['action-icon']}
                                  />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles['field-value-unavailable']}>
                          Not a member of any tenant
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
