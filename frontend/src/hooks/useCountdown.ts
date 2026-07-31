import { useState, useEffect } from 'react'
import { differenceInSeconds } from 'date-fns'

export function formatOverdueDuration(secondsPast: number): string {
  const mins = Math.floor(secondsPast / 60)
  const hrs  = Math.floor(secondsPast / 3600)
  const days = Math.floor(secondsPast / 86400)

  if (days >= 1) {
    const remHrs = hrs % 24
    if (remHrs > 0 && days < 7) {
      return `Overdue by ${days}d ${remHrs}h`
    }
    return `Overdue by ${days} day${days > 1 ? 's' : ''}`
  }
  if (hrs >= 1) {
    const remMins = mins % 60
    if (remMins > 0) {
      return `Overdue by ${hrs}h ${remMins}m`
    }
    return `Overdue by ${hrs}h`
  }
  return `Overdue by ${Math.max(1, mins)}m`
}

export function useCountdown(deadline: string) {
  const [secondsLeft, setSecondsLeft] = useState(
    differenceInSeconds(new Date(deadline), new Date())
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(differenceInSeconds(new Date(deadline), new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const isOverdue = secondsLeft < 0
  const absSecs   = Math.abs(secondsLeft)
  const hours     = Math.floor(absSecs / 3600)
  const minutes   = Math.floor((absSecs % 3600) / 60)
  const seconds   = absSecs % 60

  const overdueDisplay = formatOverdueDuration(absSecs)

  const display = isOverdue
    ? overdueDisplay
    : hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`

  return { secondsLeft, isOverdue, hours, minutes, seconds, display, overdueDisplay }
}

