import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel — GameHub.ID',
  description: 'Admin dashboard untuk mengelola platform GameHub.ID',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
