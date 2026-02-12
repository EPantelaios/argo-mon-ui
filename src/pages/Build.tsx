import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  CubeIcon,
  PaintBrushIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGroupsMutation } from '@/hooks/useGroups'
import type { StatusItemType, StatusGroupType } from '@/types/common'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import StatusGroup from '@/components/StatusGroup'
import { getStatusClass } from '@/utils/status'
import { StatusItem } from '@/components/StatusItem'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import EditLabel from '@/components/EditLabel'
import { useGetUserTenants, useGetTenantReports } from '@/hooks/useTenants'
import {
  useSavePageMutation,
  useGetPageQuery,
  useUpdatePageMutation,
} from '@/hooks/usePages'
import { toast, Toaster } from 'sonner'
import SelectGroup from '@/components/SelectGroup'
import { BanIcon, Columns2Icon, SquareIcon } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import styles from './Build.module.css'

const BACKEND_API = import.meta.env.VITE_BACKEND_URI

const Build = () => {
  const { id: editId } = useParams<{ id?: string }>()
  const isEditMode = Boolean(editId)

  const [tenantId, setTenantId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [statusGroups, setStatusGroups] = useState<StatusGroupType[]>([])
  const [report, setReport] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [saved, setSaved] = useState(false)
  const [selectIcon, setSelectIcon] = useState('led')
  const [selectText, setSelectText] = useState('none')
  const [color, setColor] = useState('#FFFFFF')
  const [logo, setLogo] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [columns, setColumns] = useState('one')
  const [activeTab, setActiveTab] = useState<'config' | 'items' | 'theming'>(
    'config',
  )

  const savePageMutation = useSavePageMutation()
  const updatePageMutation = useUpdatePageMutation()
  const getPageQuery = useGetPageQuery(tenantId || '', editId || '')
  const groupsMutation = useGroupsMutation()
  const [filterItems, setFilterItems] = useState('')

  const { data: tenantsData } = useGetUserTenants(1, 100, undefined, true)

  const { data: reportsData, isLoading: reportsLoading } = useGetTenantReports(
    tenantId,
    undefined,
    !!tenantId,
  )

  // Track next group ID to avoid duplicate names when groups are deleted
  const nextGroupIdRef = useRef(1)

  // Load existing page data in edit mode
  useEffect(() => {
    if (isEditMode && getPageQuery.data) {
      const pageData = getPageQuery.data
      // Populate form with existing data
      setName(pageData.name || 'Untitled')
      setSlug(pageData.slug || 'untitled')
      setTitle(pageData.config?.title || '')
      setDesc(pageData.config?.description || '')
      setTenantId(pageData.tenant_id || '')
      setReport(pageData.report || '')
      setStatusGroups(pageData.config?.groups || [])

      // Calculate the next group ID based on existing groups
      const existingGroups = pageData.config?.groups || []
      if (existingGroups.length > 0) {
        const maxId = existingGroups.reduce((max, group) => {
          const match = group.name.match(/^group-(\d+)$/)
          if (match) {
            const id = parseInt(match[1], 10)
            return id > max ? id : max
          }
          return max
        }, 0)
        nextGroupIdRef.current = maxId + 1
      }

      setSaved(true) // Already saved since we're editing
      setSelectIcon(pageData.config?.theming?.status.icon || 'led')
      setSelectText(pageData.config?.theming?.status.text || 'none')
      setColor(pageData.config?.theming?.color || '')
      setLogo(pageData.config?.theming?.logo || '')
      if (pageData.config?.theming?.logo) {
        setLogoPreview(pageData.config.theming.logo)
        if (!pageData.config.theming.logo.includes(BACKEND_API)) {
          setLogoUrl(pageData.config.theming.logo)
        }
      }
      setColumns(pageData.config?.theming?.columns || 'one')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, JSON.stringify(getPageQuery.data)])

  const handleAddStatusGroup = () => {
    const newGroupId = nextGroupIdRef.current
    setStatusGroups((prev) => [
      ...prev,
      {
        name: `group-${newGroupId}`,
        alias: `group-${newGroupId}`,
        list: [],
      },
    ])
    nextGroupIdRef.current = newGroupId + 1
  }

  const handleReportChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setReport(event.target.value)
  }

  const handlePageSave = () => {
    const pageData = {
      name: name,
      slug: slug,
      tenant_id: tenantId,
      report: report,

      config: {
        groups: statusGroups,
        title: title,
        description: desc,
        theming: {
          status: {
            icon: selectIcon,
            text: selectText,
          },
          logo:
            logo &&
            (logo?.startsWith('http') || logo?.startsWith('data:')
              ? logo
              : `${BACKEND_API}${logo}`),
          color: color,
          columns: columns,
        },
      },
    }

    if (isEditMode && editId) {
      // Update existing page
      updatePageMutation.mutate(
        { tenantId, pageId: editId, data: pageData },
        {
          onSuccess: () => {
            toast.success('Page updated successfully!')
            setSaved(true)
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
              toast.error(`Failed to update status page: ${error.message}`)
            }
          },
        },
      )
    } else {
      // Create new page
      savePageMutation.mutate(
        { tenantId, data: pageData },
        {
          onSuccess: () => {
            toast.success('Page created successfully!')
            setSaved(true)
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
              toast.error(`Failed to create status page: ${error.message}`)
            }
          },
        },
      )
    }
  }

  useEffect(() => {
    if (report !== '' && tenantId !== '' && !groupsMutation.isPending)
      groupsMutation.mutate({ tenantId, reportId: report })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, tenantId])

  const handleTenantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTenantId(event.target.value)
    setReport('') // Reset report when tenant changes
  }

  const handleChangeItemAlias = (
    groupName: string,
    itemName: string,
    newAlias: string,
  ) => {
    if (groupName !== '') {
      setStatusGroups((prevStatusGroups) =>
        prevStatusGroups.map((group) =>
          group.name === groupName
            ? {
                ...group,
                list: group.list.map((item) =>
                  item.name === itemName ? { ...item, alias: newAlias } : item,
                ),
              }
            : group,
        ),
      )
    }
  }

  const fl = filterItems.trim().toLowerCase()

  // this is the left column of loaded api items
  const groupName = 'status-board'
  const [parent, items, setItems] = useDragAndDrop<
    HTMLUListElement,
    StatusItemType
  >([], { group: groupName, dragHandle: '.dnd-handle' })

  useEffect(() => {
    if (groupsMutation.data) setItems(groupsMutation.data)
  }, [groupsMutation.data, setItems])

  const groupsFiltered =
    fl !== ''
      ? items.filter((item) =>
          `${item.name} ${item.status}`.toLowerCase().includes(fl),
        )
      : items

  // update column
  const updateGroup = (groupIndex: number, nextItems: StatusItemType[]) => {
    setStatusGroups((prev) => {
      const movedNames = new Set(nextItems.map((it) => it.name))

      const next = prev.map((g, i) =>
        i === groupIndex
          ? { ...g, list: nextItems } // keep original status
          : { ...g, list: g.list.filter((it) => !movedNames.has(it.name)) },
      )

      // remove moved items from the left list
      setItems((curr) => curr.filter((it) => !movedNames.has(it.name)))

      return next
    })
  }

  const renameGroup = (groupIndex: number, nextAlias: string) => {
    setStatusGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, alias: nextAlias } : g)),
    )
  }

  const removeGroup = (groupIndex: number) => {
    setStatusGroups((prev) => {
      const removed = prev[groupIndex]?.list ?? []

      if (removed.length) {
        setItems((curr) => {
          const leftIndex = leftIndexRef.current

          // avoid duplicates
          const currNames = new Set(curr.map((x) => x.name))
          const toReturn = removed.filter((it) => !currNames.has(it.name))

          // merge with current left list
          const merged = [...curr, ...toReturn]

          // sort by previously recorded index; unknowns go to the end (stable tiebreaker by name)
          const FALLBACK = Number.MAX_SAFE_INTEGER / 2
          merged.sort((a, b) => {
            const ia = leftIndex.get(a.name) ?? FALLBACK
            const ib = leftIndex.get(b.name) ?? FALLBACK
            if (ia !== ib) return ia - ib
            return a.name.localeCompare(b.name)
          })

          return merged
        })
      }

      // finally remove the column
      return prev.filter((_, i) => i !== groupIndex)
    })
  }

  /** remembers each item's last position in the LEFT list */
  const leftIndexRef = useRef<Map<string, number>>(new Map())

  /** whenever LEFT list order changes, record indices for items currently present */
  useEffect(() => {
    items.forEach((it, idx) => leftIndexRef.current.set(it.name, idx))
  }, [items])

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are supported')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64String = event.target.result as string
          setLogo(base64String)
          setLogoPreview(base64String)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
  })

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setLogoUrl(url)

    if (!url) {
      setLogoPreview(null)
      setLogo('')
      return
    }

    const isValidUrl = /^(https?:\/\/.+\..+|data:image\/.+;base64,.+)/.test(url)

    if (isValidUrl) {
      const img = new Image()
      img.onload = () => {
        setLogoPreview(url)
        setLogo(url)
      }
      img.onerror = () => {
        setLogoPreview(null)
        setLogo('')
      }
      img.src = url
    } else {
      setLogoPreview(null)
      setLogo('')
    }
  }

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLogoPreview(null)
    setLogoUrl('')
    setLogo('')
  }

  // Show loading spinner while loading page data
  if (isEditMode && getPageQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="md" />
        <span className="ml-2">Loading page data...</span>
      </div>
    )
  }

  // Show error if page failed to load
  if (isEditMode && getPageQuery.isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">
          Failed to load page: {getPageQuery.error?.message}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Toaster richColors position="top-center" duration={2000} />
      <div className="flex flex-col justify-center items-center px-6">
        <div className="page-container">
          <div className="pb-1 mb-3">
            <div>
              <h1 className="page-title">
                {isEditMode ? 'Edit Page' : 'Build New Page'}
              </h1>
              <p className="page-subtitle">
                {isEditMode
                  ? 'Update your status page configuration and content'
                  : 'Create a new status page to monitor your services'}
              </p>
            </div>
          </div>

          <div className="flex flex-row justify-between items-center mb-6">
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'config' ? styles['tab-active'] : ''}`}
                onClick={() => setActiveTab('config')}
              >
                <Cog6ToothIcon className="size-5" />
                Config
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'items' ? styles['tab-active'] : ''}`}
                onClick={() => setActiveTab('items')}
              >
                <CubeIcon className="size-5" />
                Items
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'theming' ? styles['tab-active'] : ''}`}
                onClick={() => setActiveTab('theming')}
              >
                <PaintBrushIcon className="size-5" />
                Theming
              </button>
            </div>

            <div className="flex justify-end gap-4">
              {saved && (
                <Button
                  variant="outline-primary"
                  size="md"
                  onClick={() => window.open(`/status/${slug}`, '_blank')}
                >
                  View Page
                  <ArrowTopRightOnSquareIcon className="size-4" />
                </Button>
              )}
              <Button variant="primary" size="md" onClick={handlePageSave}>
                {isEditMode ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>

          <div
            className={
              activeTab === 'config'
                ? ''
                : 'grid grid-cols-[minmax(400px,600px)_1fr] gap-8'
            }
          >
            <div
              className={activeTab === 'config' ? 'max-w-4xl w-full' : 'w-full'}
            >
              <div
                className={`${styles['custom-tab-content']} ${activeTab === 'config' ? styles['active'] : ''}`}
              >
                <div className="space-y-8">
                  <div className="grid grid-cols-[320px_1fr] gap-6">
                    <div className="pt-2 ps-2">
                      <h3 className="section-title">Page Settings</h3>
                      <p className="section-description">
                        Basic information for your status page.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Enter page name"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value)
                            if (!isEditMode) {
                              setSlug(
                                e.target.value
                                  .toLowerCase()
                                  .replaceAll(' ', '-'),
                              )
                            }
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Path <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Enter page path"
                          value={slug}
                          onChange={(e) => {
                            setSlug(
                              e.target.value.toLowerCase().replaceAll(' ', '-'),
                            )
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[320px_1fr] gap-6">
                    <div className="pt-2 ps-2">
                      <h3 className="section-title">Data Source</h3>
                      <p className="section-description">
                        Select a tenant to access its reports.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tenant: <span className="required">*</span>
                        </label>
                        <select
                          className="input w-full"
                          value={tenantId}
                          onChange={handleTenantChange}
                        >
                          <option value="">Select a tenant</option>
                          {tenantsData?.content.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>
                              {tenant.info.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {tenantId && reportsData && reportsData.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center">
                          <CheckBadgeIcon className="size-5 inline-block me-2" />
                          {reportsData.length} report
                          {reportsData.length !== 1 ? 's' : ''} available
                        </div>
                      )}

                      {tenantId && reportsData && reportsData.length === 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                          No reports found for this tenant
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Tab Content */}
              <div
                className={`${styles['custom-tab-content']} ${activeTab === 'items' ? styles['active'] : ''}`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="border border-gray-200 rounded-lg px-5 py-4 space-y-3">
                      <h3 className="section-title mb-0">Report Selection</h3>
                      <p className="section-description mb-2">
                        Choose a report and manage items.
                      </p>
                      {!tenantId && (
                        <div className="text-sm text-gray-500 p-4 text-center bg-gray-50 rounded mt-6">
                          Select a tenant in the Config tab to load reports
                        </div>
                      )}

                      {tenantId && reportsLoading && (
                        <div className="p-4 text-center">
                          <LoadingSpinner size="sm" inline />
                          <span className="ml-2 text-sm text-gray-500">
                            Loading reports...
                          </span>
                        </div>
                      )}

                      {tenantId && reportsData && reportsData.length > 0 && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Report:
                            </label>
                            <select
                              value={report}
                              className="select w-full"
                              onChange={handleReportChange}
                              disabled={statusGroups.length > 0}
                            >
                              <option value="" disabled={true}>
                                Select a report
                              </option>
                              {reportsData.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {groupsMutation.isPending && (
                            <div className="p-2 text-base mt-2 mx-auto">
                              <LoadingSpinner size="xs" inline />
                            </div>
                          )}

                          {groupsMutation.data &&
                            (groupsMutation.data.length === 0 ? (
                              <div className="text-sm required p-2 mt-2 bg-red-50 border-red-400 border text-center rounded">
                                Report is empty!
                              </div>
                            ) : (
                              <>
                                <div className="mb-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Items:
                                  </label>
                                  <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="Search..."
                                    name="filter"
                                    value={filterItems}
                                    onChange={(e) => {
                                      setFilterItems(e.target.value)
                                    }}
                                  />
                                </div>
                                <div className="text-sm text-gray-400 rounded-lg p-1 mt-2 mb-1">
                                  Drag and drop items to the preview panel to
                                  add them to a group
                                </div>
                                <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded px-4 py-1">
                                  <ul ref={parent}>
                                    {(groupsFiltered ?? []).map((group) => (
                                      <li key={group.name} className="my-2">
                                        <StatusItem
                                          iconMode={selectIcon}
                                          textMode={selectText}
                                          group=""
                                          drag={true}
                                          dragHandle="dnd-handle"
                                          name={group.name}
                                          alias={group.alias || ''}
                                          status={group.status}
                                          onChangeAlias={() => {}}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </>
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theming Tab Content */}
              <div
                className={`${styles['custom-tab-content']} ${activeTab === 'theming' ? styles['active'] : ''}`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="border border-gray-200 rounded-lg px-5 py-4 space-y-3">
                      <h3 className="section-title mb-0">
                        Customize Appearance
                      </h3>
                      <p className="section-description mb-2">
                        Customize colors, logo, and status display options.
                      </p>
                      <div className="bg-white rounded-lg py-2 space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color:
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="w-14 h-10 rounded cursor-pointer border-2 border-gray-300"
                              style={{ padding: '0.3rem' }}
                            />
                            <input
                              type="text"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="input flex-1"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Logo:
                          </label>
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
                              isDragActive
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            <input {...getInputProps()} />
                            {logoPreview ? (
                              <div className="relative flex flex-col items-center gap-2 w-full">
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-700 border-2 border-white rounded-full w-7 h-7 flex items-center justify-center z-10 shadow-md"
                                  aria-label="Remove logo"
                                >
                                  <XMarkIcon className="w-5 h-5 text-white" />
                                </button>
                                <img
                                  alt="Logo"
                                  className="h-20 w-20 object-contain rounded"
                                  src={
                                    logoPreview?.startsWith('http') ||
                                    logoPreview?.startsWith('data:')
                                      ? logoPreview
                                      : `${BACKEND_API}${logoPreview}`
                                  }
                                />
                                <p className="text-sm text-gray-500">
                                  Click or drag to change
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="text-gray-400 mb-1">
                                  <PhotoIcon className="mx-auto h-10 w-10" />
                                </div>
                                <p className="text-sm text-gray-500">
                                  {isDragActive
                                    ? 'Drop logo here'
                                    : 'Drop logo here or click to upload'}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center my-2">
                            <div className="flex-1 border-b border-gray-300"></div>
                            <span className="px-3 text-xs text-gray-500 font-medium uppercase">
                              OR
                            </span>
                            <div className="flex-1 border-b border-gray-300"></div>
                          </div>
                          <input
                            type="url"
                            value={logoUrl}
                            onChange={handleLogoUrlChange}
                            className="input w-full"
                            placeholder="Enter logo URL"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status Icon:
                          </label>
                          <SelectGroup
                            selected={selectIcon}
                            onChange={setSelectIcon}
                          >
                            <SelectGroup.Item value="led">
                              <div
                                aria-label="status"
                                className="status status-lg status-success"
                              ></div>
                              <div>Led</div>
                            </SelectGroup.Item>
                            <SelectGroup.Item value="icon">
                              <CheckCircleIcon className="text-green-500 size-4" />
                              <div>Icon</div>
                            </SelectGroup.Item>
                          </SelectGroup>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status Text:
                          </label>
                          <SelectGroup
                            selected={selectText}
                            onChange={setSelectText}
                          >
                            <SelectGroup.Item value="text">
                              <div className="text-green-500">
                                <small>OK</small>
                              </div>
                              <div>Text</div>
                            </SelectGroup.Item>
                            <SelectGroup.Item value="badge">
                              <div className="badge badge-success text-white">
                                <small>OK</small>
                              </div>
                              <div>Badge</div>
                            </SelectGroup.Item>
                            <SelectGroup.Item value="none">
                              <BanIcon className="w-4" />
                              <div>None</div>
                            </SelectGroup.Item>
                          </SelectGroup>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status Columns:
                          </label>
                          <SelectGroup selected={columns} onChange={setColumns}>
                            <SelectGroup.Item value="one">
                              <SquareIcon className="w-4" />
                              <div>One</div>
                            </SelectGroup.Item>
                            <SelectGroup.Item value="two">
                              <Columns2Icon className="w-4" />
                              <div>Two</div>
                            </SelectGroup.Item>
                          </SelectGroup>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {activeTab !== 'config' && (
              <div className="border border-gray-200 rounded-lg p-4 shadow-md w-full max-w-2xl self-start">
                <header
                  style={{ backgroundColor: color }}
                  className="p-3 mb-2 rounded-lg"
                >
                  <div className="flex flex-col items-center">
                    {logo && (
                      <img
                        src={
                          logo?.startsWith('http') || logo?.startsWith('data:')
                            ? logo
                            : `${BACKEND_API}${logo}`
                        }
                        className="my-2 h-20 w-auto object-contain"
                        alt="Logo"
                      />
                    )}
                    <div className="flex flex-row items-center gap-1 mb-1">
                      <EditLabel
                        label={title}
                        onChange={(title) => setTitle(title)}
                        size="text-3xl"
                        placeholder="Add a title"
                      />
                      <span className="required" style={{ height: '2rem' }}>
                        *
                      </span>
                    </div>
                    <EditLabel
                      label={desc}
                      onChange={(desc) => setDesc(desc)}
                      size="text-base"
                      textArea={true}
                      placeholder="Add a description"
                      color="#6a7282"
                    />
                  </div>
                </header>
                <div>
                  {statusGroups.map((col, index) => (
                    <StatusGroup
                      key={col.name}
                      name={col.name}
                      alias={col.alias || ''}
                      items={col.list}
                      group={groupName}
                      columns={columns}
                      getStatusClass={getStatusClass}
                      onItemsChange={(next) => updateGroup(index, next)}
                      onRename={(nextName) => renameGroup(index, nextName)}
                      onRemove={() => removeGroup(index)}
                      onChangeAlias={handleChangeItemAlias}
                      iconMode={selectIcon}
                      textMode={selectText}
                    />
                  ))}
                </div>
                <div>
                  <div className="text-center mt-6">
                    <div
                      className={!report ? 'tooltip' : ''}
                      data-tip={
                        !report
                          ? 'Please select a report first to add groups'
                          : ''
                      }
                    >
                      <Button
                        disabled={!report || groupsMutation.isPending}
                        onClick={handleAddStatusGroup}
                        variant="outline-secondary"
                      >
                        Click here to Add a new Group
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Build
