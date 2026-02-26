import { useState } from 'react'
import { useGetUserContactTypes } from '@/hooks/useTenants'
import { PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import type { Metadata } from '@/types/tenants'
import styles from '../pages/CreateTenant.module.css'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface InfrastructureMetadataProps {
  metadata: {
    ui_url: string
    poem_url: string
    topology_type: string
    topology_url: string
    topology_feed: string
    internalLists: Array<{ email: string; type: string }>
    auth_name: string
    auth_url: string
  }
  onMetadataChange: (metadata: {
    ui_url: string
    poem_url: string
    topology_type: string
    topology_url: string
    topology_feed: string
    internalLists: Array<{ email: string; type: string }>
    auth_name: string
    auth_url: string
  }) => void
  onValidationChange?: (hasError: boolean) => void
  initialData?: Metadata | null
}

const InfrastructureMetadata = ({
  metadata,
  onMetadataChange,
  onValidationChange,
}: InfrastructureMetadataProps) => {
  const [errors, setErrors] = useState(() => ({
    uiUrl: '',
    poemUrl: '',
    topologyUrl: '',
    authUrl: '',
    internalListsEmails: metadata.internalLists.map(() => ({ email: '' })),
  }))

  const { data: contactTypes, isLoading: isContactTypesLoading } =
    useGetUserContactTypes()

  const urlErrorMesage =
    'Please enter a valid URL (must start with http:// or https://)'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value: fieldValue } = e.target
    const urlRegex = /^https?:\/\/.+\..+/

    onMetadataChange({
      ...metadata,
      [name]: fieldValue,
    })

    if (name === 'ui_url') {
      if (fieldValue && !urlRegex.test(fieldValue)) {
        setErrors((prev) => ({ ...prev, uiUrl: urlErrorMesage }))
        onValidationChange?.(true)
      } else {
        setErrors((prev) => ({ ...prev, uiUrl: '' }))
        const hasErrors =
          !!errors.poemUrl ||
          !!errors.topologyUrl ||
          !!errors.authUrl ||
          errors.internalListsEmails.some((err) => err.email)
        onValidationChange?.(hasErrors)
      }
    }

    if (name === 'poem_url') {
      if (fieldValue && !urlRegex.test(fieldValue)) {
        setErrors((prev) => ({ ...prev, poemUrl: urlErrorMesage }))
        onValidationChange?.(true)
      } else {
        setErrors((prev) => ({ ...prev, poemUrl: '' }))
        const hasErrors =
          !!errors.uiUrl ||
          !!errors.topologyUrl ||
          !!errors.authUrl ||
          errors.internalListsEmails.some((err) => err.email)
        onValidationChange?.(hasErrors)
      }
    }

    if (name === 'topology_url') {
      if (fieldValue && !urlRegex.test(fieldValue)) {
        setErrors((prev) => ({ ...prev, topologyUrl: urlErrorMesage }))
        onValidationChange?.(true)
      } else {
        setErrors((prev) => ({ ...prev, topologyUrl: '' }))
        const hasErrors =
          !!errors.uiUrl ||
          !!errors.poemUrl ||
          !!errors.authUrl ||
          errors.internalListsEmails.some((err) => err.email)
        onValidationChange?.(hasErrors)
      }
    }

    if (name === 'auth_url') {
      if (fieldValue && !urlRegex.test(fieldValue)) {
        setErrors((prev) => ({ ...prev, authUrl: urlErrorMesage }))
        onValidationChange?.(true)
      } else {
        setErrors((prev) => ({ ...prev, authUrl: '' }))
        const hasErrors =
          !!errors.uiUrl ||
          !!errors.poemUrl ||
          !!errors.topologyUrl ||
          errors.internalListsEmails.some((err) => err.email)
        onValidationChange?.(hasErrors)
      }
    }
  }

  const handleInternalListChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    const updatedLists = [...metadata.internalLists]
    updatedLists[index] = {
      ...updatedLists[index],
      [name]: value,
    }
    onMetadataChange({
      ...metadata,
      internalLists: updatedLists,
    })

    if (name === 'email') {
      const updatedErrors = [...errors.internalListsEmails]
      if (value && !emailRegex.test(value)) {
        updatedErrors[index] = { email: 'Please enter a valid email address' }
        onValidationChange?.(true)
      } else {
        updatedErrors[index] = { email: '' }
        const hasAnyError =
          !!errors.uiUrl ||
          !!errors.poemUrl ||
          !!errors.topologyUrl ||
          !!errors.authUrl ||
          updatedErrors.some((err) => err.email)
        onValidationChange?.(hasAnyError)
      }
      setErrors((prev) => ({
        ...prev,
        internalListsEmails: updatedErrors,
      }))
    }
  }

  const handleAddInternalList = () => {
    if (metadata.internalLists.length < 5) {
      onMetadataChange({
        ...metadata,
        internalLists: [...metadata.internalLists, { email: '', type: '' }],
      })
      setErrors((prev) => ({
        ...prev,
        internalListsEmails: [...prev.internalListsEmails, { email: '' }],
      }))
    }
  }

  const handleRemoveInternalList = (index: number) => {
    if (metadata.internalLists.length > 1) {
      const updatedLists = metadata.internalLists.filter((_, i) => i !== index)
      const updatedErrors = errors.internalListsEmails.filter(
        (_, i) => i !== index,
      )
      onMetadataChange({
        ...metadata,
        internalLists: updatedLists,
      })
      setErrors((prev) => ({
        ...prev,
        internalListsEmails: updatedErrors,
      }))
      const hasAnyError =
        !!errors.uiUrl ||
        !!errors.poemUrl ||
        !!errors.topologyUrl ||
        !!errors.authUrl ||
        updatedErrors.some((err) => err.email)
      onValidationChange?.(hasAnyError)
    }
  }

  return (
    <>
      <div className={styles.section}>
        <div className={styles['section-info']}>
          <h2 className="section-title">Instance URLs</h2>
          <p className="section-description">
            Primary instance URL configurations
          </p>
        </div>

        <div className={styles['section-content']}>
          <div className={styles['field-grid']}>
            <div className={styles.field}>
              <label className={styles.label}>UI URL</label>
              <input
                type="url"
                name="ui_url"
                value={metadata.ui_url}
                onChange={handleChange}
                placeholder="Enter UI URL"
              />
              {errors.uiUrl && (
                <span className="text-red-400 text-sm mt-1">
                  {errors.uiUrl}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>POEM URL</label>
              <input
                type="url"
                name="poem_url"
                value={metadata.poem_url}
                onChange={handleChange}
                placeholder="Enter POEM URL"
              />
              {errors.poemUrl && (
                <span className="text-red-400 text-sm mt-1">
                  {errors.poemUrl}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles['section-info']}>
          <h2 className="section-title">Topology</h2>
          <p className="section-description">Topology configuration settings</p>
        </div>

        <div className={styles['section-content']}>
          <div className={styles['field-grid']}>
            <div className={styles.field}>
              <label className={styles.label}>Type</label>
              {isContactTypesLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <select
                  name="topology_type"
                  value={metadata.topology_type}
                  onChange={handleChange}
                >
                  <option value="">Select type</option>
                  <option value="GOCDB">GOCdb</option>
                  <option value="CSV">CSV</option>
                </select>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Service URL</label>
              <input
                type="url"
                name="topology_url"
                value={metadata.topology_url}
                onChange={handleChange}
                placeholder="Enter topology URL"
              />
              {errors.topologyUrl && (
                <span className="text-red-400 text-sm mt-1">
                  {errors.topologyUrl}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Data Feed</label>
              <input
                type="text"
                name="topology_feed"
                value={metadata.topology_feed}
                onChange={handleChange}
                placeholder="Enter topology feed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles['section-info']}>
          <h2 className="section-title">Internal Lists</h2>
          <p className="section-description">Internal mailing lists</p>
        </div>

        <div className={styles['section-content']}>
          {metadata.internalLists.map((list, index) => (
            <div
              key={index}
              className={styles['contact-group']}
              style={{
                borderBottom:
                  index === metadata.internalLists.length - 1
                    ? 'none'
                    : '1px solid #e5e7eb',
                marginBottom:
                  index === metadata.internalLists.length - 1 ? '0' : '0.5rem',
                paddingBottom:
                  index === metadata.internalLists.length - 1 ? '0' : '1rem',
              }}
            >
              <div className={styles['contact-header']}>
                <span className={styles['contact-label']}>
                  Internal List {index + 1}
                </span>
                <div className={styles['contact-actions']}>
                  {index === metadata.internalLists.length - 1 &&
                    metadata.internalLists.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddInternalList}
                        className={styles['icon-button']}
                        title="Add internal list"
                      >
                        <PlusIcon className={styles['icon']} />
                      </button>
                    )}
                  {metadata.internalLists.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInternalList(index)}
                      className={styles['icon-button-danger']}
                      title="Remove internal list"
                    >
                      <TrashIcon className={styles['icon']} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles['field-grid']}>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={list.email}
                    onChange={(e) => handleInternalListChange(index, e)}
                    placeholder="Enter email address"
                  />
                  {errors.internalListsEmails[index]?.email && (
                    <span className="text-red-400 text-sm mt-1">
                      {errors.internalListsEmails[index].email}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Type</label>
                  {isContactTypesLoading ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : (
                    <select
                      name="type"
                      value={list.type}
                      onChange={(e) => handleInternalListChange(index, e)}
                      style={{ textTransform: 'capitalize' }}
                    >
                      <option value="">Select type</option>
                      {contactTypes?.map((type) => (
                        <option
                          key={type}
                          value={type}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {type.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles['section-info']}>
          <h2 className="section-title">Authentication Metadata</h2>
          <p className="section-description">
            Authentication configuration settings
          </p>
        </div>

        <div className={styles['section-content']}>
          <div className={styles['field-grid']}>
            <div className={styles.field}>
              <label className={styles.label}>Auth Name</label>
              <input
                type="text"
                name="auth_name"
                value={metadata.auth_name}
                onChange={handleChange}
                placeholder="Enter authentication name"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Auth URL</label>
              <input
                type="url"
                name="auth_url"
                value={metadata.auth_url}
                onChange={handleChange}
                placeholder="Enter authentication URL"
              />
              {errors.authUrl && (
                <span className="text-red-400 text-sm mt-1">
                  {errors.authUrl}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InfrastructureMetadata
