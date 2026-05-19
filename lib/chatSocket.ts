import { io, Socket } from 'socket.io-client';
import { getToken } from './authApi';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function connectChatSocket(): Socket {
  if (socket?.connected) return socket;

  const token = getToken();
  if (!token) throw new Error('Token tidak tersedia');

  socket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[ChatSocket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[ChatSocket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[ChatSocket] Disconnected:', reason);
  });

  socket.on('error', (data) => {
    console.error('[ChatSocket] Error:', data);
  });

  return socket;
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Helper emit functions
export function joinRoom(roomId: number) {
  socket?.emit('join_room', { room_id: roomId });
}

export function leaveRoom(roomId: number) {
  socket?.emit('leave_room', { room_id: roomId });
}

export function emitSendMessage(roomId: number, isiPesan: string) {
  socket?.emit('send_message', { room_id: roomId, isi_pesan: isiPesan });
}

export function emitSendOffer(roomId: number, hargaPenawaran: number) {
  socket?.emit('send_offer', { room_id: roomId, harga_penawaran: hargaPenawaran });
}

export function emitRespondOffer(roomId: number, messageId: number, action: string, counterHarga?: number) {
  socket?.emit('respond_offer', { room_id: roomId, message_id: messageId, action, counter_harga: counterHarga });
}

export function emitTyping(roomId: number) {
  socket?.emit('typing', { room_id: roomId });
}

export function emitStopTyping(roomId: number) {
  socket?.emit('stop_typing', { room_id: roomId });
}

export function emitMarkRead(roomId: number) {
  socket?.emit('mark_read', { room_id: roomId });
}
