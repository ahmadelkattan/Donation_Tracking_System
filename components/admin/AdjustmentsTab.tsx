'use client'

import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  getUserFinancials,
  addCashEntries,
  addInstapayEntries,
  addSupplierPayment,
  uploadImage,
} from '@/lib/api'
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

  // donation
  const [donationMethod, setDonationMethod] = useState<'cash' | 'instapay'>('cash')

  // payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay'>('cash')

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

  const resetForm = () => {
    setAmount('')
    setNote('')
    setSelectedUser('')
    setSelectedSupplier('')
    removeImage()
    setDonationMethod('cash')
    setPaymentMethod('cash')
    setAdjustmentType('donation')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImage(file)
      const preview = URL.createObjectURL(file)
      setImagePreview(preview)
    }
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const requireValidAmount = (): number | null => {
    if (!amount.trim()) return null
    const parsedAmount = parseFloat(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null
    return parsedAmount
  }

  const handleSubmit = async () => {
    if (!selectedUser) {
      onToast('Please select a user', 'error')
      return
    }

    const parsedAmount = requireValidAmount()
    if (parsedAmount === null) {
      onToast('Please enter a valid amount', 'error')
      return
    }

    setLoading(true)

    try {
      // ------------------------
      // DONATION (adds money to the user's balance)
      // ------------------------
      if (adjustmentType === 'donation') {
        if (donationMethod === 'cash') {
          const success = await addCashEntries(selectedUser, [
            { amount: parsedAmount, note: note || undefined },
          ])
          if (!success) throw new Error('Failed to add cash donation')
        } else {
          // instapay donation
          let imageUrl = ''
          if (image) {
            const uploaded = await uploadImage(image, selectedUser)
            if (!uploaded) throw new Error('Failed to upload image')
            imageUrl = uploaded
          }

          const success = await addInstapayEntries(selectedUser, [
            { amount: parsedAmount, image_url: imageUrl },
          ])
          if (!success) throw new Error('Failed to add instapay donation')
        }

        onToast('Donation saved successfully!', 'success')
        resetForm()
        return
      }

      // ------------------------
      // PAYMENT (reduces user's balance; goes into supplier_payments)
      // ------------------------
      if (!selectedSupplier) {
        onToast('Please select a supplier', 'error')
        setLoading(false)
        return
      }

      let paymentImageUrl: string | undefined = undefined
      if (paymentMethod === 'instapay' && image) {
        const uploaded = await uploadImage(image, selectedUser)
        if (!uploaded) throw new Error('Failed to upload image')
        paymentImageUrl = uploaded
      }

      const success = await addSupplierPayment({
        supplier_id: selectedSupplier,
        paid_by_username: selectedUser,
        method: paymentMethod,
        amount: parsedAmount,
        note: paymentMethod === 'cash' ? (note || undefined) : undefined,
        image_url: paymentMethod === 'instapay' ? paymentImageUrl : undefined,
      })

      if (!success) throw new Error('Failed to add supplier payment')

      onToast('Payment saved successfully!', 'success')
      resetForm()
    } catch (error) {
      console.error(error)
      onToast('Error saving adjustment', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showImageSection =
      (adjustmentType === 'donation' && donationMethod === 'instapay') ||
      (adjustmentType === 'payment' && paymentMethod === 'instapay')

  const showNoteSection =
      (adjustmentType === 'donation' && donationMethod === 'cash') ||
      (adjustmentType === 'payment' && paymentMethod === 'cash')

  return (
      <div className="space-y-4 pb-4">
        {/* Adjustment Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Adjustment Type</label>
          <div className="flex gap-2">
            {(['donation', 'payment'] as const).map((type) => (
                <button
                    key={type}
                    onClick={() => {
                      setAdjustmentType(type)
                      // clean method-specific fields when switching
                      setNote('')
                      removeImage()
                      if (type === 'donation') setDonationMethod('cash')
                      if (type === 'payment') setPaymentMethod('cash')
                    }}
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

        {/* Donation Method OR Payment Method */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {adjustmentType === 'donation' ? 'Donation Method' : 'Payment Method'}
          </label>
          <div className="flex gap-2">
            {(['cash', 'instapay'] as const).map((m) => {
              const active = adjustmentType === 'donation' ? donationMethod === m : paymentMethod === m
              return (
                  <button
                      key={m}
                      onClick={() => {
                        if (adjustmentType === 'donation') setDonationMethod(m)
                        else setPaymentMethod(m)
                        // switching method resets optional fields
                        setNote('')
                        removeImage()
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 transition font-medium text-sm ${
                          active ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary'
                      }`}
                  >
                    {m === 'cash' ? 'Cash' : 'Instapay'}
                  </button>
              )
            })}
          </div>
        </div>

        {/* Supplier Selection only for payment */}
        {adjustmentType === 'payment' && (
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
        )}

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

        {/* Note for cash (donation or payment) */}
        {showNoteSection && (
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

        {/* Screenshot for instapay (donation or payment) */}
        {showImageSection && (
            <div>
              <label className="block text-sm font-medium mb-2">Screenshot (optional)</label>
              {imagePreview ? (
                  <div className="relative">
                    <Image
                        src={imagePreview || '/placeholder.svg'}
                        alt="Payment"
                        width={200}
                        height={150}
                        className="w-full rounded-lg border border-border"
                    />
                    <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
              ) : (
                  <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition flex items-center justify-center gap-2 bg-muted cursor-pointer"
                      type="button"
                  >
                    <Upload size={20} />
                    <span className="text-sm font-medium">Click to upload</span>
                  </button>
              )}
            </div>
        )}

        <Button
            onClick={handleSubmit}
            disabled={loading || !selectedUser || !amount || (adjustmentType === 'payment' && !selectedSupplier)}
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
