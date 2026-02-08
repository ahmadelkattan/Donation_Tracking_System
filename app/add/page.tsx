'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { CreditCard, Wallet } from 'lucide-react'

export default function AddPage() {
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('username')
    if (!stored) {
      router.push('/login')
    } else {
      setUsername(stored)
    }
  }, [router])

  if (!username) return null

  return (
    <LayoutWrapper username={username} showNav={true}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8 bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Add Donation</h1>
          <p className="text-muted-foreground">Choose your preferred payment method</p>
        </div>

        <div className="w-full space-y-3 max-w-xs">
          <Link href="/add/instapay" className="block">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:border-primary/40 transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <span className="text-base font-semibold group-hover:text-primary transition-colors">Add via Instapay</span>
            </div>
          </Link>

          <Link href="/add/cash" className="block">
            <div className="bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/20 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:border-secondary/40 transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Wallet size={24} />
              </div>
              <span className="text-base font-semibold group-hover:text-secondary transition-colors">Add Cash Donation</span>
            </div>
          </Link>
        </div>
      </div>
    </LayoutWrapper>
  )
}
