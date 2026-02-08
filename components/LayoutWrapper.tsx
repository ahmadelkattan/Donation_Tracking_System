'use client'

import React from "react"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Home, LogOut, User } from 'lucide-react'

interface LayoutWrapperProps {
  children: React.ReactNode
  showNav?: boolean
  username?: string
  onLogout?: () => void
}

export function LayoutWrapper({
  children,
  showNav = true,
  username,
  onLogout,
}: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {showNav && username && (
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between p-4 max-w-md mx-auto w-full">
            <Link href="/dashboard" className="p-2 hover:bg-accent rounded-lg transition">
              <Home size={24} />
            </Link>
            <h1 className="text-lg font-semibold">{username}</h1>
            <Link href="/profile" className="p-2 hover:bg-accent rounded-lg transition">
              <User size={24} />
            </Link>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full">{children}</main>
    </div>
  )
}
