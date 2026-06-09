import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, AlertCircle, CheckCircle, MessageSquare, FileText } from 'lucide-react'
import { Machine } from './MachineList'
import { LOGS_HEALTHY, LOGS_ERROR, DUMMY_REPORTS, LogEntry } from '../utils/dummyData'
import LogReportModal from './LogReportModal'
import clsx from 'clsx'

const ERROR_DESCRIPTIONS: Record<string, string> = {
  '4': 'Emergency stop triggered due to excessive vibration (6.8 mm/s). Motor drive fault detected on axis Z. Manual inspection required before restart.',
}

interface MachineModalProps {
  machine: Machine
  onClose: () => void
  onStartAssistant: (machine: Machine) => void
}

function MachineModal({ machine, onClose, onStartAssistant }: MachineModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [activeReport, setActiveReport] = useState<string | null>(null)

  const isError = machine.status === 'error'
  const logs = isError ? LOGS_ERROR : LOGS_HEALTHY

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeReport) setActiveReport(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, activeReport])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const levelStyle: Record<LogEntry['level'], string> = {
    info:  'text-gray-500',
    warn:  'text-amber-600',
    error: 'text-red-600 font-medium',
  }

  const levelBadge: Record<LogEntry['level'], string> = {
    info:  'text-gray-400',
    warn:  'text-amber-500',
    error: 'text-red-500',
  }

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
              <img
                src={machine.photo}
                alt={machine.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name + Status */}
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900">{machine.name}</h3>
              <div
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                  isError
                    ? 'bg-red-50 text-red-700'
                    : machine.status === 'online'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {isError ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                <span className="capitalize">{machine.status}</span>
              </div>
            </div>

            {/* Error description + Start Assistant */}
            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-700 leading-relaxed">
                  {ERROR_DESCRIPTIONS[machine.id] ??
                    'An unexpected fault has been detected. Please inspect the machine before resuming operation.'}
                </p>
                <button
                  onClick={() => onStartAssistant(machine)}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <MessageSquare size={16} />
                  {t('machines.startAssistant')}
                </button>
              </div>
            )}

            {/* Last update */}
            <p className="text-xs text-gray-400">Last update: {machine.lastUpdate}</p>

            {/* Logs */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('machines.eventLog')}</h4>
              <div className="h-52 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-100">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => log.reportId && setActiveReport(log.reportId)}
                    className={clsx(
                      'w-full flex items-start gap-2 px-3 py-2 font-mono text-xs leading-relaxed text-left group transition-colors',
                      log.reportId
                        ? 'hover:bg-blue-50 cursor-pointer'
                        : 'cursor-default'
                    )}
                    title={log.reportId ? 'View incident report' : undefined}
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
                      <FileText
                        size={13}
                        className="flex-shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors mt-px"
                      />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5 pl-1">
                {t('machines.clickReport')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Log report modal — layered on top */}
      {activeReport && DUMMY_REPORTS[activeReport] && (
        <LogReportModal
          report={DUMMY_REPORTS[activeReport]}
          onClose={() => setActiveReport(null)}
        />
      )}
    </>
  )
}

export default MachineModal
