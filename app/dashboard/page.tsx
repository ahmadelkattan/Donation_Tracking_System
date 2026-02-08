'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
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

export default function DashboardPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [overall, setOverall] = useState<OverallStats | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierBalance[]>([])
  const [users, setUsers] = useState<UserFinancials[]>([])
  const [supplierData, setSupplierData] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    if (!username) return

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
      } catch (error) {
        console.error(error)
        addToast('Error loading dashboard', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username, addToast])

  if (!username) return null

  // Calculate average supplier price
  const avgSupplierPrice =
    supplierData.length > 0
      ? supplierData
          .filter((s) => s.meal_unit_price > 0)
          .reduce((sum, s) => sum + s.meal_unit_price, 0) /
        supplierData.filter((s) => s.meal_unit_price > 0).length
      : 0

  const mealsAffordable = overall ? Math.floor(overall.remaining_balance / avgSupplierPrice) : 0

  return (
    <LayoutWrapper username={username} showNav={true}>
      <div className="flex-1 flex flex-col p-4 gap-8 overflow-y-auto bg-background">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track your donations and payments</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Key Metrics Section */}
            {overall && (
              <div className="grid gap-4">
                {/* Remaining Balance - Highlighted */}
                <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-xl p-6 shadow-md">
                  <div className="text-sm font-medium opacity-90 mb-2">Remaining Balance</div>
                  <div className="text-4xl font-bold mb-3">${overall.remaining_balance.toFixed(2)}</div>
                  <div className="text-sm opacity-80">≈ {mealsAffordable} meals at avg price ${avgSupplierPrice.toFixed(2)}</div>
                </div>

                {/* Total Collected */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="text-sm font-semibold text-muted-foreground mb-4">Total Collected</div>
                  <div className="space-y-3">
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
                      <span className="font-bold text-lg text-primary">
                        ${overall.total_collected.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suppliers Section */}
            {suppliers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Suppliers</h2>
                <div className="grid gap-3">
                  {suppliers.map((supplier) => (
                    <Link
                      key={supplier.supplier_id}
                      href={`/pay/${supplier.supplier_id}`}
                    >
                      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-primary transition-all group">
                        <span className="font-medium group-hover:text-primary transition-colors">{supplier.name}</span>
                        <span className="text-lg font-bold text-primary">
                          ${supplier.remaining_to_pay.toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users Section */}
            {users.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">User Balances</h2>
                <div className="grid gap-3">
                  {users.map((user) => (
                    <div
                      key={user.username}
                      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">{user.username}</span>
                        <span className={`text-lg font-bold ${user.user_balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          ${user.user_balance.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Instapay</div>
                          <div className="font-semibold text-sm">${user.instapay_total.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Cash</div>
                          <div className="font-semibold text-sm">${user.cash_total.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Paid</div>
                          <div className="font-semibold text-sm">${user.total_paid_to_suppliers.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
