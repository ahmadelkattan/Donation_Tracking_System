'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { getMealOrdersForSupplier } from '@/lib/api'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface MealOrder {
  order_date: string
  meals_count: number
  supplier_name: string
}

export default function SchedulePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [meals, setMeals] = useState<MealOrder[]>([])
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

    const fetchMeals = async () => {
      setLoading(true)
      try {
        const data = await getMealOrdersForSupplier(username)
        setMeals(data)
      } catch (error) {
        console.error(error)
        addToast('Error loading schedule', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchMeals()
  }, [username, addToast])

  if (!username) return null

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
          <h1 className="text-2xl font-bold">Meal Schedule</h1>
          <p className="text-muted-foreground">{username}</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-muted-foreground" />
          </div>
        ) : meals.length > 0 ? (
          <div className="space-y-2 flex-1">
            {meals.map((meal) => (
              <div key={meal.order_date} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(meal.order_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="font-semibold text-lg">{meal.meals_count} meals</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>No meal orders yet</p>
          </div>
        )}
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
