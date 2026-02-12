import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { useGetUserTenantById } from '@/hooks/useTenants'
import type { UserGroup } from '@/types/profile'
import LoadingSpinner from '@/components/LoadingSpinner'

type RoleProtectedProps = {
  children: JSX.Element
  requiredRoles: string[]
  redirectTo?: string
  checkTenantAccess?: boolean
}

function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = '/',
  checkTenantAccess = false,
}: RoleProtectedProps) {
  const { initialized, authenticated, profile } = useAuth()
  const location = useLocation()
  const { id: tenantId } = useParams<{ id: string }>() || {}
  const [profileTimeout, setProfileTimeout] = useState(false)

  const { data: tenantData, isLoading: tenantLoading } = useGetUserTenantById(
    tenantId || '',
    checkTenantAccess && !!tenantId && authenticated,
  )

  // Set a timeout for profile loading (5 seconds)
  useEffect(() => {
    if (authenticated && !profile && !profileTimeout) {
      const timer = setTimeout(() => {
        setProfileTimeout(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [authenticated, profile, profileTimeout])

  if (!initialized) return null

  if (!authenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (
    (checkTenantAccess && tenantId && tenantLoading) ||
    (!profile && !profileTimeout)
  ) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <LoadingSpinner />
      </div>
    )
  }

  const isSuperAdmin = profile?.roles?.includes('super_admin')

  const hasTenantAccess = (tenantName: string) => {
    if (!tenantName || !profile?.groups) return false

    const group = profile?.groups?.find(
      (g: UserGroup) => g?.name === tenantName,
    )
    return group?.role === 'admin' || group?.role === 'viewer'
  }

  const hasRequiredRole = (() => {
    if (isSuperAdmin) {
      return true
    }

    // For tenant-specific routes
    if (checkTenantAccess) {
      if (!tenantData) {
        return false
      }
      return hasTenantAccess(tenantData.info.name)
    }

    // For non-tenant routes, check role requirements
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    // Check if user has any of the required roles
    return requiredRoles.some((role) => profile?.roles?.includes(role))
  })()

  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
