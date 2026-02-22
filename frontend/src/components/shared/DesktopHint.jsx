import { MonitorSmartphone } from 'lucide-react'

export function DesktopHint() {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900 md:hidden">
      <p className="flex items-start gap-2 text-xs leading-relaxed">
        <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          This screen is optimized for desktop workflows. Core actions are
          available on mobile, but a larger screen is faster for heavy tasks.
        </span>
      </p>
    </div>
  )
}
