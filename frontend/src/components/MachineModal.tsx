import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, AlertCircle, CheckCircle, MessageSquare, FileText, Loader } from 'lucide-react'
import { Machine } from './MachineList'
import { api, ApiEvent, ApiResolution } from '../utils/api'
import { LogReport } from '../utils/dummyData'
import LogReportModal from './LogReportModal'
import clsx from 'clsx'

// Build a LogReport from a real resolution record
function resolutionToReport(r: ApiResolution): LogReport {
  return {
    id: r.id,
    title: r.errorDescription ?? `Error ${r.nativeCode}`,
    issue: r.errorDescription ?? `Native error code: ${r.nativeCode}`,
    tried: r.attempts.length > 0
      ? r.attempts.map(a => `${a.action} → ${a.result}${a.durationMinutes != null ? ` (${a.durationMinutes} min)` : ''}`)
      : ['No resolution attempts recorded.'],
    solution: r.successfulFix ?? 'No successful fix recorded yet.',
    resolvedAt: r.resolvedAt ?? undefined,
  }
}

// Map a CNC event to log row
type LogLevel = 'info' | 'warn' | 'error'

interface LogRow {
  id: string
  time: string
  level: LogLevel
  message: string
  reportId?: string
}

function eventToLogRow(e: ApiEvent, reportId?: string): LogRow {
  const state = e.error.conditionState?.toLowerCase() ?? ''
  const level: LogLevel =
    state === 'fault' || e.status === 'active' ? 'error'
    : state === 'warning' ? 'warn'
    : 'info'

  return {
    id: e.id,
    time: e.timestamp.replace('T', ' ').slice(0, 19),
    level,
    message: e.error.description,
    reportId,
  }
}

interface MachineModalProps {
  machine: Machine
  onClose: () => void
  onStartAssistant: (machine: Machine) => void
}

function MachineModal({ machine, onClose, onStartAssistant }: MachineModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [activeReportId, setActiveReportId] = useState<string | null>(null)
  const [logRows, setLogRows] = useState<LogRow[]>([])
  const [reports, setReports] = useState<Record<string, LogReport>>({})
  const [loadingData, setLoadingData] = useState(true)

  const isError = machine.status === 'error'
  const machineId = machine.machineId || machine.id

  useEffect(() => {
    setLoadingData(true)
    Promise.all([
      api.getMachineEvents(machineId),
      api.getMachineResolutions(machineId),
    ])
      .then(([events, resolutions]) => {
        // Build resolution map by nativeCode
        const resByCode = Object.fromEntries(resolutions.map(r => [r.nativeCode, r]))
        // Build reports map
        const reportsMap: Record<string, LogReport> = {}
        resolutions.forEach(r => { reportsMap[r.id] = resolutionToReport(r) })

        // Build log rows
        const rows = events.map(e => {
          const res = resByCode[e.error.nativeCode]
          return eventToLogRow(e, res?.id)
        })

        setLogRows(rows)
        setReports(reportsMap)
      })
      .catch(() => {
        // API unavailable — show empty
      })
      .finally(() => setLoadingData(false))
  }, [machineId])

  const activeReport = activeReportId ? reports[activeReportId] : null

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeReportId) setActiveReportId(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, activeReportId])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const levelStyle: Record<LogLevel, string> = {
    info:  'text-gray-500',
    warn:  'text-amber-600',
    error: 'text-red-600 font-medium',
  }

  const levelBadge: Record<LogLevel, string> = {
    info:  'text-gray-400',
    warn:  'text-amber-500',
    error: 'text-red-500',
  }

  // Error description from the raw API data
  const errorDescription = isError && machine.raw?.notes
    ? machine.raw.notes
    : isError
    ? 'An unexpected fault has been detected. Please inspect the machine before resuming operation.'
    : null

  return (
    <>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Machine details: ${machine.name}`}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">{t('machines.machineDetails')}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Machine image */}
            <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              <img src={machine.photo} alt={machine.name} className="w-full h-full object-cover" />
            </div>

            {/* Name + Status */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{machine.name}</h3>
                {machine.raw && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {machine.raw.machineType} · {machine.raw.plant} · {machine.raw.line}
                  </p>
                )}
              </div>
              <div className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0',
                isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              )}>
                {isError ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                <span className="capitalize">{machine.status}</span>
              </div>
            </div>

            {/* Extra details from API */}
            {machine.raw && (
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-400 block">{t('machines.controller')}</span>
                  {machine.raw.controller}
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-400 block">{t('machines.installYear')}</span>
                  {machine.raw.installYear}
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-400 block">{t('machines.nextMaintenance')}</span>
                  {machine.raw.nextMaintenanceDue ?? '—'}
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-400 block">{t('machines.serial')}</span>
                  <span className="truncate block">{machine.raw.serialNumber}</span>
                </div>
              </div>
            )}

            {/* Error description + Start Assistant */}
            {isError && errorDescription && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-700 leading-relaxed">{errorDescription}</p>
                <button
                  onClick={() => onStartAssistant(machine)}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <MessageSquare size={16} />
                  {t('machines.startAssistant')}
                </button>
              </div>
            )}

            {/* Logs */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('machines.eventLog')}</h4>

              {loadingData ? (
                <div className="flex items-center justify-center h-20 text-gray-400">
                  <Loader size={18} className="animate-spin" />
                </div>
              ) : logRows.length === 0 ? (
                <p className="text-xs text-gray-400 px-1">{t('machines.noEvents')}</p>
              ) : (
                <>
                  <div className="h-52 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-100">
                    {logRows.map((log) => (
                      <button
                        key={log.id}
                        type="button"
                        onClick={() => log.reportId && setActiveReportId(log.reportId)}
                        className={clsx(
                          'w-full flex items-start gap-2 px-3 py-2 font-mono text-xs leading-relaxed text-left group transition-colors',
                          log.reportId ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-default'
                        )}
                        title={log.reportId ? t('machines.viewReport') : undefined}
                      >
                        <span className="text-gray-400 whitespace-nowrap flex-shrink-0 pt-px">{log.time}</span>
                        <span className={clsx('flex-shrink-0 w-10 uppercase pt-px', levelBadge[log.level])}>
                          [{log.level.toUpperCase().slice(0, 3)}]
                        </span>
                        <span className={clsx(
                          'flex-1',
                          levelStyle[log.level],
                          log.reportId && 'group-hover:underline underline-offset-2'
                        )}>
                          {log.message}
                        </span>
                        {log.reportId && (
                          <FileText size={13} className="flex-shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors mt-px" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 pl-1">{t('machines.clickReport')}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution report modal */}
      {activeReport && (
        <LogReportModal report={activeReport} onClose={() => setActiveReportId(null)} />
      )}
    </>
  )
}

export default MachineModal
