import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'digit',
    label: 'One number',
    test: (password) => /[0-9]/.test(password),
  },
]

export function PasswordRequirements({ password = '' }) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/35 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Password requirements
      </p>
      <ul className="mt-2 space-y-1.5">
        {RULES.map((rule) => {
          const met = rule.test(password)

          return (
            <li
              key={rule.id}
              className={cn(
                'flex items-center gap-2 text-xs',
                met ? 'text-green-700' : 'text-muted-foreground'
              )}
            >
              {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{rule.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
