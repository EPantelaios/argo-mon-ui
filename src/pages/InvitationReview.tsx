import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/auth/useAuth'
import {
  useGetUserInvitationById,
  useRespondToInvitation,
} from '@/hooks/useInvitations'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Toaster, toast } from 'sonner'
import styles from './InvitationReview.module.css'

export const InvitationReview = () => {
  const { id: invitationId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    authenticated,
    initialized,
    registered,
    login,
    waitForTenantInProfile,
  } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    data: invitation,
    isLoading,
    error,
  } = useGetUserInvitationById(
    invitationId || '',
    authenticated && registered && !!invitationId,
  )

  const respondMutation = useRespondToInvitation()

  useEffect(() => {
    if (initialized && !authenticated) {
      login(window.location.href)
    }
  }, [initialized, authenticated, login])

  const handleAccept = () => {
    if (!invitationId) return

    setIsProcessing(true)
    respondMutation.mutate(
      {
        invitationId,
        data: { action: 'ACCEPT' },
      },
      {
        onSuccess: async () => {
          toast.success('Invitation accepted successfully!')

          setTimeout(() => {
            navigate('/tenants')
          }, 2000)

          try {
            // Refetch profile and wait until the new tenant appears in groups
            await waitForTenantInProfile(invitation?.tenant_name, 5, 2000)
          } catch (error) {
            console.error('Failed to refetch profile:', error)
          }
        },
        onError: (error) => {
          toast.error(`Failed to accept invitation: ${error.message}`)
          setIsProcessing(false)
        },
      },
    )
  }

  const handleReject = () => {
    if (!invitationId) return

    setIsProcessing(true)
    respondMutation.mutate(
      {
        invitationId,
        data: { action: 'REJECT' },
      },
      {
        onSuccess: () => {
          toast.success('Invitation rejected')
          setTimeout(() => {
            navigate('/')
          }, 2000)
        },
        onError: (error) => {
          toast.error(`Failed to reject invitation: ${error.message}`)
          setIsProcessing(false)
        },
      },
    )
  }

  if (!initialized || !authenticated || !registered || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <LoadingSpinner />
          <p>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Toaster richColors position="top-center" duration={2000} />
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.errorIcon}>
              <XCircleIcon className={styles.icon} />
            </div>
            <h1 className={styles.title}>Invitation Not Found</h1>
            <p className={styles.errorMessage}>
              {error.message ||
                'This invitation may have expired or is no longer valid.'}
            </p>
            <Button variant="secondary" size="md" onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (invitation && invitation.status !== 'PENDING') {
    const isPreviouslyAccepted = invitation.status === 'ACCEPTED'

    return (
      <>
        <Toaster richColors position="top-center" duration={2000} />
        <div className={styles.container}>
          <div className={styles.card}>
            <div
              className={
                isPreviouslyAccepted ? styles.successIcon : styles.warningIcon
              }
            >
              {isPreviouslyAccepted ? (
                <CheckCircleIcon className={styles.icon} />
              ) : (
                <XCircleIcon className={styles.icon} />
              )}
            </div>
            <h1 className={styles.title}>Invitation Processed</h1>
            <p className={styles.message}>
              You have {invitation.status.toLowerCase()} this invitation to join{' '}
              <strong>{invitation.tenant_name}</strong>.
            </p>
            <div className={styles.actions}>
              {isPreviouslyAccepted && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/tenants')}
                >
                  View Tenants
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/')}
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster richColors position="top-center" duration={2000} />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Tenant Invitation</h1>
            <p className={styles.subtitle}>
              Review and respond to this invitation
            </p>
          </div>

          <div className={styles.content}>
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label}>Tenant Name</label>
                <div className={styles.value}>
                  {invitation?.tenant_name || 'N/A'}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Role</label>
                <div className={styles.value}>
                  {invitation?.role === 'admin' ? 'Tenant Admin' : 'Member'}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <div className={styles.value}>{invitation?.email || 'N/A'}</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Invited On</label>
                <div className={styles.value}>
                  {invitation?.created_at
                    ? new Date(invitation.created_at).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              <p>
                By accepting this invitation, you will become a{' '}
                <strong>
                  {invitation?.role === 'admin' ? 'Tenant Admin' : 'Member'}
                </strong>{' '}
                of the <strong>{invitation?.tenant_name}</strong> tenant. You
                will be able to
                {invitation?.role === 'admin'
                  ? ' manage tenant settings, members, and projects.'
                  : ' view tenant information.'}
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="md"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing &&
              respondMutation.variables?.data.action === 'REJECT' ? (
                <>
                  <LoadingSpinner size="sm" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircleIcon className="size-5" />
                  Reject Invitation
                </>
              )}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing &&
              respondMutation.variables?.data.action === 'ACCEPT' ? (
                <>
                  <LoadingSpinner size="sm" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="size-5" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
