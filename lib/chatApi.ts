import { authFetch } from './authApi';

const getBaseUrl = (path = '') => {
  const base = typeof window === 'undefined'
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/chat`
    : '/api-proxy/chat';
  return `${base}${path}`;
};

export interface ChatRoom {
  id: number;
  id_listing: number;
  id_pembeli: number;
  id_penjual: number;
  status: string;
  listing?: {
    id: number;
    nama_post: string;
    harga: number;
    accountGame?: {
      nama_game: string;
      gambar_game: string;
    };
    reseller?: {
      nama_lengkap?: string;
      username?: string;
      name?: string;
      avatar?: string;
    };
    user?: {
      nama_lengkap?: string;
      username?: string;
      name?: string;
      avatar?: string;
    };
  };
  pembeli?: { id: number; name: string; username?: string; avatar?: string };
  penjual?: {
    id: number;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
    store_name?: string;
    reseller?: {
      id: number;
      nama_lengkap?: string;
      no_hp?: string;
      status?: string;
    };
  };
  last_message?: ChatMessage;
  unread_count?: number;
  createdAt?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  tipe: 'text' | 'image' | 'offer' | 'system';
  isi_pesan?: string;
  url_gambar?: string;
  harga_penawaran?: number;
  status_penawaran?: 'pending' | 'accepted' | 'rejected' | 'countered';
  is_read: boolean;
  createdAt?: string;
  created_at?: string;
  sender?: { id: number; name: string; avatar?: string };
}

export const chatApi = {
  // Unread count
  getUnreadCount: async (): Promise<number> => {
    const res = await authFetch(getBaseUrl('/unread'), { method: 'GET' });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.data?.unread_count || data.unread_count || 0;
  },

  // Open/get room for a listing
  openRoom: async (idListing: number): Promise<ChatRoom> => {
    const res = await authFetch(getBaseUrl('/rooms'), {
      method: 'POST',
      body: JSON.stringify({ id_listing: idListing }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal membuka room chat');
    }
    const data = await res.json();
    return data.data || data;
  },

  // Get all rooms
  getRooms: async (role?: string): Promise<ChatRoom[]> => {
    const query = role ? `?role=${role}` : '';
    const res = await authFetch(getBaseUrl(`/rooms${query}`), { method: 'GET' });
    if (!res.ok) throw new Error('Gagal mengambil daftar chat');
    const data = await res.json();
    return data.data?.rooms || data.data || data.rooms || [];
  },

  // Get room detail
  getRoomDetail: async (roomId: number): Promise<ChatRoom> => {
    const res = await authFetch(getBaseUrl(`/rooms/${roomId}`), { method: 'GET' });
    if (!res.ok) throw new Error('Gagal mengambil detail room');
    const data = await res.json();
    return data.data || data;
  },

  // Get messages
  getMessages: async (roomId: number, page = 1, limit = 50): Promise<{ messages: ChatMessage[]; pagination?: any }> => {
    const res = await authFetch(getBaseUrl(`/rooms/${roomId}/messages?page=${page}&limit=${limit}`), { method: 'GET' });
    if (!res.ok) throw new Error('Gagal mengambil pesan');
    const data = await res.json();
    return {
      messages: data.data?.messages || data.messages || data.data || [],
      pagination: data.data?.pagination || data.pagination,
    };
  },

  // Send text message
  sendMessage: async (roomId: number, isiPesan: string): Promise<ChatMessage> => {
    const res = await authFetch(getBaseUrl(`/rooms/${roomId}/messages`), {
      method: 'POST',
      body: JSON.stringify({ isi_pesan: isiPesan }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mengirim pesan');
    }
    const data = await res.json();
    return data.data || data;
  },

  // Send offer
  sendOffer: async (roomId: number, hargaPenawaran: number): Promise<ChatMessage> => {
    const res = await authFetch(getBaseUrl(`/rooms/${roomId}/offers`), {
      method: 'POST',
      body: JSON.stringify({ harga_penawaran: hargaPenawaran }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mengirim penawaran');
    }
    const data = await res.json();
    return data.data || data;
  },

  // Respond to offer
  respondOffer: async (roomId: number, messageId: number, action: string, counterHarga?: number): Promise<any> => {
    const body: any = { action };
    if (counterHarga) body.counter_harga = counterHarga;
    const res = await authFetch(getBaseUrl(`/rooms/${roomId}/offers/${messageId}`), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal merespon penawaran');
    }
    return await res.json();
  },

  // Mark as read
  markRead: async (roomId: number): Promise<void> => {
    await authFetch(getBaseUrl(`/rooms/${roomId}/read`), { method: 'PUT' });
  },

  // Upload image
  sendImage: async (roomId: number, file: File): Promise<ChatMessage> => {
    const formData = new FormData();
    formData.append('gambar', file);
    const token = (await import('./authApi')).getToken();
    const res = await fetch(getBaseUrl(`/rooms/${roomId}/images`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal mengirim gambar');
    }
    const data = await res.json();
    return data.data || data;
  },
};
