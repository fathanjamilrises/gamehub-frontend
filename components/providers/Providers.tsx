'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/lib/contexts/ToastContext'
import { CartProvider } from '@/lib/contexts/CartContext'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ToastProvider>
  )
}
