// lib/dummy/orders.ts - Dummy data for orders
export interface Order {
  id: string
  orderCode: string
  date: string
  status: 'completed' | 'pending' | 'processing' | 'cancelled' | 'pending_payment'
  game: {
    name: string
    publisher: string
    image: string
  }
  item: {
    name: string
    amount: number
    price: number
    bonus?: string | null
  }
  playerId: string
  serverId?: string | null
  nickname?: string
  payment: {
    method: string
    total: number
    fee: number
  }
  xenditInvoiceUrl?: string | null
  processedAt?: string | null
}

export const ordersData: Order[] = [
  {
    id: '1',
    orderCode: 'GH-240101-ABC123',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'completed',
    game: {
      name: 'Mobile Legends: Bang Bang',
      publisher: 'Moonton',
      image: 'https://cdn.gamehub.id/games/mobile-legends.jpg',
    },
    item: {
      name: '344 Diamonds',
      amount: 344,
      price: 49000,
      bonus: '+33 Bonus',
    },
    playerId: '123456789',
    serverId: '2001',
    nickname: 'ProPlayer123',
    payment: {
      method: 'QRIS',
      total: 49000,
      fee: 0,
    },
    processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    orderCode: 'GH-240102-DEF456',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'completed',
    game: {
      name: 'Free Fire',
      publisher: 'Garena',
      image: 'https://cdn.gamehub.id/games/free-fire.jpg',
    },
    item: {
      name: '520 Diamonds',
      amount: 520,
      price: 75000,
      bonus: '+52 Bonus',
    },
    playerId: '987654321',
    serverId: null,
    nickname: 'FFMaster',
    payment: {
      method: 'Bank Transfer BCA',
      total: 75000,
      fee: 4000,
    },
    processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    orderCode: 'GH-240103-GHI789',
    date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    status: 'processing',
    game: {
      name: 'PUBG Mobile',
      publisher: 'Tencent',
      image: 'https://cdn.gamehub.id/games/pubg-mobile.jpg',
    },
    item: {
      name: '660 UC',
      amount: 660,
      price: 140000,
      bonus: '+55 Bonus',
    },
    playerId: '555666777',
    serverId: null,
    nickname: 'PUBGPro',
    payment: {
      method: 'QRIS',
      total: 140000,
      fee: 0,
    },
  },
  {
    id: '4',
    orderCode: 'GH-240104-JKL012',
    date: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    status: 'pending_payment',
    game: {
      name: 'Genshin Impact',
      publisher: 'Hoyoverse',
      image: 'https://cdn.gamehub.id/games/genshin-impact.jpg',
    },
    item: {
      name: '980 Genesis Crystal',
      amount: 980,
      price: 195000,
      bonus: '+110 Bonus',
    },
    playerId: '800012345',
    serverId: null,
    nickname: 'GenshinFan',
    payment: {
      method: 'Virtual Account BNI',
      total: 195000,
      fee: 4000,
    },
    xenditInvoiceUrl: 'https://checkout-staging.xendit.co/web/mock-payment',
  },
  {
    id: '5',
    orderCode: 'GH-240105-MNO345',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: 'cancelled',
    game: {
      name: 'Mobile Legends: Bang Bang',
      publisher: 'Moonton',
      image: 'https://cdn.gamehub.id/games/mobile-legends.jpg',
    },
    item: {
      name: '86 Diamonds',
      amount: 86,
      price: 12500,
      bonus: '+8 Bonus',
    },
    playerId: '111222333',
    serverId: '2002',
    nickname: 'MLNoob',
    payment: {
      method: 'QRIS',
      total: 12500,
      fee: 0,
    },
  },
  {
    id: '6',
    orderCode: 'GH-240106-PQR678',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'pending',
    game: {
      name: 'Valorant',
      publisher: 'Riot Games',
      image: 'https://cdn.gamehub.id/games/valorant.jpg',
    },
    item: {
      name: '700 Points',
      amount: 700,
      price: 90000,
    },
    playerId: 'RIOT#1234',
    serverId: null,
    nickname: 'ValorantKing',
    payment: {
      method: 'QRIS',
      total: 90000,
      fee: 0,
    },
    xenditInvoiceUrl: 'https://checkout-staging.xendit.co/web/mock-payment',
  },
]

// Client-side storage for new orders
const STORAGE_KEY = 'gamehub_orders'

function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveOrders(orders: Order[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // Ignore storage errors
  }
}

// Get all orders (dummy + stored)
export function getAllOrders(): Order[] {
  const stored = getStoredOrders()
  return [...ordersData, ...stored].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Get orders by status
export function getOrdersByStatus(status: string): Order[] {
  const allOrders = getAllOrders()
  if (status === 'all') return allOrders
  return allOrders.filter((order) => order.status === status)
}

// Search orders
export function searchOrders(query: string): Order[] {
  const lowerQuery = query.toLowerCase()
  return getAllOrders().filter(
    (order) =>
      order.orderCode.toLowerCase().includes(lowerQuery) ||
      order.game.name.toLowerCase().includes(lowerQuery) ||
      (order.nickname && order.nickname.toLowerCase().includes(lowerQuery))
  )
}

// Add new order
export function addOrder(orderData: Omit<Order, 'id' | 'orderCode' | 'date' | 'status'>): Order {
  const newOrder: Order = {
    ...orderData,
    id: `new-${Date.now()}`,
    orderCode: `GH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    date: new Date().toISOString(),
    status: 'pending_payment',
  }

  const stored = getStoredOrders()
  stored.unshift(newOrder)
  saveOrders(stored)

  return newOrder
}

// Update order status
export function updateOrderStatus(orderCode: string, status: Order['status']): boolean {
  const stored = getStoredOrders()
  const orderIndex = stored.findIndex((o) => o.orderCode === orderCode)

  if (orderIndex >= 0) {
    stored[orderIndex].status = status
    if (status === 'completed') {
      stored[orderIndex].processedAt = new Date().toISOString()
    }
    saveOrders(stored)
    return true
  }

  // Check dummy data (in memory only)
  const dummyIndex = ordersData.findIndex((o) => o.orderCode === orderCode)
  if (dummyIndex >= 0) {
    ordersData[dummyIndex].status = status
    if (status === 'completed') {
      ordersData[dummyIndex].processedAt = new Date().toISOString()
    }
    return true
  }

  return false
}

// Check payment status (mock)
export function checkPaymentStatus(orderCode: string): { paid: boolean; status: string } {
  const allOrders = getAllOrders()
  const order = allOrders.find((o) => o.orderCode === orderCode)

  if (!order) return { paid: false, status: 'NOT_FOUND' }

  // Simulate payment check - in real app this would call payment gateway
  if (order.status === 'pending_payment') {
    // 50% chance of being paid for demo purposes
    const isPaid = Math.random() > 0.5
    if (isPaid) {
      updateOrderStatus(orderCode, 'processing')
      return { paid: true, status: 'PAID' }
    }
    return { paid: false, status: 'PENDING' }
  }

  return {
    paid: order.status === 'completed' || order.status === 'processing',
    status: order.status.toUpperCase(),
  }
}
