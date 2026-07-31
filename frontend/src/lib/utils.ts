import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInMinutes } from 'date-fns'
import type { Assignment } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUrgencyLevel(deadline: string): 'overdue' | 'critical' | 'warning' | 'safe' {
  const now = new Date()
  const due = new Date(deadline)
  const minutesLeft = differenceInMinutes(due, now)

  if (minutesLeft < 0)   return 'overdue'
  if (minutesLeft < 120) return 'critical'
  if (minutesLeft < 360) return 'warning'
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

const PRIORITY_SCORE: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
}

export function sortAssignmentsByUrgency(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((a, b) => {
    // Overdue (by status) always sorts above everything else in Today
    const aOverdue = a.status === 'Overdue' ? 0 : 1
    const bOverdue = b.status === 'Overdue' ? 0 : 1
    if (aOverdue !== bOverdue) return aOverdue - bOverdue

    // Within the same overdue-tier, sort by deadline then context priority
    const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    if (diff !== 0) return diff
    const scoreA = a.client_priority ? PRIORITY_SCORE[a.client_priority] || 2 : 2
    const scoreB = b.client_priority ? PRIORITY_SCORE[b.client_priority] || 2 : 2
    return scoreB - scoreA
  })
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
