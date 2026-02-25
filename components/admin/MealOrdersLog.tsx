'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getMealOrdersLog, updateMealOrder, type MealOrdersLogEntry, type Supplier } from '@/lib/api'
import { Loader2, Edit2, Save, X } from 'lucide-react'

interface MealOrdersLogProps {
  suppliers: Supplier[]
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

interface EditingRow {
  id: string
  meals_count: number | string
  unit_price_snapshot: number | string
}

export default function MealOrdersLog({ suppliers, onToast }: MealOrdersLogProps) {
  const [orders, setOrders] = useState<MealOrdersLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<EditingRow | null>(null)
  const [originalData, setOriginalData] = useState<EditingRow | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await getMealOrdersLog({
        supplier_id: selectedSupplier || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setOrders(data)
    } catch (error) {
      console.error('Error fetching meal orders:', error)
      onToast('Failed to load meal orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [selectedSupplier, dateFrom, dateTo])

  const handleEdit = (order: MealOrdersLogEntry) => {
    setEditingId(order.id)
    const editData = {
      id: order.id,
      meals_count: order.meals_count,
      unit_price_snapshot: order.unit_price_snapshot,
    }
    setEditingData(editData)
    setOriginalData(editData)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingData(null)
    setOriginalData(null)
  }

  const handleSave = async () => {
    if (!editingData || !editingId) return

    // Validation
    const mealsCount = parseInt(editingData.meals_count as string)
    const unitPrice = parseFloat(editingData.unit_price_snapshot as string)

    if (isNaN(mealsCount) || mealsCount < 0) {
      onToast('Meals count must be a valid number >= 0', 'error')
      return
    }

    if (isNaN(unitPrice) || unitPrice < 0) {
      onToast('Unit price must be a valid number >= 0', 'error')
      return
    }

    setSaving(true)
    try {
      const success = await updateMealOrder(editingId, {
        meals_count: mealsCount,
        unit_price_snapshot: unitPrice,
      })

      if (success) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === editingId
              ? {
                  ...order,
                  meals_count: mealsCount,
                  unit_price_snapshot: unitPrice,
                }
              : order
          )
        )
        onToast('Meal order updated successfully', 'success')
        handleCancel()
      } else {
        onToast('Failed to update meal order', 'error')
      }
    } catch (error) {
      console.error('Error saving meal order:', error)
      onToast('Error updating meal order', 'error')
    } finally {
      setSaving(false)
    }
  }

  const owedForDay = (mealsCount: number | string, unitPrice: number | string) => {
    const mc = typeof mealsCount === 'string' ? parseInt(mealsCount) : mealsCount
    const up = typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice
    if (isNaN(mc) || isNaN(up)) return 0
    return mc * up
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Supplier</label>
            <select
              value={selectedSupplier || ''}
              onChange={(e) => setSelectedSupplier(e.target.value || null)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-2">No meal orders found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-semibold">Order Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-4 py-3 text-right font-semibold">Meals</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Owed</th>
                  <th className="px-4 py-3 text-left font-semibold">Created At</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="px-4 py-3">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-3">{order.supplier_name}</td>
                    <td className="px-4 py-3 text-right">
                      {editingId === order.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editingData?.meals_count ?? ''}
                          onChange={(e) =>
                            setEditingData((prev) =>
                              prev ? { ...prev, meals_count: e.target.value } : null
                            )
                          }
                          className="w-20 px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        order.meals_count
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId === order.id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingData?.unit_price_snapshot ?? ''}
                          onChange={(e) =>
                            setEditingData((prev) =>
                              prev ? { ...prev, unit_price_snapshot: e.target.value } : null
                            )
                          }
                          className="w-20 px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        `$${order.unit_price_snapshot.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      ${owedForDay(
                        editingId === order.id ? editingData?.meals_count ?? 0 : order.meals_count,
                        editingId === order.id ? editingData?.unit_price_snapshot ?? 0 : order.unit_price_snapshot
                      ).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === order.id ? (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1 h-8 px-2 text-xs"
                          >
                            <Save size={14} />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={saving}
                            className="flex items-center gap-1 h-8 px-2 text-xs"
                          >
                            <X size={14} />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(order)}
                          className="flex items-center gap-1 h-8 px-2 text-xs"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
