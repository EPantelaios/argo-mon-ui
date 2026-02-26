import LoadingSpinner from '@/components/LoadingSpinner'
import { useGetUserTenantById } from '@/hooks/useTenants'
import {
  ArrowBigUp,
  ArrowLeftIcon,
  Check,
  ChevronRight,
  ClockIcon,
  CopyIcon,
  Lock,
  Play,
  Rows4,
  SquareArrowOutUpRight,
  ZapIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Link, useParams } from 'react-router-dom'

const BACKEND_API = import.meta.env.VITE_BACKEND_URI

interface CapabilityEndpointProps {
  label: string
  url: string
  isApi?: boolean
  apiDoc?: string
  apiAccess?: string
}

interface Stats {
  name: string
  value: number
  colorClass?: string
}

interface CapabilityCardProps {
  title: string
  description: string
  icon: ReactElement
  uiUrl: string
  apiUrl: string
  apiDoc?: string
  apiAccess?: string
  colorClass: string
  docUrl: string
  stats?: Stats[]
}

const CapabilityEndpoint = ({
  label,
  url,
  isApi = false,
  apiDoc = '',
  apiAccess = '',
}: CapabilityEndpointProps) => {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const copyToClipboard = async (): Promise<void> => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 300)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="group relative">
      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest leading-none">
        {label}
      </span>
      <div
        className={`mt-1 flex flex-col rounded-md border transition-all duration-200 ${
          isApi
            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-inner'
            : 'bg-white border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between p-2">
          <code
            className={`text-xs truncate font-mono font-medium ${isApi ? (copied ? 'text-black bg-green-300' : 'text-emerald-400') : 'text-blue-600'}`}
          >
            {url}
          </code>
          {isApi ? (
            <button
              onClick={copyToClipboard}
              className="ml-2 p-1 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none hover:cursor-pointer"
            >
              {copied ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <CopyIcon size={14} />
              )}
            </button>
          ) : (
            <a
              target="_blank"
              href={url}
              className="ml-2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <SquareArrowOutUpRight size={14} />
            </a>
          )}
        </div>
        {isApi && (
          <div className="flex gap-1.5 px-2 pb-2 pt-0.5 justify-end">
            <a
              target="_blank"
              href={apiAccess}
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer border border-slate-700"
            >
              <div className="flex items-center">
                <Lock size={10} className="inline me-1.5" />
                Get Credentials
              </div>
            </a>
            <a
              target="_blank"
              href={apiDoc}
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer border border-slate-700"
            >
              <div className="flex items-center">
                <Play size={10} className="inline me-1.5" />
                Try Request
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

const CapabilityCard = ({
  title,
  description,
  icon,
  uiUrl,
  apiUrl,
  apiDoc,
  apiAccess,
  colorClass,
  docUrl,
  stats,
}: CapabilityCardProps) => {
  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg shadow-sm ${colorClass}`}>
              <div className="scale-90">{icon}</div>
            </div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {stats &&
              stats.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col items-end border-l border-slate-100 pl-3"
                >
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                    {item.name || 'Stat'}
                  </span>
                  <span
                    className={`text-xl font-black ${item.colorClass ? item.colorClass : item.value > 90 ? 'text-green-600' : item.value > 70 ? 'text-amber-600' : 'text-red-600'} leading-none mt-0.5`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4 leading-normal">
          {description}
        </p>

        <div className="space-y-3">
          <CapabilityEndpoint label="User Interface" url={uiUrl} />
          <CapabilityEndpoint
            label="API Access"
            url={apiUrl}
            isApi={true}
            apiAccess={apiAccess}
            apiDoc={apiDoc}
          />
        </div>
      </div>

      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-end items-center">
        <a
          href={docUrl}
          target="_blank"
          className="group hover:cursor-pointer flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
        >
          View Documentation
          <ChevronRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  )
}

const TenantCapabilities = () => {
  const { id } = useParams<{ id: string }>()
  const { data: tenantData, isLoading } = useGetUserTenantById(id || '')

  if (isLoading) {
    return (
      <div className="container p-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!tenantData) {
    return (
      <div className="container">
        <p className="text-slate-500 text-center">Tenant not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-900">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-none">
              Capabilities
            </h1>
            <p className="text-slate-500 mt-1">
              Explore capabilities for tenant:
              <span className="ms-1.5 text-blue-600 font-bold uppercase tracking-wide">
                {tenantData.info.name}
              </span>
            </p>
          </div>
          <Link
            to="/tenants"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-800 text-white text-sm font-normal rounded-lg transition-colors duration-200 no-underline"
          >
            <ArrowLeftIcon className="size-4" />
            <span>Back to Tenants</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CapabilityCard
          title="Availability"
          colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
          description="Percentage of time a service is fully functional and accessible, based on monitored status history."
          uiUrl={`${tenantData.metadata?.instance?.ui_url}/${tenantData.info.name}/report-ar/CORE/SERVICEGROUPS`}
          apiUrl={`${BACKEND_API}/api/tenants/${tenantData.info.name}/results/ar`}
          apiDoc={`${BACKEND_API}/swagger-ui/#/Admin/get_v1_admin_tenants__id__status`}
          apiAccess={`${BACKEND_API}/oidc-client`}
          icon={<ClockIcon />}
          docUrl="https://argoeu.github.io/argo-monitoring/docs/reports/ar#availability"
          stats={[{ name: 'Avg Avail', value: 98.3 }]}
        />

        <CapabilityCard
          title="Status"
          colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100"
          description="Real-time chronological health timelines, tracking states between OK, Warning, and Critical transitions."
          uiUrl={`${tenantData.metadata?.instance?.ui_url}/${tenantData.info.name}/report-status/CORE/SERVICEGROUPS`}
          apiUrl={`${BACKEND_API}/api/tenants/${tenantData.info.name}/status`}
          apiDoc={`${BACKEND_API}/swagger-ui/#/Admin/get_v1_admin_tenants__id__status`}
          apiAccess={`${BACKEND_API}/oidc-client`}
          icon={<Rows4 />}
          docUrl="https://argoeu.github.io/argo-monitoring/docs/reports/status_timelines"
          stats={[
            { name: 'Warnings', value: 8, colorClass: 'text-amber-500' },
            { name: 'Critical', value: 10, colorClass: 'text-red-500' },
          ]}
        />

        <CapabilityCard
          title="Uptime"
          colorClass="bg-amber-50 text-amber-600 border border-amber-100"
          description="Continuous operation score depicting service stability without registered downtime or interruptions."
          uiUrl={`${tenantData.metadata?.instance?.ui_url}/${tenantData.info.name}/report-ar/CORE/SERVICEGROUPS`}
          apiUrl={`${BACKEND_API}/api/tenants/${tenantData.info.name}/results/uptime`}
          apiDoc={`${BACKEND_API}/swagger-ui/#/Admin/get_v1_admin_tenants__id__status`}
          apiAccess={`${BACKEND_API}/oidc-client`}
          icon={<ArrowBigUp />}
          docUrl="https://argoeu.github.io/argo-monitoring/docs/reports/ar#availability"
          stats={[{ name: 'Avg Uptime', value: 99.8 }]}
        />

        <CapabilityCard
          title="Performance"
          colorClass="bg-pink-50 text-pink-600 border border-pink-100"
          description="Metric analytics for system performance monitoring, focusing on latency and response speed."
          uiUrl={`${tenantData.metadata?.instance?.ui_url}/${tenantData.info.name}/performances`}
          apiUrl={`${BACKEND_API}/api/tenants/${tenantData.info.name}/performance`}
          apiDoc={`${BACKEND_API}/swagger-ui/#/Admin/get_v1_admin_tenants__id__status`}
          apiAccess={`${BACKEND_API}/oidc-client`}
          icon={<ZapIcon />}
          docUrl="https://argoeu.github.io/argo-monitoring/docs/reports/ar#availability"
          stats={[
            { name: 'Latency (s)', value: 3.2, colorClass: 'text-amber-500' },
          ]}
        />
      </div>
    </div>
  )
}

export default TenantCapabilities
