import { useEffect, useRef } from 'react'
import { X, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react'
import { Machine } from './MachineList'
import clsx from 'clsx'

// Dummy log entries per machine
const DUMMY_LOGS: Record<string, { time: string; level: 'info' | 'warn' | 'error'; message: string }[]> = {
  default: [
    { time: '2026-06-09 14:32:11', level: 'info', message: 'System boot completed successfully.' },
    { time: '2026-06-09 14:33:05', level: 'info', message: 'Calibration check passed. All axes nominal.' },
    { time: '2026-06-09 14:35:22', level: 'info', message: 'Production cycle started. Batch #4812.' },
    { time: '2026-06-09 14:40:01', level: 'info', message: 'Output rate: 142 units/min — within target range.' },
    { time: '2026-06-09 14:45:18', level: 'warn', message: 'Coolant temperature slightly elevated: 78°C (threshold 80°C).' },
    { time: '2026-06-09 14:50:33', level: 'info', message: 'Coolant temperature normalised: 74°C.' },
    { time: '2026-06-09 14:55:47', level: 'info', message: 'Scheduled maintenance reminder in 3 days.' },
    { time: '2026-06-09 15:00:00', level: 'info', message: 'Heartbeat OK.' },
  ],
  error: [
    { time: '2026-06-09 13:10:04', level: 'info', message: 'System boot completed successfully.' },
    { time: '2026-06-09 13:15:30', level: 'info', message: 'Calibration check passed.' },
    { time: '2026-06-09 13:20:11', level: 'warn', message: 'Vibration sensor reading above baseline: 4.2 mm/s.' },
    { time: '2026-06-09 13:22:45', level: 'warn', message: 'Vibration persists: 5.1 mm/s. Monitoring.' },
    { time: '2026-06-09 13:25:03', level: 'error', message: 'CRITICAL: Vibration threshold exceeded (6.8 mm/s). Emergency stop triggered.' },
    { time: '2026-06-09 13:25:04', level: 'error', message: 'Motor drive fault — over-current detected on axis Z.' },
    { time: '2026-06-09 13:25:05', level: 'error', message: 'Safety interlock engaged. Manual inspection required before restart.' },
    { time: '2026-06-09 13:26:00', level: 'warn', message: 'Awaiting operator acknowledgement.' },
    { time: '2026-06-09 13:40:00', level: 'warn', message: 'No operator response. Alert escalated.' },
    { time: '2026-06-09 14:00:00', level: 'error', message: 'Machine remains in fault state. Production halted.' },
  ],
}

const ERROR_DESCRIPTIONS: Record<string, string> = {
  '4': 'Emergency stop triggered due to excessive vibration (6.8 mm/s). Motor drive fault detected on axis Z. Manual inspection required before restart.',
}

interface MachineModalProps {
  machine: Machine
  onClose: () => void
  onStartAssistant: (machine: Machine) => void
}

function MachineModal({ machine, onClose, onStartAssistant }: MachineModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isError = machine.status === 'error'
  const logs = isError ? DUMMY_LOGS.error : DUMMY_LOGS.default

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const levelStyle = {
    info: 'text-gray-500',
    warn: 'text-amber-600',
    error: 'text-red-600 font-medium',
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Machine details: ${machine.name}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Machine Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Machine image */}
          <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
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
              {isError ? (
                <AlertCircle size={15} />
              ) : (
                <CheckCircle size={15} />
              )}
              <span className="capitalize">{machine.status}</span>
            </div>
          </div>

          {/* Error description */}
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
                Start Assistant
              </button>
            </div>
          )}

          {/* Last update */}
          <p className="text-xs text-gray-400">Last update: {machine.lastUpdate}</p>

          {/* Logs */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Log</h4>
            <div className="h-44 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-1.5 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 leading-relaxed">
                  <span className="text-gray-400 whitespace-nowrap flex-shrink-0">{log.time}</span>
                  <span className={clsx('flex-shrink-0 uppercase w-10', levelStyle[log.level])}>
                    [{log.level.toUpperCase().slice(0, 3)}]
                  </span>
                  <span className={clsx(levelStyle[log.level])}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MachineModal
