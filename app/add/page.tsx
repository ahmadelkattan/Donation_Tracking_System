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
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Add Money</h1>
          <p className="text-muted-foreground">Choose how you're donating</p>
        </div>

        <div className="w-full space-y-4 max-w-xs">
          <Link href="/add/instapay" className="block">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2 bg-transparent">
              <CreditCard size={28} />
              <span className="text-base font-semibold">Add Instapay</span>
            </Button>
          </Link>

          <Link href="/add/cash" className="block">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2 bg-transparent">
              <Wallet size={28} />
              <span className="text-base font-semibold">Add Cash</span>
            </Button>
          </Link>
        </div>
      </div>
    </LayoutWrapper>
  )
}
