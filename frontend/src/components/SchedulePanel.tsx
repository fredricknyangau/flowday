import { useQuery } from '@tanstack/react-query'
import { fetchSchedule } from '@/api/schedule'
import { ScheduleBlock } from './ScheduleBlock'
import { isWithinInterval, parseISO, setHours, setMinutes } from 'date-fns'

function getActiveBlockId(blocks: { id: string; start_time: string }[]): string | null {
  const now = new Date()
  for (let i = 0; i < blocks.length; i++) {
    const [h, m]  = blocks[i].start_time.split(':').map(Number)
    const start   = setMinutes(setHours(new Date(), h), m)
    const nextBlock = blocks[i + 1]
    if (!nextBlock) return blocks[i].id
    const [nh, nm] = nextBlock.start_time.split(':').map(Number)
    const end      = setMinutes(setHours(new Date(), nh), nm)
    if (isWithinInterval(now, { start, end })) return blocks[i].id
  }
  return null
}

export function SchedulePanel() {
  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  })

  const blockArray = Array.isArray(blocks) ? blocks : []
  const activeId = getActiveBlockId(blockArray)

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {blockArray.map((block) => (
        <ScheduleBlock
          key={block.id}
          block={block}
          isActive={block.id === activeId}
        />
      ))}
    </div>
  )
}
