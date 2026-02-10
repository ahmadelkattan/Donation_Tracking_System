'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { getMealOrdersForSupplier, getPaymentsForSupplier, type SupplierPaymentLog } from '@/lib/api'
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react'

interface MealOrder {
  order_date: string
  meals_count: number
  supplier_name: string
}

export default function SchedulePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [meals, setMeals] = useState<MealOrder[]>([])
  const [payments, setPayments] = useState<SupplierPaymentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState(false)
  const [expandedPayments, setExpandedPayments] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'user' | 'method'>('all')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
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

    const fetchAll = async () => {
      setLoading(true)
      try {
        const [mealsData, paymentsData] = await Promise.all([
          getMealOrdersForSupplier(username),
          getPaymentsForSupplier(username),
        ])
        setMeals(mealsData)
        setPayments(paymentsData)
      } catch (error) {
        console.error(error)
        addToast('Error loading schedule', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [username, addToast])

  if (!username) return null

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  // Get unique users and methods for filters
  const uniqueUsers = Array.from(new Set(payments.map(p => p.paid_by_username)))
  const uniqueMethods = Array.from(new Set(payments.map(p => p.method)))

  // Filter payments based on selected filters
  const filteredPayments = payments.filter(p => {
    if (filterType === 'user' && selectedUser) {
      return p.paid_by_username === selectedUser
    }
    if (filterType === 'method' && selectedMethod) {
      return p.method === selectedMethod
    }
    return true
  })

  return (
    <LayoutWrapper username={username} showNav={false}>
      <div className="flex-1 flex flex-col p-4 gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline w-fit"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-muted-foreground">{username}</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 flex-1 overflow-y-auto">
            {/* Meal Schedule */}
            <div className="space-y-3">
              <button
                onClick={() => setExpandedMeals(!expandedMeals)}
                className="flex items-center gap-2 w-full hover:text-primary transition-colors"
              >
                <ChevronDown
                  size={24}
                  className={`transition-transform duration-200 ${expandedMeals ? 'rotate-180' : ''}`}
                />
                <h2 className="text-lg font-semibold">Meal Schedule</h2>
              </button>

              {expandedMeals && (
                <>
                  {meals.length > 0 ? (
                    <div className="space-y-2">
                      {meals.map((meal) => (
                        <div key={meal.order_date} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">{fmtDate(meal.order_date)}</p>
                              <p className="font-semibold text-lg">{meal.meals_count} meals</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground bg-card rounded-xl p-4 text-center">
                      <p>No meal orders yet</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Payment Schedule */}
            <div className="space-y-3">
              <button
                onClick={() => setExpandedPayments(!expandedPayments)}
                className="flex items-center gap-2 w-full hover:text-primary transition-colors"
              >
                <ChevronDown
                  size={24}
                  className={`transition-transform duration-200 ${expandedPayments ? 'rotate-180' : ''}`}
                />
                <h2 className="text-lg font-semibold">Payment Schedule</h2>
              </button>

              {expandedPayments && (
                <>
                  {/* Filters */}
                  {payments.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={filterType}
                        onChange={(e) => {
                          setFilterType(e.target.value as 'all' | 'user' | 'method')
                          setSelectedUser(null)
                          setSelectedMethod(null)
                        }}
                        className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">All Payments</option>
                        <option value="user">Filter by User</option>
                        <option value="method">Filter by Method</option>
                      </select>

                      {filterType === 'user' && (
                        <select
                          value={selectedUser || ''}
                          onChange={(e) => setSelectedUser(e.target.value || null)}
                          className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select User</option>
                          {uniqueUsers.map(user => (
                            <option key={user} value={user}>{user}</option>
                          ))}
                        </select>
                      )}

                      {filterType === 'method' && (
                        <select
                          value={selectedMethod || ''}
                          onChange={(e) => setSelectedMethod(e.target.value || null)}
                          className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select Method</option>
                          {uniqueMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Payments List */}
                  {payments.length > 0 ? (
                    <div className="space-y-2">
                      {filteredPayments.length > 0 ? (
                        filteredPayments.map((p) => (
                          <div
                            key={`${p.payment_datetime}-${p.paid_by_username}-${p.amount}-${p.method}`}
                            className="bg-card border border-border rounded-xl p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">{fmtDate(p.payment_date)}</p>
                                <p className="font-semibold text-lg">
                                  ${Number(p.amount).toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Method: <span className="font-medium text-foreground">{p.method}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  From: <span className="font-medium text-foreground">{p.paid_by_username}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground bg-card rounded-xl p-4 text-center">
                          <p>No payments match the selected filter</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground bg-card rounded-xl p-4 text-center">
                      <p>No payments yet</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
