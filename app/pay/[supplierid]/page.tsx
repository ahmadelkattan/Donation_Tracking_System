'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { getSuppliers, addSupplierPayment, uploadImage } from '@/lib/api'
import { ArrowLeft, X, Upload } from 'lucide-react'
import Image from 'next/image'

interface Supplier {
  id: string
  name: string
}

export default function PaySupplierPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<'instapay' | 'cash'>('instapay')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const params = useParams()
  const supplierId = params.supplierid as string
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
    const fetchSupplier = async () => {
      const suppliers = await getSuppliers()
      const found = suppliers.find((s) => s.id === supplierId)
      setSupplier(found || null)
    }
    fetchSupplier()
  }, [supplierId])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImage(file)
      const preview = URL.createObjectURL(file)
      setImagePreview(preview)
    }
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!username || !supplier) return

    if (!amount.trim()) {
      addToast('Please enter an amount', 'error')
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast('Please enter a valid amount', 'error')
      return
    }

    setLoading(true)

    try {
      let imageUrl: string | undefined = undefined

      if (method === 'instapay' && image) {
        imageUrl = await uploadImage(image, username)
        if (!imageUrl) {
          addToast('Failed to upload image', 'error')
          setLoading(false)
          return
        }
      }

      const success = await addSupplierPayment({
        supplier_id: supplier.id,
        paid_by_username: username,
        method,
        amount: parsedAmount,
        note: note || undefined,
        image_url: imageUrl,
      })

      if (!success) {
        addToast('Failed to save payment', 'error')
        setLoading(false)
        return
      }

      addToast('Payment recorded successfully!', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      addToast('Error processing payment', 'error')
      setLoading(false)
    }
  }

  if (!username || !supplier) return null

  return (
    <LayoutWrapper username={username} showNav={false}>
      <div className="flex-1 flex flex-col p-4 gap-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline w-fit"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-2xl font-bold">Pay Supplier: {supplier.name}</h1>

        {/* Method Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">Payment Method</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMethod('instapay')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${
                method === 'instapay'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border hover:border-primary'
              }`}
            >
              Instapay
            </button>
            <button
              onClick={() => setMethod('cash')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${
                method === 'cash'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border hover:border-primary'
              }`}
            >
              Cash
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Instapay Image Upload */}
        {method === 'instapay' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Screenshot (optional)
            </label>
            {imagePreview ? (
              <div className="relative w-full">
                <Image
                  src={imagePreview || "/placeholder.svg"}
                  alt="Payment screenshot"
                  width={400}
                  height={300}
                  className="w-full rounded-lg border border-border"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-border rounded-lg hover:border-primary transition flex flex-col items-center justify-center gap-2 bg-muted cursor-pointer"
              >
                <Upload size={32} className="text-muted-foreground" />
                <span className="text-sm font-medium">Click to upload screenshot</span>
              </button>
            )}
          </div>
        )}

        {/* Cash Note */}
        {method === 'cash' && (
          <div>
            <label className="block text-sm font-medium mb-2">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>
        )}

        {method === 'instapay' && (
          <div>
            <label className="block text-sm font-medium mb-2">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={2}
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || !amount}
          className="w-full h-12 text-base font-semibold mt-auto"
        >
          {loading ? 'Processing...' : 'Record Payment'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
