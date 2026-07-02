import { useState, useEffect } from 'react'
import { differenceInSeconds } from 'date-fns'

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

  const isOverdue  = secondsLeft < 0
  const hours      = Math.floor(Math.abs(secondsLeft) / 3600)
  const minutes    = Math.floor((Math.abs(secondsLeft) % 3600) / 60)
  const seconds    = Math.abs(secondsLeft) % 60

  const display = isOverdue
    ? `OVERDUE`
    : hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`

  return { secondsLeft, isOverdue, hours, minutes, seconds, display }
}
