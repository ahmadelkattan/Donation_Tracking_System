'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { getSuppliers } from '@/lib/api'
import { LogOut } from 'lucide-react'
import MealOrdersTab from '@/components/admin/MealOrdersTab'
import AdjustmentsTab from '@/components/admin/AdjustmentsTab'
import OverviewTab from '@/components/admin/OverviewTab'

type TabType = 'orders' | 'adjustments' | 'overview'

export default function AdminPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('orders')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToastMessage()

  useEffect(() => {
    const stored = localStorage.getItem('username')
    if (!stored || stored !== 'Admin') {
      router.push('/login')
    } else {
      setUsername(stored)
    }
  }, [router])

  // useEffect(() => {
  //  const stored = (localStorage.getItem('username') || '').trim().toLowerCase()
  //   if (stored !== 'admin') {
  //     router.push('/login')
  //   } else {
  //     setUsername('admin')
  //   }
  // }, [router])


  useEffect(() => {
    const fetchSuppliers = async () => {
      const data = await getSuppliers()
      setSuppliers(data)
    }
    fetchSuppliers()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('username')
    router.push('/login')
  }

  if (!username) return null

  return (
    <LayoutWrapper username={username} showNav={false}>
      <div className="flex-1 flex flex-col p-4 gap-5 overflow-hidden bg-background">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage orders, adjustments and view overview</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border bg-card rounded-t-lg px-4 -mx-4 mb-2">
          {(['orders', 'adjustments', 'overview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition rounded-t-lg ${
                activeTab === tab
                  ? 'bg-background text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab === 'orders' && 'Meal Orders'}
              {tab === 'adjustments' && 'Adjustments'}
              {tab === 'overview' && 'Overview'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'orders' && (
            <MealOrdersTab suppliers={suppliers} onToast={addToast} />
          )}
          {activeTab === 'adjustments' && (
            <AdjustmentsTab suppliers={suppliers} onToast={addToast} />
          )}
          {activeTab === 'overview' && <OverviewTab />}
        </div>

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
