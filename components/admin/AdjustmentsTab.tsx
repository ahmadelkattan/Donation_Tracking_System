'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getUserFinancials, addCashEntries, addInstapayEntries, uploadImage } from '@/lib/api'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

interface Supplier {
  id: string
  name: string
}

interface User {
  username: string
}

interface AdjustmentsTabProps {
  suppliers: Supplier[]
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function AdjustmentsTab({ suppliers, onToast }: AdjustmentsTabProps) {
  const [users, setUsers] = useState<User[]>([])
  const [adjustmentType, setAdjustmentType] = useState<'donation' | 'payment'>('donation')
  const [donationType, setDonationType] = useState<'cash' | 'instapay'>('cash')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUserFinancials()
      setUsers(data.map((u) => ({ username: u.username })))
    }
    fetchUsers()
  }, [])

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
    if (!selectedUser || !amount) {
      onToast('Please fill in all required fields', 'error')
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onToast('Please enter a valid amount', 'error')
      return
    }

    setLoading(true)

    try {
      if (adjustmentType === 'donation') {
        if (donationType === 'cash') {
          const success = await addCashEntries(selectedUser, [
            { amount: parsedAmount, note: note || undefined },
          ])
          if (!success) throw new Error('Failed to add donation')
        } else {
          let imageUrl: string | undefined = undefined
          if (image) {
            imageUrl = await uploadImage(image, selectedUser)
            if (!imageUrl) throw new Error('Failed to upload image')
          }

          const success = await addInstapayEntries(selectedUser, [
            { amount: parsedAmount, image_url: imageUrl || '' },
          ])
          if (!success) throw new Error('Failed to add donation')
        }
      } else {
        // Payment
        if (!selectedSupplier) {
          onToast('Please select a supplier', 'error')
          setLoading(false)
          return
        }

        // For payment adjustments, use addSupplierPayment
        // This would need to be called directly
        onToast('Payment adjustment not fully implemented in this tab', 'info')
      }

      onToast('Adjustment saved successfully!', 'success')
      setAmount('')
      setNote('')
      removeImage()
      setSelectedUser('')
    } catch (error) {
      console.error(error)
      onToast('Error saving adjustment', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Adjustment Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Adjustment Type</label>
        <div className="flex gap-2">
          {(['donation', 'payment'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setAdjustmentType(type)}
              className={`flex-1 py-2 px-3 rounded-lg border-2 transition font-medium text-sm ${
                adjustmentType === type
                  ? 'border-primary bg-primary text-white'
                  : 'border-border hover:border-primary'
              }`}
            >
              {type === 'donation' ? 'Add Donation' : 'Add Payment'}
            </button>
          ))}
        </div>
      </div>

      {/* User Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">User</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a user...</option>
          {users.map((user) => (
            <option key={user.username} value={user.username}>
              {user.username}
            </option>
          ))}
        </select>
      </div>

      {adjustmentType === 'donation' && (
        <>
          {/* Donation Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Donation Type</label>
            <div className="flex gap-2">
              {(['cash', 'instapay'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDonationType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition font-medium text-sm ${
                    donationType === type
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {type === 'cash' ? 'Cash' : 'Instapay'}
                </button>
              ))}
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

          {donationType === 'cash' && (
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

          {donationType === 'instapay' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Screenshot (optional)
              </label>
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Payment"
                    width={200}
                    height={150}
                    className="w-full rounded-lg border border-border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition flex items-center justify-center gap-2 bg-muted cursor-pointer"
                >
                  <Upload size={20} />
                  <span className="text-sm font-medium">Click to upload</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {adjustmentType === 'payment' && (
        <>
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a supplier...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

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
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !selectedUser || !amount}
        className="w-full"
      >
        {loading ? 'Saving...' : 'Save Adjustment'}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
