'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { upsertMealOrder } from '@/lib/api'
import { Save } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  meal_unit_price: number
}

interface MealOrdersTabProps {
  suppliers: Supplier[]
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

interface OrderRow {
  supplier_id: string
  meals_count: string
  unit_price: string
}

export default function MealOrdersTab({ suppliers, onToast }: MealOrdersTabProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  useEffect(() => {
    // Keep orders array aligned with suppliers array
    setOrders((prev) => {
      const prevBySupplier = new Map(prev.map((o) => [o.supplier_id, o]))

      return suppliers.map((s) => {
        const existing = prevBySupplier.get(s.id)
        return (
            existing ?? {
              supplier_id: s.id,
              meals_count: '0',
              unit_price: (s.meal_unit_price ?? 0).toString(),
            }
        )
      })
    })
  }, [suppliers])

  const [orders, setOrders] = useState<OrderRow[]>([])

  const [loading, setLoading] = useState(false)

  const updateOrder = (
      index: number,
      field: 'meals_count' | 'unit_price',
      value: string
  ) => {
    setOrders((prev) => {
      const updated = [...prev]
      const current =
          updated[index] ??
          ({
            supplier_id: suppliers[index]?.id ?? '',
            meals_count: '0',
            unit_price: (suppliers[index]?.meal_unit_price ?? 0).toString(),
          } as OrderRow)

      updated[index] = { ...current, [field]: value }
      return updated
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i]
        const mealsCount = parseInt(order.meals_count) || 0
        const unitPrice = parseFloat(order.unit_price) || 0

        if (mealsCount > 0 || unitPrice > 0) {
          const success = await upsertMealOrder({
            order_date: date,
            supplier_id: order.supplier_id,
            meals_count: mealsCount,
            unit_price_snapshot: unitPrice,
          })

          if (!success) {
            onToast(`Failed to save order for supplier ${i + 1}`, 'error')
            setLoading(false)
            return
          }
        }
      }
      onToast('Meal orders saved successfully!', 'success')
    } catch (error) {
      console.error(error)
      onToast('Error saving meal orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <label className="block text-sm font-medium mb-2">Order Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier, index) => (
          <div key={supplier.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-base">{supplier.name}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Meals Count</label>
                <input
                  type="number"
                  min="0"
                  value={orders[index]?.meals_count ?? '0'}
                  onChange={(e) => updateOrder(index, 'meals_count', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orders[index]?.unit_price ?? supplier.meal_unit_price.toString()}
                  onChange={(e) => updateOrder(index, 'unit_price', e.target.value)}
                  placeholder={supplier.meal_unit_price.toString()}
                  className="w-full px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2"
      >
        <Save size={20} />
        {loading ? 'Saving...' : 'Save Orders'}
      </Button>
    </div>
  )
}
