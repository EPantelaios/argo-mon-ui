import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import {
  useCreateTenantMutation,
  useGetUserTenantById,
  useUpdateUserTenantMutation,
} from '@/hooks/useTenants'
import type { Metadata } from '@/types/tenants'
import { toast, Toaster } from 'sonner'
import ErrorDisplay from '@/components/ErrorDisplay'
import Button from '../components/Button'
import ContactInformation from '../components/ContactInformation'
import InfrastructureMetadata from '../components/InfrastructureMetadata'
import LoadingSpinner from '@/components/LoadingSpinner'
import styles from './CreateTenant.module.css'

const BACKEND_API = import.meta.env.VITE_BACKEND_URI

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CreateTenant = () => {
  const { id: tenantId } = useParams<{ id?: string }>()
  const isEditMode = Boolean(tenantId)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    website: '',
    image: '',
  })
  const [contacts, setContacts] = useState([
    {
      name: '',
      email: '',
      type: '',
    },
  ])
  const [metadata, setMetadata] = useState({
    ui_url: '',
    poem_url: '',
    topology_type: '',
    topology_url: '',
    topology_feed: '',
    internalLists: [{ email: '', type: '' }],
    auth_name: '',
    auth_url: '',
  })
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'contact' | 'metadata'>(
    'info',
  )
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    website: '',
  })
  const [hasContactValidationError, setHasContactValidationError] =
    useState(false)
  const [hasMetadataValidationError, setHasMetadataValidationError] =
    useState(false)

  const createMutation = useCreateTenantMutation()
  const updateMutation = useUpdateUserTenantMutation()

  const {
    data: tenantData,
    isLoading: isTenantLoading,
    error: tenantError,
  } = useGetUserTenantById(tenantId || '')

  // Load tenant data in edit mode
  useEffect(() => {
    if (isEditMode && tenantData) {
      setFormData({
        name: tenantData.info.name || '',
        email: tenantData.info.email || '',
        description: tenantData.info.description || '',
        website: tenantData.info.website || '',
        image: tenantData.info.image || '',
      })

      if (tenantData.info.image) {
        setImagePreview(tenantData.info.image)
        if (!tenantData.info.image.includes(BACKEND_API)) {
          setImageUrl(tenantData.info.image)
        }
      }

      if (tenantData.contacts && tenantData.contacts.length > 0) {
        setContacts(
          tenantData.contacts.map((contact) => ({
            name: contact.name || '',
            email: contact.email || '',
            type: contact.type || '',
          })),
        )
      }

      if (tenantData.metadata) {
        const loadedInternalLists =
          tenantData.metadata.internalLists &&
          tenantData.metadata.internalLists.length > 0
            ? tenantData.metadata.internalLists.map((list) => ({
                email: list.email || '',
                type: list.type || '',
              }))
            : [{ email: '', type: '' }]

        setMetadata({
          ui_url: tenantData.metadata.instance?.ui_url || '',
          poem_url: tenantData.metadata.instance?.poem_url || '',
          topology_type: tenantData.metadata.instance?.topology?.type || '',
          topology_url: tenantData.metadata.instance?.topology?.url || '',
          topology_feed: tenantData.metadata.instance?.topology?.feed || '',
          internalLists: loadedInternalLists,
          auth_name: tenantData.metadata.auth_metadata?.auth_name || '',
          auth_url: tenantData.metadata.auth_metadata?.auth_url || '',
        })
      }
    }
  }, [isEditMode, tenantData])

  const onDrop = useCallback((acceptedFiles: File[]) => {
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
        setFormData((prev) => ({ ...prev, image: base64String }))
        setImagePreview(base64String)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
  })

  // Validation helpers for tab indicators
  const hasTenantDetailsErrors = () => {
    return (
      !!errors.name ||
      !!errors.email ||
      !!errors.website ||
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.description.trim()
    )
  }

  const hasContactErrors = () => {
    return contacts.some(
      (contact) =>
        !contact.name.trim() ||
        !contact.email.trim() ||
        !contact.type ||
        hasContactValidationError,
    )
  }

  const hasMetadataErrors = () => {
    return hasMetadataValidationError
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submitData =
      formData.image || imageUrl
        ? { ...formData, image: formData.image || imageUrl }
        : { ...formData, image: undefined }

    const contactsData = contacts
      .filter((contact) => contact.name.trim() && contact.email.trim())
      .map((contact) => ({
        name: contact.name,
        email: contact.email,
        type: contact.type || undefined,
      }))

    const metadataObj: Metadata = {}

    // Check if any instance fields have values
    const hasInstanceData =
      metadata.ui_url.trim() ||
      metadata.poem_url.trim() ||
      metadata.topology_type.trim() ||
      metadata.topology_url.trim() ||
      metadata.topology_feed.trim()

    if (hasInstanceData) {
      metadataObj.instance = {}

      if (metadata.ui_url.trim()) {
        metadataObj.instance.ui_url = metadata.ui_url
      }

      if (metadata.poem_url.trim()) {
        metadataObj.instance.poem_url = metadata.poem_url
      }

      // Check if any topology fields have values
      const hasTopologyData =
        metadata.topology_type.trim() ||
        metadata.topology_url.trim() ||
        metadata.topology_feed.trim()

      if (hasTopologyData) {
        metadataObj.instance.topology = {}

        if (metadata.topology_type.trim()) {
          metadataObj.instance.topology.type = metadata.topology_type
        }

        if (metadata.topology_url.trim()) {
          metadataObj.instance.topology.url = metadata.topology_url
        }

        if (metadata.topology_feed.trim()) {
          metadataObj.instance.topology.feed = metadata.topology_feed
        }
      }
    }

    const internalListsData = metadata.internalLists
      .filter((list) => list.email.trim() && list.type)
      .map((list) => ({
        email: list.email || undefined,
        type: list.type || undefined,
      }))

    if (internalListsData.length > 0) {
      metadataObj.internalLists = internalListsData
    }

    if (metadata?.auth_name || metadata?.auth_url) {
      metadataObj.auth_metadata = {
        auth_name: metadata.auth_name || undefined,
        auth_url: metadata.auth_url || undefined,
      }
    }

    if (isEditMode && tenantId) {
      // Update existing tenant
      updateMutation.mutate(
        {
          id: tenantId,
          data: {
            info: submitData,
            contacts: contactsData,
            metadata: metadataObj,
          },
        },
        {
          onSuccess: () => {
            toast.success('Tenant updated successfully!')
            setTimeout(() => {
              navigate(`/tenants`)
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
              toast.error(`Failed to update tenant: ${error.message}`)
            }
          },
        },
      )
    } else {
      // Create new tenant
      createMutation.mutate(
        { info: submitData, contacts: contactsData, metadata: metadataObj },
        {
          onSuccess: () => {
            toast.success('Tenant created successfully!')
            setTimeout(() => {
              navigate(`/tenants`)
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
              toast.error(`Failed to create tenant: ${error.message}`)
            }
          },
        },
      )
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target

    if (name === 'name') {
      // Capitalize and filter to only allow Latin letters (a-z, A-Z), numbers (0-9), spaces, and hyphen
      const hasInvalidChars = /[^a-zA-Z0-9\s-]/.test(value)
      const sanitizedValue = value.replace(/[^a-zA-Z0-9\s-]/g, '').toUpperCase()

      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }))

      if (hasInvalidChars) {
        setErrors((prev) => ({
          ...prev,
          name: 'Only Latin uppercase letters, numbers, spaces, and hyphen (-) are allowed',
        }))
      } else {
        setErrors((prev) => ({ ...prev, name: '' }))
      }
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'email') {
      // Email validation
      if (value && !emailRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          email: 'Please enter a valid email address',
        }))
      } else {
        setErrors((prev) => ({ ...prev, email: '' }))
      }
    }

    if (name === 'website') {
      // URL validation - must start with http:// or https://
      const urlRegex = /^https?:\/\/.+\..+/
      if (value && !urlRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          website:
            'Please enter a valid URL (must start with http:// or https://)',
        }))
      } else {
        setErrors((prev) => ({ ...prev, website: '' }))
      }
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)

    if (!url) {
      // Clear preview if URL is empty
      setImagePreview(null)
      setFormData((prev) => ({ ...prev, image: '' }))
      return
    }

    const isValidUrl = /^(https?:\/\/.+\..+|data:image\/.+;base64,.+)/.test(url)

    if (isValidUrl) {
      // Test if image can actually load
      const img = new Image()
      img.onload = () => {
        setImagePreview(url)
        setFormData((prev) => ({ ...prev, image: url }))
      }
      img.onerror = () => {
        setImagePreview(null)
        setFormData((prev) => ({ ...prev, image: '' }))
      }
      img.src = url
    } else {
      // Clear preview if URL format is invalid
      setImagePreview(null)
      setFormData((prev) => ({ ...prev, image: '' }))
    }
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImagePreview(null)
    setImageUrl('')
    setFormData((prev) => ({ ...prev, image: '' }))
  }

  return (
    <>
      <Toaster richColors position="top-center" duration={2000} />
      <div className="page-container">
        {isEditMode && isTenantLoading ? (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        ) : isEditMode && tenantError ? (
          <ErrorDisplay error={tenantError} context="tenant" />
        ) : (
          <>
            <div className={styles.header}>
              <div>
                <h1 className="page-title">
                  {isEditMode ? 'Edit Tenant' : 'Create New Tenant'}
                </h1>
                <p className="page-subtitle">
                  {isEditMode ? (
                    <>
                      Update information for tenant
                      <strong style={{ wordBreak: 'break-all' }}>
                        {tenantData?.info.name
                          ? ` ${tenantData.info.name}`
                          : ''}
                      </strong>
                    </>
                  ) : (
                    'Fill in the details to create a new tenant'
                  )}
                </p>
              </div>
              <Button
                onClick={() => navigate('/tenants')}
                size="sm"
                variant="secondary"
              >
                <ArrowLeftIcon className="size-4" />
                Back to Tenants
              </Button>
            </div>

            <div className={styles['action-bar']}>
              <div className={styles.legend}>
                <span className={styles['legend-indicator']} />
                <span className={styles['legend-separator']}>:</span>
                <span className={styles['legend-text']}>
                  Indicates required fields are missing or invalid
                </span>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !!errors.name ||
                  !!errors.email ||
                  !!errors.website ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.description.trim() ||
                  !contacts.some(
                    (contact) =>
                      contact.name.trim() &&
                      contact.email.trim() &&
                      contact.type.trim(),
                  ) ||
                  hasContactValidationError ||
                  hasMetadataValidationError
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEditMode
                    ? 'Update'
                    : 'Create'}
              </Button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'info' ? styles['tab-active'] : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  Tenant Details
                  <span
                    className={`${styles['tab-indicator']} ${
                      hasTenantDetailsErrors()
                        ? styles['tab-indicator-visible']
                        : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'contact' ? styles['tab-active'] : ''}`}
                  onClick={() => setActiveTab('contact')}
                >
                  Contact Information
                  <span
                    className={`${styles['tab-indicator']} ${
                      hasContactErrors() ? styles['tab-indicator-visible'] : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'metadata' ? styles['tab-active'] : ''}`}
                  onClick={() => setActiveTab('metadata')}
                >
                  Infrastructure Settings
                  <span
                    className={`${styles['tab-indicator']} ${
                      hasMetadataErrors() ? styles['tab-indicator-visible'] : ''
                    }`}
                  />
                </button>
              </div>

              <div style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
                <div className={styles.section}>
                  <div className={styles['section-info']}>
                    <h2 className="section-title">Tenant Information</h2>
                    <p className="section-description">
                      Basic details and identification
                    </p>
                  </div>

                  <div className={styles['section-content']}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter tenant name"
                        disabled={isEditMode}
                        required
                      />
                      {errors.name && (
                        <span className="text-red-400 text-sm mt-1">
                          {errors.name}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>
                        Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="The email of the tenant that is responsible"
                        required
                      />
                      {errors.email && (
                        <span className="text-red-400 text-sm mt-1">
                          {errors.email}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>
                        Description <span className="required">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="A small description about the tenant"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles['section-info']}>
                    <h2 className="section-title">Additional Details</h2>
                    <p className="section-description">
                      Optional media and website links
                    </p>
                  </div>

                  <div className={styles['section-content']}>
                    <div className={styles.field}>
                      <label className={styles.label}>Image</label>
                      <div
                        {...getRootProps()}
                        className={`${styles.dropzone} ${isDragActive ? styles['dropzone-active'] : ''}`}
                      >
                        <input {...getInputProps()} />
                        {imagePreview ? (
                          <div className={styles['image-preview']}>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className={styles['remove-image-button']}
                              aria-label="Remove image"
                            >
                              <XMarkIcon className={styles['remove-icon']} />
                            </button>
                            <img
                              className={styles['preview-image']}
                              src={imagePreview}
                            />
                            <p className={styles['dropzone-text']}>
                              Drop image here or click to upload
                            </p>
                          </div>
                        ) : (
                          <>
                            <PhotoIcon className={styles['upload-icon']} />
                            <p className={styles['upload-text']}>
                              {isDragActive
                                ? 'Drop image here'
                                : 'Drop image here or click to upload'}
                            </p>
                          </>
                        )}
                      </div>
                      <div className={styles['or-divider']}>
                        <span>OR</span>
                      </div>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={handleImageUrlChange}
                        placeholder="Enter image URL"
                      />
                    </div>

                    <div className={`${styles.field} mt-2`}>
                      <label className={styles.label}>Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="Enter the project related URL"
                      />
                      {errors.website && (
                        <span className="text-red-400 text-sm mt-1">
                          {errors.website}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{ display: activeTab === 'contact' ? 'block' : 'none' }}
              >
                <ContactInformation
                  contacts={contacts}
                  onContactsChange={setContacts}
                  onValidationChange={setHasContactValidationError}
                  initialData={tenantData?.contacts || null}
                />
              </div>

              <div
                style={{ display: activeTab === 'metadata' ? 'block' : 'none' }}
              >
                <InfrastructureMetadata
                  metadata={metadata}
                  onMetadataChange={setMetadata}
                  onValidationChange={setHasMetadataValidationError}
                  initialData={tenantData?.metadata || null}
                />
              </div>
            </form>
          </>
        )}
      </div>
    </>
  )
}

export default CreateTenant
