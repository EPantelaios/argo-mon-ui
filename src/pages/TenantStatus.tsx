import { useParams, useNavigate } from 'react-router-dom'
import {
  useGetUserTenantById,
  useGetUserTenantStatus,
  useUpdateTenantStatusMutation,
} from '@/hooks/useTenants'
import { useAuth } from '@/auth/useAuth'
import { useState, Fragment } from 'react'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/16/solid'
import { toast, Toaster } from 'sonner'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorDisplay from '@/components/ErrorDisplay'
import Button from '@/components/Button'
import type { Job, JobStatus } from '@/types/tenants'
import styles from './TenantStatus.module.css'

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

const getStatusIcon = (status: JobStatus) => {
  if (status === 'COMPLETED')
    return <CheckCircleIcon className={styles['status-icon-completed']} />
  if (status === 'FAILED' || status === 'FAILED_INITIALISATION')
    return <XCircleIcon className={styles['status-icon-failed']} />
  if (status === 'INITIALISING')
    return <ClockIcon className={styles[`status-icon-initialising`]} />
  if (status === 'INITIALISED')
    return <ClockIcon className={styles['status-icon-initialised']} />
  if (status === 'IN_PROGRESS')
    return <ClockIcon className={styles['status-icon-in-progress']} />

  return <QuestionMarkCircleIcon className={styles['status-icon-unknown']} />
}

const getStatusBadgeClass = (status: JobStatus): string => {
  if (status === 'UNKNOWN') return styles['status-unknown']
  if (status === 'INITIALISING') return styles['status-initialising']
  if (status === 'INITIALISED') return styles['status-initialised']
  if (status === 'FAILED_INITIALISATION')
    return styles['status-failed-initialisation']
  if (status === 'IN_PROGRESS') return styles['status-in-progress']
  if (status === 'COMPLETED') return styles['status-completed']
  if (status === 'FAILED') return styles['status-failed']
  return ''
}

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

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'INITIALISING', label: 'Initialising' },
  { value: 'INITIALISED', label: 'Initialised' },
  { value: 'FAILED_INITIALISATION', label: 'Failed Initialisation' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
]

const TenantStatus = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const isSuperAdmin = profile?.roles?.includes('super_admin')
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({})
  const [editingJob, setEditingJob] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(null)
  const [jobMessage, setJobMessage] = useState<string>('')

  const { data: tenantData } = useGetUserTenantById(id || '')

  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
  } = useGetUserTenantStatus(id || '')

  const updateStatusMutation = useUpdateTenantStatusMutation()

  const jobs = statusData && statusData.status.jobs

  const toggleJob = (jobName: string) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobName]: !prev[jobName],
    }))
  }

  const handleEditClick = (job: Job) => {
    setEditingJob(job.name)
    setSelectedStatus(job.status)
    setJobMessage(job.message || '')
  }

  const handleCancelEdit = () => {
    setEditingJob(null)
    setSelectedStatus(null)
    setJobMessage('')
  }

  const handleSaveStatus = (job: Job) => {
    if (!id || !selectedStatus) return

    if (!jobMessage.trim()) {
      toast.error('Message is required')
      return
    }

    const updatedJob = {
      ...job,
      status: selectedStatus,
      message: jobMessage.trim(),
      start: job.start || new Date().toISOString().split('.')[0] + 'Z',
      end: ['COMPLETED', 'FAILED', 'FAILED_INITIALISATION'].includes(
        selectedStatus,
      )
        ? new Date().toISOString().split('.')[0] + 'Z'
        : job.end,
    }

    toast.loading('Updating job status...')

    updateStatusMutation.mutate(
      {
        id,
        data: { jobs: [updatedJob] },
      },
      {
        onSuccess: () => {
          toast.dismiss()
          toast.success('Job status updated successfully')
          setEditingJob(null)
          setSelectedStatus(null)
          setJobMessage('')
        },
        onError: (error) => {
          toast.dismiss()
          toast.error(`Failed to update status: ${error.message}`)
        },
      },
    )
  }

  const getStepStatus = (
    job: Job,
    step: string,
  ): 'active' | 'completed' | 'pending' | 'failed' => {
    const statusOrder = [
      'UNKNOWN',
      'INITIALISING',
      'INITIALISED',
      'FAILED_INITIALISATION',
      'IN_PROGRESS',
      'COMPLETED',
      'FAILED',
    ]
    const currentIndex = statusOrder.indexOf(job.status)
    const stepIndex = statusOrder.indexOf(step)

    if (job.status === 'FAILED') {
      if (step === 'FAILED') return 'failed'
      if (stepIndex < currentIndex) return 'completed'
      return 'pending'
    }

    if (job.status === 'FAILED_INITIALISATION') {
      if (step === 'FAILED_INITIALISATION') return 'failed'
      if (step === 'UNKNOWN' || step === 'INITIALISING') return 'completed'
      return 'pending'
    }

    if (job.status === 'COMPLETED' && step === 'COMPLETED') return 'completed'
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  const getProgressSteps = (job: Job) => {
    return [
      { key: 'UNKNOWN', label: 'Unknown' },
      { key: 'INITIALISING', label: 'Initialising' },
      {
        key:
          job.status === 'FAILED_INITIALISATION'
            ? 'FAILED_INITIALISATION'
            : 'INITIALISED',
        label:
          job.status === 'FAILED_INITIALISATION'
            ? 'Failed Initialisation'
            : 'Initialised',
      },
      { key: 'IN_PROGRESS', label: 'In Progress' },
      {
        key: job.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
        label: job.status === 'FAILED' ? 'Failed' : 'Completed',
      },
    ]
  }

  return (
    <>
      <Toaster richColors position="top-center" duration={2000} />
      <div className="page-container">
        <div className={styles.header}>
          <div>
            <h1 className="page-title">Tenant Status</h1>
            <p className="page-subtitle">
              View and manage status for tenant
              <strong style={{ wordBreak: 'break-all' }}>
                {tenantData?.info.name ? ` ${tenantData.info.name}` : '...'}
              </strong>
            </p>
          </div>
          <div>
            <Button
              onClick={() => navigate('/tenants')}
              size="sm"
              variant="secondary"
            >
              <ArrowLeftIcon className="size-4" />
              Back to Tenants
            </Button>
          </div>
        </div>

        {statusLoading && (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        )}

        {!statusLoading && statusError ? (
          <div className="page-container">
            <ErrorDisplay error={statusError} context="tenant status" />
          </div>
        ) : (
          <div className={styles.content}>
            {jobs && jobs.length > 0 ? (
              jobs
                .filter((job) => job.name !== 'CHECK_READINESS')
                .map((job) => (
                  <div key={job.name} className={styles['job-card']}>
                    <div
                      className={styles['job-header']}
                      onClick={() => toggleJob(job.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles['job-title-wrapper']}>
                        {getStatusIcon(job.status)}
                        <h2 className={styles['job-title']}>
                          {JOB_NAMES[job.name] || job.name}
                        </h2>
                        {job.mode === 'MANUAL' && (
                          <span className={styles['manual-badge']}>Manual</span>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span
                          className={`${styles['job-status-badge']} ${getStatusBadgeClass(job.status)}`}
                        >
                          {getStatusDisplay(job.status)}
                        </span>
                        {expandedJobs[job.name] ? (
                          <ChevronUpIcon className={styles['toggle-icon']} />
                        ) : (
                          <ChevronDownIcon className={styles['toggle-icon']} />
                        )}
                      </div>
                    </div>

                    {expandedJobs[job.name] && (
                      <>
                        <div className={styles['progress-container']}>
                          <div className={styles['step-wrapper']}>
                            {getProgressSteps(job).map((step, index, array) => (
                              <Fragment key={step.key}>
                                <div
                                  className={`${styles.step} ${styles[getStepStatus(job, step.key)]}`}
                                >
                                  <div className={styles['step-indicator']} />
                                  <span className={styles['step-label']}>
                                    {step.label}
                                  </span>
                                </div>
                                {index < array.length - 1 && (
                                  <div className={styles['step-line']} />
                                )}
                              </Fragment>
                            ))}
                          </div>
                        </div>

                        {job.mode === 'MANUAL' && editingJob === job.name && (
                          <div className={styles['status-change-section']}>
                            <div className={styles['status-change-fields']}>
                              <div className={styles['status-change-col']}>
                                <label
                                  htmlFor={`status-${job.name}`}
                                  className={styles['detail-label']}
                                >
                                  Change Status:
                                </label>
                                <select
                                  id={`status-${job.name}`}
                                  value={selectedStatus || job.status}
                                  onChange={(e) =>
                                    setSelectedStatus(
                                      e.target.value as JobStatus,
                                    )
                                  }
                                  className={styles['status-change-dropdown']}
                                >
                                  {STATUS_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className={styles['status-change-col']}>
                                <label
                                  htmlFor={`message-${job.name}`}
                                  className={styles['detail-label']}
                                >
                                  Message:
                                </label>
                                <textarea
                                  id={`message-${job.name}`}
                                  value={jobMessage}
                                  onChange={(e) =>
                                    setJobMessage(e.target.value)
                                  }
                                  placeholder="Enter a description for this status change"
                                  className={styles['status-message-input']}
                                  rows={2}
                                />
                              </div>
                            </div>
                            <div className={styles['status-change-actions']}>
                              <button
                                onClick={handleCancelEdit}
                                className={styles['status-cancel-button']}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveStatus(job)}
                                className={styles['status-save-button']}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        <div className={styles['job-details']}>
                          <div className={styles['detail-row-with-button']}>
                            <div className={styles['detail-row']}>
                              <span className={styles['detail-label']}>
                                Start Time:
                              </span>
                              <span className={styles['detail-value']}>
                                {formatDateTime(job.start)}
                              </span>
                            </div>
                            {isSuperAdmin &&
                              job.mode === 'MANUAL' &&
                              editingJob !== job.name && (
                                <button
                                  onClick={() => handleEditClick(job)}
                                  className={styles['status-edit-button']}
                                >
                                  Edit Status
                                </button>
                              )}
                          </div>
                          <div className={styles['detail-row']}>
                            <span className={styles['detail-label']}>
                              End Time:
                            </span>
                            <span className={styles['detail-value']}>
                              {formatDateTime(job.end)}
                            </span>
                          </div>
                          {job.message && (
                            <div className={styles['detail-row']}>
                              <span className={styles['detail-label']}>
                                Message:
                              </span>
                              <span className={styles['detail-value']}>
                                {job.message}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
            ) : (
              <div className={styles['empty-state']}>
                <p>No status information available for this tenant.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default TenantStatus
