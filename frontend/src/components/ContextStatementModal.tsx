import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Copy, Check, Printer, FileText } from 'lucide-react'
import { fetchAllAssignments } from '@/api/assignments'
import type { Context } from '@/types'
import { format } from 'date-fns'

interface Props {
  context: Context | null
  isOpen: boolean
  onClose: () => void
}

export function ContextStatementModal({ context, isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [filterMode, setFilterMode] = useState<'submitted' | 'all'>('submitted')
  const [paymentDetails, setPaymentDetails] = useState('M-Pesa / Bank Transfer')

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', 'all'],
    queryFn: fetchAllAssignments,
    enabled: isOpen && !!context,
  })

  if (!isOpen || !context) return null

  const contextAssignments = assignments.filter((a) => {
    const belongsToContext = a.context_id === context.id || a.client_id === context.id
    if (!belongsToContext || a.status === 'Cancelled') return false
    if (filterMode === 'submitted') return a.status === 'Submitted'
    return true
  })

  const totalWords = contextAssignments.reduce((sum, a) => sum + (a.word_count ?? 0), 0)
  const totalDueKES = contextAssignments.reduce(
    (sum, a) => sum + (a.payment_kes ? parseFloat(a.payment_kes) : 0),
    0
  )

  const typeLabel = context.context_type || 'Context'

  const generateStatementText = () => {
    let text = `📄 STATEMENT OF ACCOUNT (${typeLabel.toUpperCase()}) — ${context.name.toUpperCase()}\n`
    text += `Date: ${format(new Date(), 'dd MMM yyyy')}\n`
    text += `Scope: ${filterMode === 'submitted' ? 'Completed Assignments' : 'All Assignments'}\n`
    text += `===================================\n\n`

    if (contextAssignments.length === 0) {
      text += `No assignments found matching criteria.\n`
    } else {
      contextAssignments.forEach((a, idx) => {
        text += `${idx + 1}. ${a.assignment_type}${a.course ? ` (${a.course})` : ''}\n`
        text += `   Status: [${a.status}]\n`
        text += `   Word Count: ${(a.word_count ?? 0).toLocaleString()} words\n`
        text += `   Deadline: ${format(new Date(a.deadline), 'dd MMM yyyy')}\n`
        text += `   Amount: KSh ${a.payment_kes ? parseFloat(a.payment_kes).toLocaleString() : 0}\n\n`
      })
    }

    text += `===================================\n`
    text += `TOTAL WORDS: ${totalWords.toLocaleString()} words\n`
    text += `TOTAL AMOUNT DUE: KSh ${totalDueKES.toLocaleString()}\n`
    if (paymentDetails.trim()) {
      text += `PAYMENT METHOD: ${paymentDetails.trim()}\n`
    }
    text += `===================================\n`
    text += `Generated via Flowday`
    return text
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateStatementText())
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
            {typeLabel} Statement — {context.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options Bar */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilterMode('submitted')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterMode === 'submitted'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Completed Only
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              All Tasks ({contextAssignments.length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Payment Details (Till / Bank)..."
            value={paymentDetails}
            onChange={(e) => setPaymentDetails(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex-1 min-w-[180px]"
          />
        </div>

        {/* Statement Preview Box */}
        <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
          {generateStatementText()}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} />
            Print / PDF
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Statement Text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Deprecated export alias
export const ClientStatementModal = ContextStatementModal
