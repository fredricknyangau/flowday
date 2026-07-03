import { format } from 'date-fns'

export function TopBar() {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <span className="text-lg font-semibold text-emerald-600 tracking-tight">
        Flowday
      </span>
      <span className="text-sm text-gray-500">
        {format(new Date(), 'EEE d MMM')}
      </span>
    </div>
  )
}
