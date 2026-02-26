import { useState } from 'react'
import { useGetUserContactTypes } from '@/hooks/useTenants'
import { PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import styles from '../pages/CreateTenant.module.css'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactInformationProps {
  contacts: Array<{
    name: string
    email: string
    type: string
  }>
  onContactsChange: (
    contacts: Array<{
      name: string
      email: string
      type: string
    }>,
  ) => void
  onValidationChange?: (hasError: boolean) => void
  initialData?: Array<{ name: string; email: string; type?: string }> | null
}

const ContactInformation = ({
  contacts,
  onContactsChange,
  onValidationChange,
}: ContactInformationProps) => {
  const [errors, setErrors] = useState<Array<{ email: string }>>(() =>
    contacts.map(() => ({ email: '' })),
  )

  const { data: contactTypes, isLoading: isContactTypesLoading } =
    useGetUserContactTypes()

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target

    const updatedContacts = [...contacts]
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value,
    }
    onContactsChange(updatedContacts)

    if (name === 'email') {
      const updatedErrors = [...errors]
      if (value && !emailRegex.test(value)) {
        updatedErrors[index] = { email: 'Please enter a valid email address' }
        onValidationChange?.(true)
      } else {
        updatedErrors[index] = { email: '' }
        const hasAnyError = updatedErrors.some((err) => err.email)
        onValidationChange?.(hasAnyError)
      }
      setErrors(updatedErrors)
    }
  }

  const handleAddContact = () => {
    if (contacts.length < 5) {
      onContactsChange([...contacts, { name: '', email: '', type: '' }])
      setErrors([...errors, { email: '' }])
    }
  }

  const handleRemoveContact = (index: number) => {
    if (contacts.length > 1) {
      const updatedContacts = contacts.filter((_, i) => i !== index)
      const updatedErrors = errors.filter((_, i) => i !== index)
      onContactsChange(updatedContacts)
      setErrors(updatedErrors)
      const hasAnyError = updatedErrors.some((err) => err.email)
      onValidationChange?.(hasAnyError)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles['section-info']}>
        <h2 className="section-title">Contact Information</h2>
        <p className="section-description">Contact details for the tenant</p>
      </div>

      <div className={styles['section-content']}>
        {contacts.map((contact, index) => (
          <div key={index} className={styles['contact-group']}>
            <div className={styles['contact-header']}>
              <span className={styles['contact-label']}>
                Contact {index + 1}
              </span>
              <div className={styles['contact-actions']}>
                {index === contacts.length - 1 && contacts.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className={styles['icon-button']}
                    title="Add contact"
                  >
                    <PlusIcon className={styles['icon']} />
                  </button>
                )}
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveContact(index)}
                    className={styles['icon-button-danger']}
                    title="Remove contact"
                  >
                    <TrashIcon className={styles['icon']} />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={contact.name}
                onChange={(e) => handleChange(index, e)}
                placeholder="Enter contact name"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={contact.email}
                onChange={(e) => handleChange(index, e)}
                placeholder="Enter contact email"
              />
              {errors[index]?.email && (
                <span className="text-red-400 text-sm mt-1">
                  {errors[index].email}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Type <span className="required">*</span>
              </label>
              {isContactTypesLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <select
                  name="type"
                  value={contact.type}
                  onChange={(e) => handleChange(index, e)}
                  style={{ textTransform: 'capitalize' }}
                >
                  <option value="">Select contact type</option>
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
        ))}
      </div>
    </div>
  )
}

export default ContactInformation
