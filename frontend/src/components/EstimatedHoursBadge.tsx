import { estimateHours } from '@/lib/utils'

interface Props {
  wordCount: number | null
}

export function EstimatedHoursBadge({ wordCount }: Props) {
  if (!wordCount || wordCount <= 0) return null

  const hours = estimateHours(wordCount)

  return (
    <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-2 text-center">
      <span className="text-sm text-blue-700 font-medium">
        Estimated time: {hours} {hours === 1 ? 'hour' : 'hours'}
      </span>
    </div>
  )
}
