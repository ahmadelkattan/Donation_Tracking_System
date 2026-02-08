'use client'

import { useEffect, useState } from 'react'
import {
  getOverall,
  getSupplierBalances,
  getUserFinancials,
  getSuppliers,
  type OverallStats,
  type SupplierBalance,
  type UserFinancials,
  type Supplier,
} from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function OverviewTab() {
  const [overall, setOverall] = useState<OverallStats | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierBalance[]>([])
  const [users, setUsers] = useState<UserFinancials[]>([])
  const [supplierData, setSupplierData] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [overallData, suppliersData, usersData, suppliersListData] = await Promise.all([
          getOverall(),
          getSupplierBalances(),
          getUserFinancials(),
          getSuppliers(),
        ])

        setOverall(overallData)
        setSuppliers(suppliersData)
        setUsers(usersData)
        setSupplierData(suppliersListData)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={40} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const avgSupplierPrice =
    supplierData.length > 0
      ? supplierData
          .filter((s) => s.meal_unit_price > 0)
          .reduce((sum, s) => sum + s.meal_unit_price, 0) /
        supplierData.filter((s) => s.meal_unit_price > 0).length
      : 0

  const mealsAffordable = overall ? Math.floor(overall.remaining_balance / avgSupplierPrice) : 0

  return (
    <div className="space-y-6 pb-4">
      {/* Overall Summary */}
      {overall && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Total Collected</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Instapay</span>
              <span className="font-semibold text-lg">${overall.instapay_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cash</span>
              <span className="font-semibold text-lg">${overall.cash_total.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-xl">${overall.total_collected.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Remaining Balance */}
      {overall && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Remaining Balance</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-bold text-2xl text-primary">
                ${overall.remaining_balance.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              ≈ {mealsAffordable} meals at avg price ${avgSupplierPrice.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Suppliers */}
      {suppliers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Suppliers</h2>
          <div className="space-y-2">
            {suppliers.map((supplier) => (
              <div
                key={supplier.supplier_id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{supplier.name}</span>
                  <span className="text-lg font-bold">
                    ${supplier.remaining_to_pay.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Owed:</span>
                    <span>${supplier.owed_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>${supplier.paid_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {users.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">User Balances</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.username}
                className="bg-card border border-border rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{user.username}</span>
                  <span
                    className={user.user_balance >= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    ${user.user_balance.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Instapay:</span>
                    <span>${user.instapay_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash:</span>
                    <span>${user.cash_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid to suppliers:</span>
                    <span>${user.total_paid_to_suppliers.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
