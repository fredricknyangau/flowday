import { fetchSchedule } from '@/api/schedule'
import { useQuery } from '@tanstack/react-query'
import { addDays, isWithinInterval, setHours, setMinutes, subDays } from 'date-fns'
import { ShieldCheck } from 'lucide-react'
import { ScheduleBlock } from './ScheduleBlock'

function getActiveBlockId(blocks: { id: string; start_time: string }[]): string | null {
  const now = new Date()
  for (let i = 0; i < blocks.length; i++) {
    const [h, m] = blocks[i].start_time.split(':').map(Number)
    const start = setMinutes(setHours(new Date(), h), m)
    const next  = blocks[i + 1]
    
    let end: Date
    if (next) {
      const [nh, nm] = next.start_time.split(':').map(Number)
      end = setMinutes(setHours(new Date(), nh), nm)
    } else {
      end = addDays(start, 1)
    }

    if (end <= start) {
      end = addDays(end, 1)
    }

    if (isWithinInterval(now, { start, end })) return blocks[i].id

    const prevStart = subDays(start, 1)
    const prevEnd   = subDays(end, 1)
    if (isWithinInterval(now, { start: prevStart, end: prevEnd })) return blocks[i].id
  }
  return null
}

export function SchedulePanel() {
  const {
    data: blocks = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  })

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={`skel-schedule-${i}`} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-center">
        <p className="text-sm text-red-600 font-medium mb-2">Could not load schedule</p>
        <button
          onClick={() => refetch()}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p className="text-sm">No schedule blocks found</p>
      </div>
    )
  }

  const activeId = getActiveBlockId(blocks)
  const protectedCount = blocks.filter((b) => b.is_protected).length

  return (
    <div className="space-y-2">
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-900">Protected Routine</p>
            <p className="text-[11px] text-emerald-700">Reading, Learning, Nap & Sleep</p>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
          {protectedCount} Protected
        </span>
      </div>

      {blocks.map((block) => (
        <ScheduleBlock key={block.id} block={block} isActive={block.id === activeId} />
      ))}
    </div>
  )
}
