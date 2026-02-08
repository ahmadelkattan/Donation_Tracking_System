'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { getSupplierByName, getMealOrdersForSupplier } from '@/lib/api'
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
        const supplierData = await getSupplierByName(username)
        if (!supplierData) {
          addToast('Supplier not found', 'error')
          router.push('/login')
          return
        }

        setSupplier(supplierData)

        // For now, create mock balance data
        // In a real implementation, you'd fetch from v_supplier_balance
        setBalance({
          supplier_id: supplierData.id,
          name: supplierData.name,
          owed_total: 0,
          paid_total: 0,
          remaining_to_pay: 0,
        })
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

  if (!username || !supplier || !balance) return null

  return (
    <LayoutWrapper username={username} showNav={false}>
      <div className="flex-1 flex flex-col p-4 gap-8">
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground">Supplier Dashboard</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 flex-1">
            {/* Financial Stats */}
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-muted-foreground text-sm mb-1">Total Owed</div>
                <div className="text-4xl font-bold">${balance.owed_total.toFixed(2)}</div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-muted-foreground text-sm mb-1">Total Received</div>
                <div className="text-4xl font-bold">${balance.paid_total.toFixed(2)}</div>
              </div>

              <div className="bg-primary text-primary-foreground rounded-lg p-6">
                <div className="text-sm mb-1 opacity-90">Remaining Balance</div>
                <div className="text-4xl font-bold">${balance.remaining_to_pay.toFixed(2)}</div>
              </div>
            </div>

            {/* Schedule Button */}
            <Link href="/schedule" className="block">
              <Button className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2">
                <Calendar size={20} />
                View Schedule
              </Button>
            </Link>
          </div>
        )}

        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 mt-auto"
        >
          <LogOut size={20} />
          Logout
        </Button>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
