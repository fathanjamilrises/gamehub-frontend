'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MyOrdersPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/orders')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}
