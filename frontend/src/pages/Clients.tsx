import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2, Edit3, X, Check } from 'lucide-react'
import { fetchClients, createClient, updateClient, deleteClient } from '@/api/clients'
import type { Client, Priority } from '@/types'
import { cn } from '@/lib/utils'

export function Clients() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', platform: 'WhatsApp', priority: 'Medium' as Priority })

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  })

  const addMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setIsAdding(false)
      setFormData({ name: '', platform: 'WhatsApp', priority: 'Medium' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    addMutation.mutate(formData)
  }

  const handleUpdateSubmit = (e: React.FormEvent, client: Client) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    updateMutation.mutate({ id: client.id, payload: formData })
  }

  const startEditing = (client: Client) => {
    setFormData({ name: client.name, platform: client.platform, priority: client.priority })
    setEditingId(client.id)
  }

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h2 className="text-xl font-bold text-gray-900">Clients</h2>
        {!isAdding && (
          <button
            onClick={() => {
              setFormData({ name: '', platform: 'WhatsApp', priority: 'Medium' })
              setIsAdding(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <PlusCircle size={16} />
            Add Client
          </button>
        )}
      </div>

      <div className="px-6 space-y-4">
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="p-4 bg-white border border-emerald-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">New Client</h3>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Client Name"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="flex gap-3">
                <select
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Email">Email</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || !formData.name.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:border-emerald-200 transition-colors">
              {editingId === client.id ? (
                <form onSubmit={(e) => handleUpdateSubmit(e, client)} className="p-4">
                  <div className="space-y-3">
                    <input
                      autoFocus
                      type="text"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="flex gap-3">
                      <select
                        className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Telegram">Telegram</option>
                        <option value="Email">Email</option>
                        <option value="Other">Other</option>
                      </select>
                      <select
                        className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <X size={18} />
                      </button>
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => startEditing(client)}>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        {client.name}
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] uppercase font-bold rounded-full",
                          client.priority === 'High' ? "bg-rose-100 text-rose-700" :
                          client.priority === 'Medium' ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {client.priority}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{client.platform}</p>
                    </div>
                    <div className="flex gap-1">
                      {client.active_assignments_count === 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(client.id) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Archive Client"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditing(client) }}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-t pt-3 border-gray-100">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Active</p>
                      <p className="text-lg font-bold text-emerald-600">{client.active_assignments_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Week</p>
                      <p className="text-lg font-bold text-blue-600">{client.submitted_this_week_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Late</p>
                      <p className={cn("text-lg font-bold", client.overdue_assignments_count > 0 ? "text-rose-600" : "text-gray-300")}>
                        {client.overdue_assignments_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Earned</p>
                      <p className="text-sm font-bold text-gray-700 mt-1">KSh {client.total_earnings}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
