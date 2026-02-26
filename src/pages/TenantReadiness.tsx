import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import { useMemo } from 'react'
import {
  useGetTenantReadiness,
  useGetUserTenantById,
  useCheckReadinessMutation,
  useGetUserTenantStatus,
} from '@/hooks/useTenants'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorDisplay from '@/components/ErrorDisplay'
import Button from '@/components/Button'
import styles from './TenantReadiness.module.css'
import type { ReadinessCheckDetail, JobStatus } from '@/types/tenants'
import { toast } from 'sonner'

const TenantReadiness = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: tenantData, isLoading: tenantLoading } = useGetUserTenantById(
    id || '',
  )

  const {
    data: readinessData,
    isLoading: readinessLoading,
    error: readinessError,
  } = useGetTenantReadiness(id || '', true, 10000)

  const { data: statusData } = useGetUserTenantStatus(id || '', 0)

  // Compute refetch interval based on CHECK_READINESS job status
  const statusRefetchInterval = useMemo(() => {
    const job = statusData?.status?.jobs?.find(
      (j) => j.name === 'CHECK_READINESS',
    )

    if (!job?.status) return 0

    const status = job.status
    // Don't refetch for terminal or unknown states
    if (
      status === 'UNKNOWN' ||
      status === 'FAILED' ||
      status === 'FAILED_INITIALISATION' ||
      status === 'COMPLETED'
    ) {
      return 0
    }

    return 10000
  }, [statusData])

  const { data: statusDataWithRefetch } = useGetUserTenantStatus(
    id || '',
    statusRefetchInterval,
  )

  const activeStatusData = statusDataWithRefetch || statusData

  const notifyCheckReadinessMutation = useCheckReadinessMutation()

  const checkReadinessJob = activeStatusData?.status?.jobs?.find(
    (job) => job.name === 'CHECK_READINESS',
  )

  const handleBackClick = () => {
    navigate('/tenants')
  }

  const handleCheckReadiness = () => {
    if (!id || !tenantData?.info.name) {
      toast.error('Tenant information is not available')
      return
    }

    notifyCheckReadinessMutation.mutate(
      {
        tenantId: id,
        tenantName: tenantData.info.name,
      },
      {
        onSuccess: (data) => {
          const job = data.jobs?.find((j) => j.name === 'CHECK_READINESS')
          const message = job?.message
          if (message) {
            toast.success(message)
          }
        },
        onError: (error: Error) => {
          toast.error(`Failed to check readiness: ${error.message}`)
        },
      },
    )
  }

  const readiness = readinessData?.data
  const hasError = readinessError || !tenantData

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getReadinessClass = (ready: boolean) => {
    return ready ? styles['status-ready'] : styles['status-not-ready']
  }

  const getJobStatusDisplay = (status: JobStatus): string => {
    if (status === 'UNKNOWN') return 'Unknown'
    if (status === 'INITIALISING') return 'Initialising'
    if (status === 'INITIALISED') return 'Initialised'
    if (status === 'FAILED_INITIALISATION') return 'Failed Initialisation'
    if (status === 'IN_PROGRESS') return 'In Progress'
    if (status === 'COMPLETED') return 'Completed'
    if (status === 'FAILED') return 'Failed'
    return status
  }

  const getJobStatusClass = (status: JobStatus): string => {
    if (status === 'COMPLETED') return styles['job-status-completed']
    if (status === 'IN_PROGRESS') return styles['job-status-in-progress']
    if (status === 'INITIALISING') return styles['job-status-initialising']
    if (status === 'INITIALISED') return styles['job-status-initialised']
    if (status === 'FAILED') return styles['job-status-failed']
    if (status === 'FAILED_INITIALISATION')
      return styles['job-status-failed-initialisation']
    return styles['job-status-unknown']
  }

  const shouldShowJobStatus = (status?: JobStatus): boolean => {
    if (!status) return false
    return status !== 'UNKNOWN'
  }

  const renderCheckDetail = (
    title: string,
    detail: ReadinessCheckDetail | undefined,
  ) => {
    if (!detail) return null

    const hasMessage = detail.message && detail.message.trim().length > 0
    const displayMessage = hasMessage
      ? detail.message
      : 'No additional details provided'

    return (
      <div className={styles['check-card']}>
        <div className={styles['check-header']}>
          <div className={styles['check-title-wrapper']}>
            <h3 className={styles['check-title']}>{title}</h3>
          </div>
          <span
            className={`${styles['status-badge']} ${getReadinessClass(detail.ready)}`}
          >
            {detail.ready ? 'Ready' : 'Not Ready'}
          </span>
        </div>
        <div
          className={`${styles['check-message']} ${
            !hasMessage ? styles['check-message-empty'] : ''
          }`}
        >
          {displayMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.header}>
      <div className={styles['title-section']}>
        <div>
          <h1 className="page-title">Tenant Readiness</h1>
          <p className="page-subtitle">
            View readiness checks for tenant
            <strong style={{ wordBreak: 'break-all' }}>
              {tenantData?.info.name ? ` ${tenantData.info.name}` : '...'}
            </strong>
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBackClick}>
          <ArrowLeftIcon className="size-4" />
          Back to Tenants
        </Button>
      </div>
      <div className={styles['action-section']}>
        <div className={styles['action-wrapper']}>
          <div className={styles['action-label']}>
            <p className={styles['action-description']}>
              Trigger a manual readiness check to verify tenant status
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCheckReadiness}
            disabled={
              notifyCheckReadinessMutation.isPending ||
              checkReadinessJob?.status === 'IN_PROGRESS' ||
              checkReadinessJob?.status === 'INITIALISING' ||
              checkReadinessJob?.status === 'INITIALISED'
            }
          >
            {notifyCheckReadinessMutation.isPending
              ? 'Checking...'
              : 'Check Readiness'}
          </Button>
          {checkReadinessJob &&
            checkReadinessJob.status &&
            shouldShowJobStatus(checkReadinessJob.status) && (
              <div className={styles['job-status-info']}>
                <span
                  className={`${styles['job-status-badge']} ${getJobStatusClass(checkReadinessJob.status)}`}
                >
                  {getJobStatusDisplay(checkReadinessJob.status)}
                </span>
                {checkReadinessJob.message &&
                  checkReadinessJob.message.trim().length > 0 && (
                    <span className={styles['job-status-message']}>
                      {checkReadinessJob.message}
                    </span>
                  )}
              </div>
            )}
        </div>
      </div>

      {readinessError && !readinessLoading && (
        <ErrorDisplay error={readinessError} context="readiness data" />
      )}

      {!tenantData && !readinessError && !tenantLoading && (
        <ErrorDisplay
          error="The tenant you are looking for does not exist or has been removed."
          context="tenant"
        />
      )}

      {readinessLoading && (
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      )}

      {!hasError && readiness && (
        <div className={styles.content}>
          <div>
            <h2 className="section-title">Readiness Check Results</h2>
            <p className="section-description">
              Current readiness status for the tenant based on the latest
              checks.
            </p>
          </div>
          <div className={styles['overall-status-card']}>
            <div className={styles['overall-status-header']}>
              <div className={styles['overall-status-title-wrapper']}>
                <h2 className={styles['overall-status-title']}>
                  Overall Tenant Status
                </h2>
              </div>
              <span
                className={`${styles['status-badge']} ${getReadinessClass(readiness.ready)}`}
              >
                {readiness.ready ? 'Ready' : 'Not Ready'}
              </span>
            </div>
            <div className={styles['overall-status-info']}>
              <div className={styles['info-row']}>
                <span className={styles['info-label']}>Tenant Name:</span>
                <span className={styles['info-value']}>{readiness.name}</span>
              </div>
              <div className={styles['info-row']}>
                <span className={styles['info-label']}>Last Check:</span>
                <span className={styles['info-value']}>
                  {formatDateTime(readiness.last_check)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles['checks-grid']}>
            {renderCheckDetail('Data Availability', readiness.data)}
            {renderCheckDetail('Topology Configuration', readiness.topology)}
            {renderCheckDetail('Reports', readiness.reports)}
          </div>
        </div>
      )}

      {!hasError && !readiness && !readinessLoading && (
        <ErrorDisplay
          error="No readiness information is currently available for this tenant."
          context="readiness information"
        />
      )}
    </div>
  )
}

export default TenantReadiness
