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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <div className="text-2xl font-bold text-primary-foreground">💙</div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">InstaPay</h1>
          <p className="text-muted-foreground">Donation Tracking System</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-md space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-3 text-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your username"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <Link href="/create-user" className="block">
            <Button variant="outline" className="w-full h-12 text-base font-semibold rounded-xl hover:bg-accent transition-colors">
              Create New User
            </Button>
          </Link>
        </div>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
