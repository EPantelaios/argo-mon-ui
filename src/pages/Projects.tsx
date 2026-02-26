import { useState, useEffect } from 'react'
import { useGetProjects, useDeleteProjectMutation } from '@/hooks/useProjects'
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import styles from './Projects.module.css'

const pageSize = 9

const Projects = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading } = useGetProjects(currentPage, pageSize, searchQuery)
  const deleteMutation = useDeleteProjectMutation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  const navigate = useNavigate()

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleEdit = (projectId: string) => {
    navigate(`/projects/edit/${projectId}`)
  }

  const handleDeleteClick = (id: string, name: string) => {
    setProjectToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!projectToDelete) return

    deleteMutation.mutate(projectToDelete.id, {
      onSuccess: () => {
        toast.success('Project deleted successfully!')
        setDeleteDialogOpen(false)
        setProjectToDelete(null)

        if (data?.content && data.content.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1)
        }
      },
      onError: (error) => {
        toast.error(`Failed to delete project: ${error.message}`)
      },
    })
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }

  return (
    <div className="page-container">
      <Toaster richColors position="top-center" duration={2000} />
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Project"
        message={
          projectToDelete ? (
            <>
              Are you sure you want to delete project{' '}
              <strong>{projectToDelete.name}</strong> ?
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
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            Manage and create projects for the monitoring service
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/projects/create')}
        >
          Create New Project
        </Button>
      </div>

      <div className={styles['search-container']}>
        <div className={styles['search-input-wrapper']}>
          <MagnifyingGlassIcon className={styles['search-icon']} />
          <input
            type="text"
            placeholder="Search projects..."
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
          {data?.content && data.content.length > 0
            ? data.content.map((project) => (
                <div key={project.id} className={styles.card}>
                  <div className={styles['card-content']}>
                    <div className={styles['card-header']}>
                      <h3
                        className={styles['project-name']}
                        title={project.name}
                      >
                        {project.name}
                      </h3>
                    </div>

                    <div className={styles['dates-section']}>
                      <div className={styles['date-row']}>
                        <span className={styles['label']}>Start Date:</span>
                        <span className={styles['date-value']}>
                          {formatDate(project.start_date)}
                        </span>
                      </div>
                      <div className={styles['date-row']}>
                        <span className={styles['label']}>End Date:</span>
                        <span className={styles['date-value']}>
                          {formatDate(project.end_date)}
                        </span>
                      </div>
                      <div className={styles['date-row']}>
                        <span className={styles['label']}>
                          Sustainability End Date:
                        </span>
                        <span className={styles['date-value']}>
                          {formatDate(project.sustainability_end_date)}
                        </span>
                      </div>
                    </div>

                    <div className={styles['policy-section']}>
                      <div className={styles['label']}>
                        Data Retention Policy:
                      </div>
                      <p
                        className={styles['policy-text']}
                        title={project.data_retention_policy}
                      >
                        {project.data_retention_policy}
                      </p>
                    </div>
                  </div>

                  <div className={styles['card-footer']}>
                    <button
                      aria-label="Edit Project"
                      className={`${styles['action-button']} ${styles.edit} tooltip`}
                      data-tip="Edit"
                      onClick={() => handleEdit(project.id!)}
                    >
                      <PencilSquareIcon className={styles['action-icon']} />
                    </button>
                    <button
                      aria-label="Delete Project"
                      className={`${styles['action-button']} ${styles.delete} tooltip`}
                      data-tip="Delete"
                      onClick={() =>
                        handleDeleteClick(project.id!, project.name)
                      }
                    >
                      <TrashIcon className={styles['action-icon']} />
                    </button>
                  </div>
                </div>
              ))
            : null}
        </div>
      )}
      {!data || data?.content?.length === 0 ? (
        <div className={styles['empty-state']}>
          <p className={styles['empty-text']}>No projects found</p>
        </div>
      ) : null}

      {data?.content && data.content.length > 0 && (
        <div className="flex items-center justify-between px-4 py-1 border border-gray-200 rounded-lg my-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {data.total_pages}
            </span>
            <span className="text-sm text-gray-500">
              ({data.total_elements} total projects)
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

export default Projects
