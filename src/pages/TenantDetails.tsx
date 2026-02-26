import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useGetUserTenantById } from '../hooks/useTenants'
import { useGetUserTenantProjects } from '../hooks/useTenants'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorDisplay from '@/components/ErrorDisplay'
import Button from '@/components/Button'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import { ArrowUpRightFromSquare, MailIcon, ShieldCheck } from 'lucide-react'
import styles from './TenantDetails.module.css'
import TenantReports from './TenantReports'

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const TenantDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'info' | 'reports'>('info')

  useEffect(() => {
    const hash = location?.hash
    if (hash?.startsWith('#reports')) {
      setActiveTab('reports')
    } else {
      setActiveTab('info')
    }
  }, [location.hash])

  const { data: tenantData, isLoading, error } = useGetUserTenantById(id || '')

  const {
    data: projectsData,
    isLoading: projectsLoading,
    fetchNextPage: fetchNextProjectsPage,
    hasNextPage: hasNextProjectsPage,
  } = useGetUserTenantProjects(id || '', true)

  useEffect(() => {
    if (hasNextProjectsPage) {
      fetchNextProjectsPage()
    }
  }, [projectsData, hasNextProjectsPage, fetchNextProjectsPage])

  const projects =
    projectsData?.pages?.flatMap((page) => page.content || []) || []

  const handleBack = () => {
    navigate('/tenants')
  }

  const handleEdit = () => {
    navigate(`/tenants/edit/${id}`)
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorDisplay error={error} context="tenant" />
      </div>
    )
  }

  if (!tenantData) {
    return (
      <div className="page-container">
        <ErrorDisplay
          error="The tenant you are looking for does not exist or has been removed."
          context="tenant"
        />
      </div>
    )
  }

  const { contacts, metadata } = tenantData

  return (
    <div className="w-[100%] max-w-[1480px]">
      <header className="bg-white border-b-2 border-gray-200 my-1">
        {/* <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">
            <Link
              to="/tenants"
              className="hover:text-blue-600 flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Tenants
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-slate-800 truncate max-w-[120px] sm:max-w-none">
              {tenantData.info.name}
            </span>
          </div>
        </div> */}

        <div className="px-6 py-3 flex flex-col xl:flex-row items-start xl:items-center gap-4 xl:gap-6">
          {tenantData?.info?.image ? (
            <div className="flex-shrink-0 w-16 h-16 bg-white border border-gray-200 rounded flex items-center justify-center p-1 shadow-sm">
              <img
                src={tenantData.info.image}
                alt="Logo"
                className="object-contain"
              />
            </div>
          ) : (
            <div className={styles['tenant-fallback']}>
              <span className={styles['fallback-text']}>
                {tenantData.info.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-shrink-0 xl:border-r border-gray-100 xl:pr-6 xl:mr-2 w-full xl:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold leading-none">
                {tenantData.info.name}
              </h1>
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100">
                {/* This is a placeholder */}
                <ShieldCheck size={12} /> ACTIVE
              </span>
            </div>
            <p
              className="text-sm text-gray-500 mt-1 max-w-md line-clamp-3"
              title={tenantData.info.description}
            >
              {tenantData.info.description}
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-4 sm:gap-6 xl:gap-8 flex-grow w-full xl:w-auto">
            {tenantData.info.website && (
              <div className="flex flex-col min-w-[120px]">
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">
                  Website
                </span>
                <a
                  href={tenantData.info.website}
                  className="text-sm text-blue-600 flex items-center gap-1 font-medium hover:underline break-words"
                >
                  <span className="break-words">
                    {tenantData.info.website?.replace('https://www.', '')}
                  </span>
                  <ArrowUpRightFromSquare size={14} className="flex-shrink-0" />
                </a>
              </div>
            )}

            <div className="flex flex-col min-w-[120px]">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">
                ID
              </span>
              <span className="text-sm font-semibold flex items-center gap-1 text-slate-700 break-words">
                {tenantData.id}
              </span>
            </div>

            <div className="flex flex-col min-w-[120px]">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">
                Email
              </span>
              <span className="text-sm font-semibold flex items-center gap-1 text-slate-700">
                <MailIcon size={12} className="text-slate-400 flex-shrink-0" />{' '}
                <span className="break-words">{tenantData.info.email}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-row gap-3 ml-auto self-start xl:flex-col xl:items-end flex-shrink-0">
            <Button
              onClick={handleBack}
              size="sm"
              variant="secondary"
              className="whitespace-nowrap"
            >
              <ArrowLeftIcon className="size-4" style={{ flexShrink: 0 }} />
              Back to Tenants
            </Button>
            <Button
              onClick={handleEdit}
              size="sm"
              variant="primary"
              className="whitespace-nowrap"
            >
              Edit Tenant
            </Button>
          </div>
        </div>

        <div className={styles.tabs}>
          {['info', 'reports'].map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles['tab-active'] : ''}`}
              onClick={() => {
                if (tab === 'info' || tab === 'reports') {
                  setActiveTab(tab)
                  window.location.hash = tab
                }
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="py-4 px-10">
        {activeTab === 'info' && (
          <>
            <div className={styles.section}>
              <div className={styles['section-header']}>
                <h2 className={styles['section-title']}>Projects</h2>
              </div>
              {projectsLoading ? (
                <div className={styles.card}>
                  <LoadingSpinner size="sm" inline />
                </div>
              ) : projects && projects.length > 0 ? (
                <div className={styles['contacts-grid']}>
                  {projects.map((project) => (
                    <div key={project.id} className={styles['card']}>
                      <div className={styles['contact-info']}>
                        <p className={styles['contact-name']}>{project.name}</p>
                        {project.description && (
                          <p
                            className={`${styles['contact-email']} line-clamp-8`}
                            title={project.description}
                          >
                            {project.description}
                          </p>
                        )}
                        <div className={styles['project-dates']}>
                          <span>
                            {formatDate(project.start_date)} -{' '}
                            {formatDate(project.end_date)}
                          </span>
                          {project.sustainability_end_date && (
                            <span className={styles['project-sustainability']}>
                              Sustainability:{' '}
                              {formatDate(project.sustainability_end_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles['empty-state-card']}>
                  <p className={styles['no-data']}>No projects assigned</p>
                </div>
              )}
            </div>

            {/* Contacts */}
            <div className={styles.section}>
              <div className={styles['section-header']}>
                <h2 className={styles['section-title']}>Contacts</h2>
              </div>
              {contacts && contacts.length > 0 ? (
                <div className={styles['contacts-grid']}>
                  {contacts.map((contact, index) => (
                    <div key={index} className={styles['card']}>
                      <div className={styles['contact-info']}>
                        <p className={styles['contact-name']}>{contact.name}</p>
                        <p className={styles['contact-email']}>
                          {contact.email}
                        </p>
                        {contact.type && (
                          <span className={styles['contact-type']}>
                            {contact.type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.card}>
                  <p className={styles['no-data']}>No contacts available</p>
                </div>
              )}
            </div>

            {/* Infrastructure Metadata */}
            <div className={styles.section}>
              <div className={styles['section-header']}>
                <h2 className={styles['section-title']}>
                  Infrastructure Metadata
                </h2>
              </div>
              {metadata &&
              (metadata.instance ||
                metadata.internalLists ||
                metadata.auth_metadata) ? (
                <div
                  className={`${styles.card} ${styles['infrastructure-metadata']}`}
                >
                  {/* Instance Information */}
                  {metadata.instance && (
                    <>
                      <div className={styles['metadata-subsection']}>
                        <h3 className={styles['subsection-title']}>Instance</h3>
                      </div>
                      <div className={styles['card-row']}>
                        <div className={styles['info-group']}>
                          <label className={styles.label}>UI URL</label>
                          <p className={styles.value}>
                            {metadata.instance.ui_url ? (
                              <a
                                href={metadata.instance.ui_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                              >
                                {metadata.instance.ui_url}
                              </a>
                            ) : (
                              <span className={styles['no-data']}>
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                        <div className={styles['info-group']}>
                          <label className={styles.label}>POEM URL</label>
                          <p className={styles.value}>
                            {metadata.instance.poem_url ? (
                              <a
                                href={metadata.instance.poem_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                              >
                                {metadata.instance.poem_url}
                              </a>
                            ) : (
                              <span className={styles['no-data']}>
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Topology */}
                      {metadata.instance.topology && (
                        <>
                          <div className={styles['metadata-subsection']}>
                            <h3 className={styles['subsection-title']}>
                              Topology
                            </h3>
                          </div>
                          <div className={styles['card-row']}>
                            <div className={styles['info-group']}>
                              <label className={styles.label}>Type</label>
                              <p className={styles.value}>
                                {metadata.instance.topology.type || (
                                  <span className={styles['no-data']}>
                                    Not provided
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className={styles['info-group']}>
                              <label className={styles.label}>URL</label>
                              <p className={styles.value}>
                                {metadata.instance.topology.url ? (
                                  <a
                                    href={metadata.instance.topology.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.link}
                                  >
                                    {metadata.instance.topology.url}
                                  </a>
                                ) : (
                                  <span className={styles['no-data']}>
                                    Not provided
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className={styles['card-row']}>
                            <div className={styles['info-group']}>
                              <label className={styles.label}>Feed</label>
                              <p className={`${styles.value} max-w-[45%]`}>
                                {metadata.instance.topology.feed ? (
                                  metadata.instance.topology.feed.startsWith(
                                    'http',
                                  ) ? (
                                    <a
                                      href={metadata.instance.topology.feed}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`${styles.link} break-words`}
                                    >
                                      {metadata.instance.topology.feed}
                                    </a>
                                  ) : (
                                    <span className="break-words">
                                      {metadata.instance.topology.feed}
                                    </span>
                                  )
                                ) : (
                                  <span className={styles['no-data']}>
                                    Not provided
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Internal Lists */}
                  {metadata.internalLists &&
                    metadata.internalLists.length > 0 && (
                      <>
                        <div className={styles['metadata-subsection']}>
                          <h3 className={styles['subsection-title']}>
                            Internal Lists
                          </h3>
                        </div>
                        <div className={styles['internal-lists']}>
                          {metadata.internalLists.map((list, index) => (
                            <div
                              key={index}
                              className={styles['internal-list-item']}
                            >
                              <div className={styles['info-group']}>
                                <label className={styles.label}>Email</label>
                                <p className={styles.value}>{list.email}</p>
                              </div>
                              <div className={styles['info-group']}>
                                <label className={styles.label}>Type</label>
                                <p className={styles.value}>{list.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                  {/* Authentication Metadata */}
                  {metadata.auth_metadata && (
                    <>
                      <div className={styles['metadata-subsection']}>
                        <h3 className={styles['subsection-title']}>
                          Authentication
                        </h3>
                      </div>
                      <div className={styles['card-row']}>
                        <div className={styles['info-group']}>
                          <label className={styles.label}>Auth Name</label>
                          <p className={styles.value}>
                            {metadata.auth_metadata.auth_name || (
                              <span className={styles['no-data']}>
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                        <div className={styles['info-group']}>
                          <label className={styles.label}>Auth URL</label>
                          <p className={styles.value}>
                            {metadata.auth_metadata.auth_url ? (
                              <a
                                href={metadata.auth_metadata.auth_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                              >
                                {metadata.auth_metadata.auth_url}
                              </a>
                            ) : (
                              <span className={styles['no-data']}>
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.card}>
                  <p className={styles['no-data']}>
                    No infrastructure metadata available
                  </p>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <div className={styles['section-header']}>
                <h2 className={styles['section-title']}>
                  Additional Information
                </h2>
              </div>
              <div className={styles.card}>
                <div className={styles['card-row']}>
                  <div className={styles['info-group']}>
                    <label className={styles.label}>Created</label>
                    <p className={styles.value}>
                      {formatDate(tenantData.info.created_at || '')}
                    </p>
                  </div>
                  <div className={styles['info-group']}>
                    <label className={styles.label}>Updated</label>
                    <p className={styles.value}>
                      {formatDate(tenantData.info.updated_at || '')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'reports' && <TenantReports tenantId={id || ''} />}
      </div>
    </div>
  )
}

export default TenantDetails
