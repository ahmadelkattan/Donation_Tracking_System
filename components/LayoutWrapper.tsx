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
        <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between p-4 max-w-md mx-auto w-full">
            <Link href="/dashboard" className="p-2 hover:bg-accent rounded-xl transition-colors hover:text-primary">
              <Home size={24} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <h1 className="text-lg font-semibold">{username}</h1>
            </div>
            <Link href="/profile" className="p-2 hover:bg-accent rounded-xl transition-colors hover:text-primary">
              <User size={24} />
            </Link>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full">{children}</main>
    </div>
  )
}
