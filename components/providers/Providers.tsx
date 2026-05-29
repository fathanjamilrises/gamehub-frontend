'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/lib/contexts/ToastContext'
import { CartProvider } from '@/lib/contexts/CartContext'
import { AuthProvider } from '@/lib/hooks/useAuth'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
