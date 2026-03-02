import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function CartConflictDialog({ open, currentStoreName, newStoreName, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace cart?</DialogTitle>
          <DialogDescription>
            Your cart has items from <strong>{currentStoreName}</strong>. Adding from{' '}
            <strong>{newStoreName}</strong> will clear your current cart.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>Keep current cart</Button>
          <Button variant="destructive" onClick={onConfirm}>Clear and add</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
