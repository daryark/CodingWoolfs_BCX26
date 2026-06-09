import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, AlertTriangle, Wrench, CheckCircle2, Clock } from 'lucide-react'
import { LogReport } from '../utils/dummyData'

interface LogReportModalProps {
  report: LogReport
  onClose: () => void
}

function LogReportModal({ report, onClose }: LogReportModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Incident report: ${report.title}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{t('report.title')}</p>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">{report.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Issue */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{t('report.issue')}</h3>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed">{report.issue}</p>
            </div>
          </section>

          {/* What was tried */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={16} className="text-amber-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{t('report.whatWasTried')}</h3>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-2">
              {report.tried.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Solution */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{t('report.solution')}</h3>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed">{report.solution}</p>
            </div>
          </section>

          {/* Resolved at */}
          {report.resolvedAt && (
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
              <Clock size={13} />
              <span>{t('report.resolvedAt')} {report.resolvedAt}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LogReportModal
