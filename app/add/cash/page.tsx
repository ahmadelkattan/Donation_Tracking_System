'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { addCashEntries } from '@/lib/api'
import { X, Plus } from 'lucide-react'

interface CashRow {
  id: string
  amount: string
  note: string
}

export default function AddCashPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [rows, setRows] = useState<CashRow[]>([{ id: '1', amount: '', note: '' }])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToastMessage()

  useEffect(() => {
    const stored = localStorage.getItem('username')
    if (!stored) {
      router.push('/login')
    } else {
      setUsername(stored)
    }
  }, [router])

  const addRow = () => {
    setRows((prev) => [...prev, { id: Date.now().toString(), amount: '', note: '' }])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((r) => r.id !== id))
    }
  }

  const updateRow = (id: string, field: 'amount' | 'note', value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleSubmit = async () => {
    if (!username) return

    // Validate all amounts
    for (let i = 0; i < rows.length; i++) {
      const amount = parseFloat(rows[i].amount)
      if (!rows[i].amount.trim() || isNaN(amount) || amount <= 0) {
        addToast(`Please enter a valid amount for row ${i + 1}`, 'error')
        return
      }
    }

    setLoading(true)

    try {
      const entries = rows.map((r) => ({
        amount: parseFloat(r.amount),
        note: r.note || undefined,
      }))

      const success = await addCashEntries(username, entries)
      if (!success) {
        addToast('Failed to save entries', 'error')
        setLoading(false)
        return
      }

      addToast('Cash entries added successfully!', 'success')
      router.push('/add')
    } catch (error) {
      console.error(error)
      addToast('Error processing entries', 'error')
      setLoading(false)
    }
  }

  if (!username) return null

  return (
    <LayoutWrapper username={username} showNav={true}>
      <div className="flex-1 flex flex-col p-4 gap-4">
        <h1 className="text-2xl font-bold">Add Cash Payment</h1>

        <div className="flex-1 overflow-y-auto space-y-3">
          {rows.map((row, index) => (
            <div key={row.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
              <label className="block text-sm font-medium">Amount {index + 1}</label>
              <input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <label className="block text-sm font-medium">Note (optional)</label>
              <textarea
                value={row.note}
                onChange={(e) => updateRow(row.id, 'note', e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />

              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(row.id)}
                  className="text-sm text-destructive hover:bg-destructive hover:text-white px-2 py-1 rounded transition flex items-center gap-1"
                >
                  <X size={16} />
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={addRow}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-transparent"
        >
          <Plus size={20} />
          Add Another Row
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 text-base font-semibold"
        >
          {loading ? 'Saving...' : `Submit (${rows.length})`}
        </Button>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
