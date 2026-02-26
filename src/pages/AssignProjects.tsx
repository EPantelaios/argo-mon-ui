import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { toast, Toaster } from 'sonner'
import ErrorDisplay from '@/components/ErrorDisplay'
import Button from '@/components/Button'
import {
  useGetUserTenantById,
  useGetUserTenantProjects,
  useAssignTenantProjectsMutation,
} from '@/hooks/useTenants'
import { useGetAllProjects } from '@/hooks/useProjects'
import { GripVertical } from 'lucide-react'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import type { ProjectItem } from '@/types/projects'
import styles from './AssignProjects.module.css'
import { useAuth } from '@/auth/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const AssignProjects = () => {
  const { profile } = useAuth()
  const { id: tenantId } = useParams<{ id: string }>()
  const isSuperAdmin = profile?.roles?.includes('super_admin')

  const [allProjects, setAllProjects] = useState<ProjectItem[]>([])
  const [tenantProjectIds, setTenantProjectIds] = useState<string[]>([])
  const [availableProjects, setAvailableProjects] = useState<ProjectItem[]>([])
  const [assignedProjects, setAssignedProjects] = useState<ProjectItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const { data: tenantData, error: tenantError } = useGetUserTenantById(
    tenantId || '',
  )

  const isReadOnly = !isSuperAdmin

  const groupName = 'projects-assignment'
  const [availableRef, availableItems, setAvailableItems] = useDragAndDrop<
    HTMLUListElement,
    ProjectItem
  >(availableProjects, {
    group: groupName,
    dragHandle: isReadOnly ? undefined : '.dnd-handle',
    disabled: isReadOnly,
  })

  const [assignedRef, assignedItems, setAssignedItems] = useDragAndDrop<
    HTMLUListElement,
    ProjectItem
  >(assignedProjects, {
    group: groupName,
    dragHandle: isReadOnly ? undefined : '.dnd-handle',
    disabled: isReadOnly,
  })

  const navigate = useNavigate()

  const {
    data: tenantProjectsData,
    fetchNextPage: fetchNextTenantProjectsPage,
    hasNextPage: hasNextTenantProjectsPage,
  } = useGetUserTenantProjects(tenantId || '')

  const {
    data: allProjectsData,
    fetchNextPage: fetchNextAllProjectsPage,
    hasNextPage: hasNextProjectsPage,
  } = useGetAllProjects(isSuperAdmin)

  const assignMutation = useAssignTenantProjectsMutation()

  // Fetch and gather all projects from all pages (only for super_admin)
  useEffect(() => {
    let projects: ProjectItem[] = []

    if (isSuperAdmin && allProjectsData?.pages) {
      allProjectsData.pages.forEach((page) => {
        projects = [
          ...projects,
          ...(page?.content
            ?.filter((p) => p.id)
            .map((p) => ({
              id: p.id!,
              name: p.name,
              start_date: p.start_date,
              end_date: p.end_date,
            })) || []),
        ]
      })
      if (hasNextProjectsPage) {
        fetchNextAllProjectsPage()
      }
    }

    setAllProjects(projects)
  }, [
    isSuperAdmin,
    allProjectsData,
    hasNextProjectsPage,
    fetchNextAllProjectsPage,
  ])

  // Fetch and gather all tenant project IDs from all pages
  useEffect(() => {
    let projectIds: string[] = []

    if (tenantProjectsData?.pages) {
      tenantProjectsData.pages.forEach((page) => {
        const ids =
          page?.content
            ?.map((tenant) => tenant.id)
            .filter((id): id is string => !!id) || []
        projectIds = [...projectIds, ...ids]
      })
      if (hasNextTenantProjectsPage) {
        fetchNextTenantProjectsPage()
      }
    }

    setTenantProjectIds(projectIds)
  }, [
    tenantProjectsData,
    hasNextTenantProjectsPage,
    fetchNextTenantProjectsPage,
  ])

  // Filter and set initial items when data is ready
  useEffect(() => {
    if (
      (isSuperAdmin ? !hasNextProjectsPage : true) &&
      !hasNextTenantProjectsPage
    ) {
      const assigned = allProjects?.filter((p) =>
        tenantProjectIds.includes(p.id),
      )
      const available = allProjects?.filter(
        (p) => !tenantProjectIds.includes(p.id),
      )

      setAssignedProjects(assigned)
      setAvailableProjects(available)

      setIsInitialized(true)
    }
  }, [
    isSuperAdmin,
    allProjects,
    tenantProjectIds,
    hasNextProjectsPage,
    hasNextTenantProjectsPage,
  ])

  // Sync drag-and-drop items when initial data changes
  useEffect(() => {
    if (isInitialized) {
      setAvailableItems(availableProjects)
    }
  }, [availableProjects, setAvailableItems, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      setAssignedItems(assignedProjects)
    }
  }, [assignedProjects, setAssignedItems, isInitialized])

  const handleSave = () => {
    if (!tenantId) return

    const projectIds = assignedItems.map((p) => p.id)

    assignMutation.mutate(
      { tenant_id: tenantId, project_ids: projectIds },
      {
        onSuccess: () => {
          toast.success('Projects assigned successfully!')
          setTimeout(() => {
            navigate('/tenants')
          }, 2000)
        },
        onError: (error: Error & { errors?: string[] }) => {
          if (error.errors && error.errors.length > 0) {
            toast.error(
              <div>
                {error.errors?.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>,
            )
          } else {
            toast.error(`Failed to assign projects: ${error.message}`)
          }
        },
      },
    )
  }

  const handleCancel = () => {
    navigate('/tenants')
  }

  if (!isInitialized) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    )
  }

  if (tenantError) {
    return (
      <>
        <Toaster richColors position="top-center" duration={2000} />
        <div className="page-container">
          <ErrorDisplay error={tenantError} context="tenant" />
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster richColors position="top-center" duration={2000} />
      <div className="page-container">
        <div className={styles.header}>
          <div>
            <h1 className="page-title">
              {isReadOnly
                ? 'View Assigned Projects'
                : 'Assign Projects to Tenant'}
            </h1>
            <p className="page-subtitle lg:me-30 md:me-20 sm:me-10">
              {isReadOnly
                ? `Viewing projects assigned to tenant `
                : 'Drag and drop projects to assign or remove them from tenant '}
              <strong style={{ wordBreak: 'break-all' }}>
                {tenantData?.info.name ? ` ${tenantData.info.name}` : '...'}
              </strong>
            </p>
          </div>

          <Button onClick={handleCancel} size="sm" variant="secondary">
            <ArrowLeftIcon className="size-4" />
            Back to Tenants
          </Button>
        </div>

        {!isReadOnly && (
          <div className={styles['save-button-container']}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={
                assignMutation.isPending ||
                (availableItems.length === 0 && assignedItems.length === 0)
              }
            >
              {assignMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}

        <div
          className={styles.content}
          style={
            isReadOnly
              ? {
                  maxWidth: '600px',
                  margin: '0 auto',
                }
              : {}
          }
        >
          {!isReadOnly && (
            <div className={styles.column}>
              <div className={styles['column-header']}>
                <h2 className={styles['column-title']}>Available Projects</h2>
                <span className={styles['column-count']}>
                  {availableItems.length}
                </span>
              </div>
              <div className={styles['list-container']}>
                <ul ref={availableRef} className={styles.list}>
                  {availableItems.length > 0 ? (
                    availableItems.map((project) => (
                      <li key={project.id} className={styles['project-item']}>
                        <div className="dnd-handle flex items-center gap-2 flex-grow-1">
                          <GripVertical className={styles['drag-handle']} />
                          <div className={styles['project-info']}>
                            <span className={styles['project-name']}>
                              {project.name}
                            </span>
                            <span className={styles['project-date']}>
                              {formatDate(project.start_date)} -{' '}
                              {formatDate(project.end_date)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className={styles['empty-state']}>
                      No available projects
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div
            className={styles.column}
            style={
              isReadOnly
                ? {
                    gridColumn: '1 / -1',
                  }
                : {}
            }
          >
            <div className={styles['column-header']}>
              <h2 className={styles['column-title']}>
                {isReadOnly ? 'Assigned Projects' : 'Assigned Projects'}
              </h2>
              <span className={styles['column-count']}>
                {assignedItems.length}
              </span>
            </div>
            <div className={styles['list-container']}>
              <ul ref={assignedRef} className={styles.list}>
                {assignedItems.length > 0 ? (
                  assignedItems.map((project) => (
                    <li
                      key={project.id}
                      className={`${styles['project-item']} ${isReadOnly ? styles['read-only'] : ''}`}
                      style={isReadOnly ? { cursor: 'default' } : {}}
                    >
                      <div className="dnd-handle flex items-center gap-2 flex-grow-1">
                        {!isReadOnly && (
                          <GripVertical className={styles['drag-handle']} />
                        )}
                        <div className={styles['project-info']}>
                          <span className={styles['project-name']}>
                            {project.name}
                          </span>
                          <span className={styles['project-date']}>
                            {formatDate(project.start_date)} -{' '}
                            {formatDate(project.end_date)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className={styles['empty-state']}>
                    {isReadOnly
                      ? 'No projects assigned to this tenant'
                      : 'Drag projects here to assign'}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AssignProjects
