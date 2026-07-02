import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOCK_TYPE_COLORS } from '@/lib/constants'
import type { ScheduleBlock as ScheduleBlockType } from '@/types'

interface Props {
  block: ScheduleBlockType
  isActive?: boolean
}

export function ScheduleBlock({ block, isActive }: Props) {
  const colorClass = BLOCK_TYPE_COLORS[block.block_type] ?? BLOCK_TYPE_COLORS.Personal

  return (
    <div
      className={cn(
        'border-l-4 rounded-lg px-3 py-2 flex items-center gap-3 transition-all',
        colorClass,
        isActive && 'ring-2 ring-blue-400 ring-offset-1'
      )}
    >
      <span className="text-xs font-mono text-gray-500 w-10 shrink-0">
        {block.start_time.slice(0, 5)}
      </span>
      <span className={cn(
        'text-sm flex-1',
        block.is_protected && 'font-semibold'
      )}>
        {block.label}
      </span>
      {block.is_protected && (
        <Lock size={12} className="text-emerald-600 shrink-0" />
      )}
    </div>
  )
}
