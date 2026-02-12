import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from './auth/useAuth'
import {
  ArrowLeftStartOnRectangleIcon,
  ServerStackIcon,
  WrenchScrewdriverIcon,
  RectangleStackIcon,
  FolderIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from '@heroicons/react/16/solid'
import Button from './components/Button'
import LoginPrompt from './components/LoginPrompt'

function SidebarNavItem({
  to,
  children,
  end,
}: {
  to: string
  end?: boolean
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-md mx-2',
          isActive
            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default function Layout() {
  const { authenticated, profile, login, logout } = useAuth()

  const isSuperAdmin = profile?.roles?.includes('super_admin')

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto overflow-x-hidden">
        <div className="px-3 border-b border-gray-200">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.location.replace('/')}
          >
            <img
              src="/ARGO_LOGO_COLOR_ENG_TITLE.png"
              alt="ARGO Logo"
              className="h-18 w-auto"
            />
          </div>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-y-1">
          {isSuperAdmin && (
            <SidebarNavItem to="/administration">
              <UserGroupIcon className="size-5" aria-hidden />
              Administration
            </SidebarNavItem>
          )}
          {authenticated && (
            <SidebarNavItem to="/my-invitations">
              <EnvelopeIcon className="size-5" aria-hidden />
              My Invitations
            </SidebarNavItem>
          )}
          <SidebarNavItem to="/tenants">
            <ServerStackIcon className="size-5" aria-hidden />
            Tenants
          </SidebarNavItem>
          {isSuperAdmin && (
            <SidebarNavItem to="/projects">
              <FolderIcon className="size-5" aria-hidden />
              Projects
            </SidebarNavItem>
          )}
          <SidebarNavItem to="/status-pages/view">
            <RectangleStackIcon className="size-5" aria-hidden />
            Status Pages
          </SidebarNavItem>
          <SidebarNavItem to="/status-pages/build">
            <WrenchScrewdriverIcon className="size-5" aria-hidden />
            Build Status Page
          </SidebarNavItem>
        </nav>

        <div className="border-t border-gray-200">
          {authenticated && profile?.name ? (
            <div className="p-4">
              <div className="flex items-center justify-between gap-1 text-sm text-gray-700">
                <Link to="/profile">
                  <div className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-90 w-48">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {(profile.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate font-medium" title={profile.name}>
                      {profile.name || 'User'}
                    </div>
                  </div>
                </Link>
                <button
                  className="me-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0 cursor-pointer tooltip"
                  data-tip="Logout"
                  onClick={logout}
                  type="button"
                >
                  <ArrowLeftStartOnRectangleIcon className="size-5 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => login()}
                className="w-full"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 bg-white overflow-auto">
        <div className="container mx-auto p-6">
          {!authenticated ? (
            <LoginPrompt
              title="Authentication Required"
              description="Please login to access the status pages management"
              onLogin={login}
            />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  )
}
