import { useState } from 'react'
import { Lock, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOCK_TYPE_COLORS } from '@/lib/constants'
import type { ScheduleBlock as ScheduleBlockType } from '@/types'
import { skipScheduleBlock } from '@/api/schedule'

interface Props {
  block: ScheduleBlockType
  isActive?: boolean
}

export function ScheduleBlock({ block, isActive }: Props) {
  const colorClass = BLOCK_TYPE_COLORS[block.block_type] ?? BLOCK_TYPE_COLORS.Personal
  const [skipped, setSkipped] = useState(false)

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newValue = !skipped
    setSkipped(newValue)
    const todayStr = new Date().toISOString().split('T')[0]
    try {
      await skipScheduleBlock({ id: block.id, date: todayStr, skipped: newValue })
    } catch (err) {
      console.error(err)
      setSkipped(!newValue) // Revert on failure
    }
  }

  return (
    <div
      className={cn(
        'border-l-4 rounded-lg px-3 py-2 flex items-center gap-3 transition-all relative',
        colorClass,
        isActive && 'ring-2 ring-blue-400 ring-offset-1',
        skipped && 'opacity-50 grayscale'
      )}
    >
      <span className={cn("text-xs font-mono text-gray-500 w-10 shrink-0", skipped && "line-through")}>
        {block.start_time.slice(0, 5)}
      </span>
      <span className={cn(
        'text-sm flex-1',
        block.is_protected && 'font-semibold',
        skipped && 'line-through text-gray-400'
      )}>
        {block.label}
      </span>
      {block.is_protected && !skipped && (
        <Lock size={12} className="text-emerald-600 shrink-0" />
      )}
      <button 
        onClick={handleSkip}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          skipped ? "bg-gray-200 text-gray-600" : "text-gray-300 hover:text-gray-600 hover:bg-gray-100"
        )}
        title={skipped ? "Unskip" : "Skip Block"}
      >
        <SkipForward size={14} />
      </button>
    </div>
  )
}
