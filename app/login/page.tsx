'use client'

import { checkUserExists } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToastMessage()

  const handleLogin = async () => {
    if (!username.trim()) {
      addToast('Please enter a username', 'error')
      return
    }

    setLoading(true)

    try {
      const exists = await checkUserExists(username)
      if (!exists) {
        addToast('User not found. Create a new account.', 'error')
        setLoading(false)
        return
      }

      localStorage.setItem('username', username)

      // Route based on username
      if (username === 'Admin') {
        router.push('/admin')
      } else if (username === 'elsheikh' || username === '3askary') {
        router.push('/supplier')
      } else {
        router.push('/add')
      }
    } catch (error) {
      console.error(error)
      addToast('Error logging in', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">InstaPay</h1>
          <p className="text-muted-foreground">Donation Tracking System</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your username"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">or</span>
            </div>
          </div>

          <Link href="/create-user">
            <Button variant="outline" className="w-full h-12 text-lg font-semibold bg-transparent">
              Create New User
            </Button>
          </Link>
        </div>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
