import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInMinutes, differenceInHours } from 'date-fns'
import type { Assignment } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUrgencyLevel(deadline: string): 'overdue' | 'critical' | 'warning' | 'safe' {
  const now = new Date()
  const due = new Date(deadline)
  const minutesLeft = differenceInMinutes(due, now)
  const hoursLeft = differenceInHours(due, now)

  if (minutesLeft < 0) return 'overdue'
  if (hoursLeft < 2)   return 'critical'
  if (hoursLeft < 6)   return 'warning'
  return 'safe'
}

export function getUrgencyClasses(level: ReturnType<typeof getUrgencyLevel>) {
  switch (level) {
    case 'overdue':  return 'border-l-red-500   bg-red-50'
    case 'critical': return 'border-l-red-400   bg-red-50'
    case 'warning':  return 'border-l-orange-400 bg-orange-50'
    case 'safe':     return 'border-l-emerald-400 bg-white'
  }
}

export function getUrgencyBadgeClasses(level: ReturnType<typeof getUrgencyLevel>) {
  switch (level) {
    case 'overdue':  return 'bg-red-100    text-red-700'
    case 'critical': return 'bg-red-100    text-red-700'
    case 'warning':  return 'bg-orange-100 text-orange-700'
    case 'safe':     return 'bg-emerald-100 text-emerald-700'
  }
}

export function estimateHours(wordCount: number): number {
  return Math.ceil(wordCount / 300 / 0.5) * 0.5
}

export function sortAssignmentsByUrgency(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )
}

export function getDayBoundary(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(8, 0, 0, 0)
  if (now.getHours() < 8) {
    start.setDate(start.getDate() - 1)
  }
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}
