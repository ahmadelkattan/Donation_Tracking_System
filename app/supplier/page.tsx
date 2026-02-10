'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { getSupplierByName, getSupplierBalanceById } from '@/lib/api'
import { Calendar, LogOut, Loader2 } from 'lucide-react'

interface SupplierData {
  id: string
  name: string
}

interface SupplierBalance {
  supplier_id: string
  name: string
  owed_total: number
  paid_total: number
  remaining_to_pay: number
}

export default function SupplierPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [balance, setBalance] = useState<SupplierBalance | null>(null)
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
        // 1) Find supplier row by name == username
        const supplierData = await getSupplierByName(username)
        if (!supplierData) {
          addToast('Supplier not found', 'error')
          router.push('/login')
          return
        }
        setSupplier(supplierData)

        // 2) Fetch balance from view
        const bal = await getSupplierBalanceById(supplierData.id)
        if (!bal) {
          // If the supplier exists but has no records yet, show zeros safely
          setBalance({
            supplier_id: supplierData.id,
            name: supplierData.name,
            owed_total: 0,
            paid_total: 0,
            remaining_to_pay: 0,
          })
        } else {
          setBalance(bal as SupplierBalance)
        }
      } catch (error) {
        console.error(error)
        addToast('Error loading supplier data', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username, addToast, router])

  const handleLogout = () => {
    localStorage.removeItem('username')
    router.push('/login')
  }

  if (!username) return null

  return (
      <LayoutWrapper username={username} showNav={false}>
        <div className="flex-1 flex flex-col p-4 gap-8 bg-background">
          <div className="text-center space-y-2 pt-6">
            <h1 className="text-3xl font-bold">{supplier?.name || username}</h1>
            <p className="text-muted-foreground">Supplier Account Dashboard</p>
          </div>

          {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-primary" />
              </div>
          ) : (
              <div className="space-y-5 flex-1">
                <div className="grid gap-4">
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="text-muted-foreground text-sm font-medium mb-2">Total Owed</div>
                    <div className="text-4xl font-bold text-foreground">
                      ${Number(balance?.owed_total ?? 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="text-muted-foreground text-sm font-medium mb-2">Total Received</div>
                    <div className="text-4xl font-bold text-primary">
                      ${Number(balance?.paid_total ?? 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-xl p-6 shadow-md">
                    <div className="text-sm font-medium mb-2 opacity-90">Remaining Balance</div>
                    <div className="text-4xl font-bold">
                      ${Number(balance?.remaining_to_pay ?? 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <Link href="/schedule" className="block">
                  <Button className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all">
                    <Calendar size={20} />
                    View Schedule
                  </Button>
                </Link>
              </div>
          )}

          <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 rounded-xl"
          >
            <LogOut size={20} />
            Logout
          </Button>
        </div>

        <Toast toasts={toasts} onRemove={removeToast} />
      </LayoutWrapper>
  )
}
