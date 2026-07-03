import { fetchSchedule } from '@/api/schedule'
import { useQuery } from '@tanstack/react-query'
import { isWithinInterval, setHours, setMinutes } from 'date-fns'
import { ScheduleBlock } from './ScheduleBlock'

function getActiveBlockId(blocks: { id: string; start_time: string }[]): string | null {
  const now = new Date()
  for (let i = 0; i < blocks.length; i++) {
    const [h, m] = blocks[i].start_time.split(':').map(Number)
    const start  = setMinutes(setHours(new Date(), h), m)
    const next   = blocks[i + 1]
    if (!next) return blocks[i].id
    const [nh, nm] = next.start_time.split(':').map(Number)
    const end = setMinutes(setHours(new Date(), nh), nm)
    if (isWithinInterval(now, { start, end })) return blocks[i].id
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
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
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

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <ScheduleBlock key={block.id} block={block} isActive={block.id === activeId} />
      ))}
    </div>
  )
}
