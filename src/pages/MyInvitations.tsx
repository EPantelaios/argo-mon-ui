import { useState } from 'react'
import {
  useGetUserInvitations,
  useRespondToInvitation,
} from '@/hooks/useInvitations'
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid'
import { toast, Toaster } from 'sonner'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAuth } from '@/auth/useAuth'
import styles from './MyInvitations.module.css'

const pageSize = 10

const MyInvitations = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const { waitForTenantInProfile } = useAuth()

  const { data: invitationsData, isLoading } = useGetUserInvitations(true, {
    page: currentPage,
    size: pageSize,
  })
  const respondMutation = useRespondToInvitation()

  const handleRespond = (
    invitationId: string,
    tenantName: string,
    action: 'ACCEPT' | 'REJECT',
  ) => {
    respondMutation.mutate(
      { invitationId, data: { action } },
      {
        onSuccess: async () => {
          toast.success(
            `Invitation ${action === 'ACCEPT' ? 'accepted' : 'rejected'} successfully!`,
          )
          if (action === 'ACCEPT') {
            try {
              // Refetch profile and wait until the new tenant appears in groups
              await waitForTenantInProfile(tenantName, 5, 2000)
            } catch (error) {
              console.error('Failed to refetch profile:', error)
            }
          }
        },
        onError: (error) => {
          toast.error(`Failed to respond to invitation: ${error.message}`)
        },
      },
    )
  }

  return (
    <>
      <Toaster richColors position="top-center" duration={2000} />
      <div className="page-container">
        <div className={styles.header}>
          <div>
            <h1 className="page-title">My Invitations</h1>
            <p className="page-subtitle">
              View and respond to your tenant invitations
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {invitationsData?.content && invitationsData.content.length > 0 ? (
              <>
                <div className={styles['table-wrapper']}>
                  <div className={styles['table-scroll']}>
                    <table className={styles.table}>
                      <thead className={styles['table-head']}>
                        <tr>
                          <th className={styles['th-tenant-name']}>
                            Tenant Name
                          </th>
                          <th className={styles['th-email']}>Email</th>
                          <th className={styles['th-role']}>Role</th>
                          <th className={styles['th-status']}>Status</th>
                          <th className={styles['th-created']}>Created At</th>
                          <th className={styles['th-actions']}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={styles['table-body']}>
                        {invitationsData.content.map((invitation) => (
                          <tr
                            key={invitation.id}
                            className={styles['table-row']}
                          >
                            <td>
                              <span className={styles['tenant-name-text']}>
                                {invitation.tenant_name}
                              </span>
                            </td>
                            <td>
                              <span className={styles['email-text']}>
                                {invitation.email}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`${styles['role-badge']} ${styles[`role-${invitation.role}`]}`}
                              >
                                {invitation.role === 'admin'
                                  ? 'Tenant Admin'
                                  : 'Member'}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`${styles['status-badge']} ${styles[`status-${invitation.status.toLowerCase()}`]}`}
                              >
                                {invitation.status === 'PENDING'
                                  ? 'Pending'
                                  : invitation.status === 'ACCEPTED'
                                    ? 'Accepted'
                                    : invitation.status === 'REJECTED'
                                      ? 'Rejected'
                                      : invitation.status}
                              </span>
                            </td>
                            <td>
                              <span className={styles['date-text']}>
                                {new Date(
                                  invitation.created_at,
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </td>
                            <td>
                              {invitation.status === 'PENDING' ? (
                                <div className={styles['actions-container']}>
                                  <button
                                    onClick={() =>
                                      handleRespond(
                                        invitation.id,
                                        invitation.tenant_name,
                                        'ACCEPT',
                                      )
                                    }
                                    className={`tooltip ${styles['action-button']} ${styles['accept-button']}`}
                                    data-tip="Accept invitation"
                                    disabled={respondMutation.isPending}
                                  >
                                    <CheckCircleIcon
                                      className={styles['action-icon']}
                                    />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRespond(
                                        invitation.id,
                                        invitation.tenant_name,
                                        'REJECT',
                                      )
                                    }
                                    className={`tooltip ${styles['action-button']} ${styles['reject-button']}`}
                                    data-tip="Reject invitation"
                                    disabled={respondMutation.isPending}
                                  >
                                    <XCircleIcon
                                      className={styles['action-icon']}
                                    />
                                  </button>
                                </div>
                              ) : (
                                <span className={styles['empty-actions']}>
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {invitationsData.content.length > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      <span className="pagination-text">
                        Page {currentPage} of {invitationsData.total_pages}
                      </span>
                      <span className="pagination-count">
                        ({invitationsData.total_elements} total invitations)
                      </span>
                    </div>
                    <div className="pagination-buttons">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="pagination-button"
                        aria-label="Previous page"
                      >
                        <ChevronLeftIcon className="pagination-icon" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(invitationsData.total_pages, prev + 1),
                          )
                        }
                        disabled={currentPage >= invitationsData.total_pages}
                        className="pagination-button"
                        aria-label="Next page"
                      >
                        <ChevronRightIcon className="pagination-icon" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles['empty-state']}>
                <p className={styles['empty-text']}>No invitations found</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default MyInvitations
