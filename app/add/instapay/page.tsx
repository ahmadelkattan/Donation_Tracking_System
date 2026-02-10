'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { Toast } from '@/components/Toast'
import { useToastMessage } from '@/hooks/useToastMessage'
import { addInstapayEntries, uploadImage } from '@/lib/api'
import { extractAmountFromImage } from '@/lib/extractAmount'
import { X, Upload } from 'lucide-react'
import Image from 'next/image'

interface ImageItem {
  file: File
  preview: string
  amount: number | null
  manualAmount: string
}

export default function AddInstapayPage() {
  const [username, setUsername] = useState<string | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setExtracting(true)

    const newImages: ImageItem[] = []

    for (const file of files) {
      const preview = URL.createObjectURL(file)
      const amount = await extractAmountFromImage(file)

      newImages.push({
        file,
        preview,
        amount,
        manualAmount: amount ? amount.toString() : '',
      })
    }

    setImages((prev) => [...prev, ...newImages])
    setExtracting(false)
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const updateAmount = (index: number, value: string) => {
    setImages((prev) => {
      const updated = [...prev]
      updated[index].manualAmount = value
      return updated
    })
  }

  const handleSubmit = async () => {
    if (!username) return

    // Validate all amounts
    for (let i = 0; i < images.length; i++) {
      const amount = parseFloat(images[i].manualAmount)
      if (!images[i].manualAmount.trim() || isNaN(amount) || amount <= 0) {
        addToast(`Please enter a valid amount for image ${i + 1}`, 'error')
        return
      }
    }

    setLoading(true)

    try {
      const instapayItems = []

      for (const image of images) {
        // Upload image
        const imageUrl = await uploadImage(image.file, username)
        if (!imageUrl) {
          addToast('Failed to upload one or more images', 'error')
          setLoading(false)
          return
        }

        instapayItems.push({
          amount: parseFloat(image.manualAmount),
          image_url: imageUrl,
        })
      }

      // Add entries
      const success = await addInstapayEntries(username, instapayItems)
      if (!success) {
        addToast('Failed to save entries', 'error')
        setLoading(false)
        return
      }

      addToast('Instapay entries added successfully!', 'success')
      router.push('/add')
    } catch (error) {
      console.error(error)
      addToast('Error processing entries', 'error')
      setLoading(false)
    }
  }

  if (!username) return null

  return (
    <LayoutWrapper username={username} showNav={true}>
      <div className="flex-1 flex flex-col p-4 gap-3">
        <h1 className="text-2xl font-bold">Add Instapay Payment</h1>

        <div className="flex-1 overflow-y-auto">
          {images.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition cursor-pointer bg-muted"
            >
              <div className="text-center">
                <Upload size={40} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {extracting ? 'Processing...' : 'Click to select images'}
                </p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border border-dashed border-border rounded-lg hover:border-primary transition text-sm font-medium"
                disabled={extracting}
              >
                {extracting ? 'Processing...' : 'Add more images'}
              </button>

              <div className="space-y-3">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-3 space-y-3 bg-card"
                  >
                    <div className="flex gap-3">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={image.preview || "/placeholder.svg"}
                          alt={`Payment ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Amount ({index + 1})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={image.manualAmount}
                          onChange={(e) => updateAmount(index, e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {!image.manualAmount && (
                          <p className="text-xs text-muted-foreground mt-1">
                            OCR detection returned null - please enter manually
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="mt-5 p-1 hover:bg-destructive hover:text-white rounded transition"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          onClick={handleSubmit}
          disabled={loading || images.length === 0}
          className="w-full h-10 text-sm font-semibold flex-shrink-0"
        >
          {loading ? 'Uploading...' : `Confirm & Upload (${images.length})`}
        </Button>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </LayoutWrapper>
  )
}
