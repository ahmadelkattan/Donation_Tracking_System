'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { getInstapayEntries, getCashEntries, getPaymentsMadeByUser, type UserPaymentLog } from '@/lib/api'
import { LogOut, X, Loader2, ChevronDown } from 'lucide-react'
import Image from 'next/image'

interface InstapayEntry {
  id: string
  amount: number
  image_url: string
  created_at: string
}

interface CashEntry {
  id: string
  amount: number
  note: string | null
  created_at: string
}

export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [instapayEntries, setInstapayEntries] = useState<InstapayEntry[]>([])
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([])
  const [payments, setPayments] = useState<UserPaymentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [expandedInstapay, setExpandedInstapay] = useState(false)
  const [expandedCash, setExpandedCash] = useState(false)
  const [expandedPayments, setExpandedPayments] = useState(false)
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
        const [instapay, cash, payLog] = await Promise.all([
          getInstapayEntries(username),
          getCashEntries(username),
          getPaymentsMadeByUser(username),
        ])
        setInstapayEntries(instapay)
        setCashEntries(cash)
        setPayments(payLog)
      } catch (error) {
        console.error(error)
        addToast('Error loading profile', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username, addToast])

  const handleLogout = () => {
    localStorage.removeItem('username')
    router.push('/login')
  }

  if (!username) return null

  return (
    <LayoutWrapper username={username} showNav={true}>
      <div className="flex-1 flex flex-col p-4 gap-8 overflow-y-auto bg-background">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{username}</h1>
          <p className="text-muted-foreground">Your account details</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Instapay Gallery */}
            {instapayEntries.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setExpandedInstapay(!expandedInstapay)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted/70 hover:border-primary hover:shadow-md transition-all group"
                >
                  <ChevronDown
                    size={24}
                    className={`transition-transform duration-200 text-primary ${expandedInstapay ? 'rotate-180' : ''}`}
                  />
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">Instapay Payments</h2>
                  <span className="ml-auto text-sm text-muted-foreground bg-muted rounded-full px-3 py-1 group-hover:bg-primary/10 transition-colors">
                    {instapayEntries.length}
                  </span>
                </button>
                {expandedInstapay && (
                  <div className="grid grid-cols-3 gap-2">
                    {instapayEntries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedImage(entry.image_url)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-border hover:border-primary transition"
                      >
                        <Image
                          src={entry.image_url || "/placeholder.svg"}
                          alt="Payment"
                          fill
                          className="object-cover hover:scale-110 transition"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition flex items-center justify-center">
                          <span className="text-white font-semibold text-sm opacity-0 hover:opacity-100 transition">
                            ${entry.amount.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cash Entries */}
            {cashEntries.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setExpandedCash(!expandedCash)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted/70 hover:border-primary hover:shadow-md transition-all group"
                >
                  <ChevronDown
                    size={24}
                    className={`transition-transform duration-200 text-primary ${expandedCash ? 'rotate-180' : ''}`}
                  />
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">Cash Donations</h2>
                  <span className="ml-auto text-sm text-muted-foreground bg-muted rounded-full px-3 py-1 group-hover:bg-primary/10 transition-colors">
                    {cashEntries.length}
                  </span>
                </button>
                {expandedCash && (
                  <div className="space-y-2">
                    {cashEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-card border border-border rounded-xl p-4 space-y-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">${entry.amount.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground">{entry.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payments made by this user */}
            {payments.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setExpandedPayments(!expandedPayments)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted/70 hover:border-primary hover:shadow-md transition-all group"
                >
                  <ChevronDown
                    size={24}
                    className={`transition-transform duration-200 text-primary ${expandedPayments ? 'rotate-180' : ''}`}
                  />
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">Payments</h2>
                  <span className="ml-auto text-sm text-muted-foreground bg-muted rounded-full px-3 py-1 group-hover:bg-primary/10 transition-colors">
                    {payments.length}
                  </span>
                </button>
                {expandedPayments && (
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="bg-card border border-border rounded-xl p-4 space-y-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">${Number(p.amount).toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{p.method}</span>
                          {' • '}
                          <span>
                            to <span className="font-medium text-foreground">{p.supplier_name}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {instapayEntries.length === 0 && cashEntries.length === 0 && payments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No activity yet</p>
              </div>
            )}
          </>
        )}

        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 rounded-xl mt-4"
        >
          <LogOut size={20} />
          Logout
        </Button>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-100"
            >
              <X size={20} className="text-black" />
            </button>
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt="Full size"
              width={500}
              height={500}
              className="w-full rounded"
            />
          </div>
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
