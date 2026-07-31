import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2, Edit3, X, Check, DollarSign, FileText, Download, Banknote } from 'lucide-react'
import { fetchContexts, createContext, updateContext, deleteContext, fetchContextAnalytics } from '@/api/contexts'
import { fetchAllAssignments } from '@/api/assignments'
import { ContextStatementModal } from '@/components/ContextStatementModal'
import type { Context, ContextType, Priority } from '@/types'
import { cn } from '@/lib/utils'

export function Contexts() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    context_type: 'Client' as ContextType,
    platform: 'WhatsApp',
    priority: 'Medium' as Priority,
  })
  const [statementContext, setStatementContext] = useState<Context | null>(null)
  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [customTarget, setCustomTarget] = useState<string>(() => {
    return localStorage.getItem('flowday_target_kes') || '50000'
  })
  const [activeFilter, setActiveFilter] = useState<'all' | 'unpaid'>('all')

  const { data: contexts = [], isLoading } = useQuery({
    queryKey: ['contexts'],
    queryFn: fetchContexts,
  })

  const { data: analytics } = useQuery({
    queryKey: ['contextAnalytics'],
    queryFn: fetchContextAnalytics,
  })

  const targetKES = parseFloat(customTarget) || 50000
  const progressPct = analytics
    ? Math.min(Math.round((analytics.total_collected_kes / targetKES) * 100), 100)
    : 0

  const totalUnpaidKes = contexts.reduce((sum, c) => sum + (c.unpaid_kes ?? 0), 0)
  const filteredContexts = activeFilter === 'unpaid'
    ? contexts.filter((c) => (c.unpaid_count ?? 0) > 0)
    : contexts

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('flowday_target_kes', customTarget)
    setIsEditingTarget(false)
  }

  const handleExportCSV = async () => {
    try {
      const allAssignments = await fetchAllAssignments()
      let csv = "ID,Context,Context Type,Type,Course,Word Count,Deadline,Payment KES,Status,Notes\n"
      allAssignments.forEach((a) => {
        const cName = a.context_name ?? a.client_name ?? ''
        const cType = a.context_type ?? 'Client'
        csv += `"${a.id}","${cName}","${cType}","${a.assignment_type}","${a.course ?? ''}",${a.word_count ?? 0},"${a.deadline}",${a.payment_kes ?? 0},"${a.status}","${(a.notes ?? '').replace(/"/g, '""')}"\n`
      })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flowday_export_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
    } catch (err) {
      console.error(err)
    }
  }

  const addMutation = useMutation({
    mutationFn: createContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contexts'] })
      queryClient.invalidateQueries({ queryKey: ['contextAnalytics'] })
      setIsAdding(false)
      setFormData({ name: '', context_type: 'Client', platform: 'WhatsApp', priority: 'Medium' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contexts'] })
      queryClient.invalidateQueries({ queryKey: ['contextAnalytics'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contexts'] })
      queryClient.invalidateQueries({ queryKey: ['contextAnalytics'] })
    },
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    addMutation.mutate(formData)
  }

  const handleUpdateSubmit = (e: React.FormEvent, context: Context) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    updateMutation.mutate({ id: context.id, payload: formData })
  }

  const startEditing = (context: Context) => {
    setFormData({
      name: context.name,
      context_type: context.context_type || 'Client',
      platform: context.platform,
      priority: context.priority,
    })
    setEditingId(context.id)
  }

  return (
    <div className="pb-20">
      {/* Financial Analytics Overview */}
      {analytics && (
        <div className="px-6 pt-6 pb-2">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 dark:from-emerald-950 dark:to-slate-900 rounded-2xl p-5 text-white shadow-md mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <DollarSign size={14} /> Revenue & Overview
              </h3>
              {isEditingTarget ? (
                <form onSubmit={handleSaveTarget} className="flex items-center gap-1">
                  <input
                    type="number"
                    autoFocus
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="w-24 text-xs font-semibold px-2 py-0.5 bg-emerald-950 border border-emerald-500 rounded text-emerald-100 focus:outline-none"
                  />
                  <button type="submit" className="p-1 text-emerald-300 hover:text-white">
                    <Check size={14} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="text-[11px] font-semibold bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                  title="Click to edit monthly target goal"
                >
                  <span>Target: KES {targetKES.toLocaleString()}</span>
                  <Edit3 size={11} className="text-emerald-300" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xs p-3 rounded-xl">
                <p className="text-[11px] text-emerald-200 font-medium">Collected</p>
                <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  KES {analytics.total_collected_kes.toLocaleString()}
                </p>
              </div>

              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xs p-3 rounded-xl">
                <p className="text-[11px] text-emerald-200 font-medium">Pending Payout</p>
                <p className="text-lg sm:text-xl font-extrabold text-amber-300 mt-0.5">
                  KES {analytics.pending_payout_kes.toLocaleString()}
                </p>
              </div>

              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xs p-3 rounded-xl">
                <p className="text-[11px] text-emerald-200 font-medium">Avg / 1,000 Words</p>
                <p className="text-lg sm:text-xl font-extrabold text-teal-200 mt-0.5">
                  KES {analytics.avg_rate_per_1000_words.toLocaleString()}
                </p>
              </div>

              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xs p-3 rounded-xl">
                <p className="text-[11px] text-emerald-200 font-medium">Goal Progress</p>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5">
                  {progressPct}%
                </p>
              </div>
            </div>

            {/* Monthly Target Bar */}
            <div className="mt-4 pt-3 border-t border-emerald-800/50">
              <div className="flex justify-between text-xs text-emerald-200 mb-1">
                <span>Monthly Target Progress</span>
                <span className="font-bold">{progressPct}%</span>
              </div>
              <div className="w-full bg-emerald-950/80 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 pt-2 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Work Contexts</h2>
          {/* Unpaid filter tab */}
          <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer',
                activeFilter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('unpaid')}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1',
                activeFilter === 'unpaid'
                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-amber-600'
              )}
            >
              <Banknote size={12} />
              Unpaid
              {totalUnpaidKes > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full">
                  KES {totalUnpaidKes.toLocaleString()}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            title="Export all assignments and earnings to CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>

          {!isAdding && (
            <button
              onClick={() => {
                setFormData({ name: '', context_type: 'Client', platform: 'WhatsApp', priority: 'Medium' })
                setIsAdding(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <PlusCircle size={16} />
              Add Context
            </button>
          )}
        </div>
      </div>

      <div className="px-6 space-y-4">
        {isAdding && (
          <form key="add-context-form" onSubmit={handleAddSubmit} className="p-4 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">New Context</h3>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Context Name (e.g. Acme Corp, CS101, Client Name)"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={formData.context_type}
                  onChange={(e) => setFormData({ ...formData, context_type: e.target.value as ContextType })}
                >
                  <option value="Client">Client</option>
                  <option value="Employer">Employer</option>
                  <option value="Academic">Academic</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  className="px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Telegram">Telegram</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  className="px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || !formData.name.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Saving...' : 'Save Context'}
                </button>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div key="loading-contexts" className="text-center py-10 text-gray-400 dark:text-gray-500">Loading...</div>
        ) : (
          filteredContexts.map((ctx) => (
            <div key={ctx.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
              {editingId === ctx.id ? (
                <form key={`edit-form-${ctx.id}`} onSubmit={(e) => handleUpdateSubmit(e, ctx)} className="p-4">
                  <div className="space-y-3">
                    <input
                      autoFocus
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        className="px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={formData.context_type}
                        onChange={(e) => setFormData({ ...formData, context_type: e.target.value as ContextType })}
                      >
                        <option value="Client">Client</option>
                        <option value="Employer">Employer</option>
                        <option value="Academic">Academic</option>
                        <option value="Personal">Personal</option>
                        <option value="Other">Other</option>
                      </select>

                      <select
                        className="px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="Telegram">Telegram</option>
                        <option value="In-Person">In-Person</option>
                        <option value="Other">Other</option>
                      </select>

                      <select
                        className="px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                      >
                        <X size={18} />
                      </button>
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div key={`view-card-${ctx.id}`} className="p-4">
                  <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => startEditing(ctx)}>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
                        {ctx.name}
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                          {ctx.context_type || 'Client'}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] uppercase font-bold rounded-full",
                          ctx.priority === 'High' ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" :
                          ctx.priority === 'Medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {ctx.priority}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ctx.platform}</p>
                    </div>
                    <div className="flex gap-1">
                      {ctx.active_assignments_count === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Are you sure you want to archive context "${ctx.name}"?`)) {
                              deleteMutation.mutate(ctx.id)
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Archive Context"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setStatementContext(ctx)
                        }}
                        className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Generate Statement"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditing(ctx) }}
                        className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 border-t pt-3 border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Active</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{ctx.active_assignments_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Week</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{ctx.submitted_this_week_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Late</p>
                      <p className={cn("text-lg font-bold", ctx.overdue_assignments_count > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-300 dark:text-gray-600")}>
                        {ctx.overdue_assignments_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Earned</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">KSh {ctx.total_earnings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Unpaid</p>
                      <p className={cn(
                        "text-sm font-bold mt-1",
                        ctx.unpaid_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-300 dark:text-gray-600"
                      )}>
                        {ctx.unpaid_count > 0
                          ? `KSh ${(ctx.unpaid_kes ?? 0).toLocaleString()}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ContextStatementModal
        context={statementContext}
        isOpen={!!statementContext}
        onClose={() => setStatementContext(null)}
      />
    </div>
  )
}

// Deprecated export alias
export const Clients = Contexts
