import { useCountdown } from '@/hooks/useCountdown'
import { getUrgencyLevel, getUrgencyBadgeClasses } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  deadline: string
}

export function CountdownTimer({ deadline }: Props) {
  const { display } = useCountdown(deadline)
  const level       = getUrgencyLevel(deadline)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        getUrgencyBadgeClasses(level)
      )}
    >
      {display}
    </span>
  )
}
