import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PrimaryButton, GhostButton } from '@/components/ui/buttons'

interface GuestWarningModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function GuestWarningModal({ open, onConfirm, onCancel }: GuestWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="bg-sl-black border border-amber-400/30 sm:max-w-sm shadow-[0_0_30px_rgba(251,191,36,0.15)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <DialogTitle className="text-amber-400 font-bold uppercase tracking-wider">
              Guest Account
            </DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="text-sm space-y-2 pt-1">
              <p className="text-sl-silver-muted">
                Your progress is stored on <span className="text-sl-silver font-semibold">this device only</span>.
              </p>
              <p className="text-sl-silver-muted">
                If you clear your browser data or switch devices,{' '}
                <span className="text-amber-400 font-semibold">your account cannot be recovered</span>.
              </p>
              <p className="text-sl-silver-muted">
                You can link a Google account anytime from the menu to keep your progress safe.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-2">
          <GhostButton onClick={onCancel} className="flex-1">
            Back
          </GhostButton>
          <PrimaryButton onClick={onConfirm} className="flex-1">
            Continue as Guest
          </PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
