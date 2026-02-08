'use client'

import { checkUserExists, createUser } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { ArrowLeft } from 'lucide-react'

export default function CreateUserPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToastMessage()

  const handleCreate = async () => {
    if (!username.trim()) {
      addToast('Please enter a username', 'error')
      return
    }

    setLoading(true)

    try {
      const exists = await checkUserExists(username)
      if (exists) {
        addToast('Username already exists', 'error')
        setLoading(false)
        return
      }

      const success = await createUser(username)
      if (!success) {
        addToast('Failed to create user', 'error')
        setLoading(false)
        return
      }

      localStorage.setItem('username', username)

      // Route based on username
      if (username === 'admin') {
        router.push('/admin')
      } else if (username === 'supplier1' || username === 'supplier2') {
        router.push('/supplier')
      } else {
        router.push('/add')
      }
    } catch (error) {
      console.error(error)
      addToast('Error creating user', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <Link href="/login" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft size={20} />
          Back to Login
        </Link>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join the donation tracking system</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Choose your username"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
