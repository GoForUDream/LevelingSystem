import { X, SkipForward, Ban } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CancelRecurringModalProps {
  isOpen: boolean
  onClose: () => void
  onSkipOnce: () => void
  onCancelAll: () => void
  taskTitle: string
  expPenalty: number
  isLoading: boolean
}

export default function CancelRecurringModal({
  isOpen,
  onClose,
  onSkipOnce,
  onCancelAll,
  taskTitle,
  expPenalty,
  isLoading,
}: CancelRecurringModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-sl-gray border border-sl-blue/30 shadow-[0_0_30px_rgba(0,163,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sl-blue/20">
          <h2 className="text-sm font-bold uppercase tracking-wider text-sl-blue">
            {t('cancelRecurring.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-sl-silver-muted hover:text-sl-silver transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-sm text-sl-silver mb-2">
            "{taskTitle}"
          </p>
          <p className="text-xs text-sl-silver-muted mb-6">
            {t('cancelRecurring.description')}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {/* Skip Once Option */}
            <button
              onClick={onSkipOnce}
              disabled={isLoading}
              className="w-full p-4 border border-sl-blue/30 bg-sl-gray-light/50 hover:bg-sl-blue/10 hover:border-sl-blue/50 transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <SkipForward size={20} className="text-sl-blue shrink-0 mt-0.5" />
                <div className="text-left">
                  <div className="text-sm font-bold text-sl-silver group-hover:text-sl-blue transition-colors">
                    {t('cancelRecurring.skipOnce')}
                  </div>
                  <div className="text-xs text-sl-silver-muted mt-1">
                    {t('cancelRecurring.skipDesc')}
                  </div>
                  <div className="text-xs text-sl-red mt-2">
                    {t('cancelRecurring.penalty', { penalty: expPenalty })}
                  </div>
                </div>
              </div>
            </button>

            {/* Cancel All Option */}
            <button
              onClick={onCancelAll}
              disabled={isLoading}
              className="w-full p-4 border border-sl-red/30 bg-sl-gray-light/50 hover:bg-sl-red/10 hover:border-sl-red/50 transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <Ban size={20} className="text-sl-red shrink-0 mt-0.5" />
                <div className="text-left">
                  <div className="text-sm font-bold text-sl-silver group-hover:text-sl-red transition-colors">
                    {t('cancelRecurring.cancelAll')}
                  </div>
                  <div className="text-xs text-sl-silver-muted mt-1">
                    {t('cancelRecurring.cancelAllDesc')}
                  </div>
                  <div className="text-xs text-sl-red mt-2">
                    {t('cancelRecurring.penalty', { penalty: expPenalty })}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-sl-black/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-sl-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
