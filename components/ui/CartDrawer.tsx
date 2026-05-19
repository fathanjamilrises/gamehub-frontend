'use client'

import { useCart } from '@/lib/contexts/CartContext'
import Link from 'next/link'
import { useState } from 'react'
import { orderAkunApi } from '@/lib/orderAkunApi'
import { useToast } from '@/lib/contexts/ToastContext'

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, isLoading, removeFromCart, updateCartItem, clearCart, cleanCart } = useCart()
  const { toast } = useToast()
  const [processingId, setProcessingId] = useState<number | null>(null)

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white border-l-4 border-gray-900 z-[9999] shadow-[-8px_0px_0px_rgba(17,24,39,1)] flex flex-col transform transition-all duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b-2 border-gray-900 flex justify-between items-center bg-yellow-400">
          <h2 className="text-xl font-black uppercase text-gray-900">Keranjang Belanja</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-black/10 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-bold text-gray-900">Keranjang Kosong</p>
              <p className="text-sm text-gray-500 mt-2">Belum ada item di keranjang kamu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.summary.item_tidak_aktif > 0 && (
                <div className="bg-red-100 border-2 border-red-900 p-3 flex justify-between items-center rounded-lg">
                  <p className="text-sm text-red-900 font-bold">Ada {cart.summary.item_tidak_aktif} item tidak aktif</p>
                  <button 
                    onClick={() => cleanCart()}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded border-2 border-red-900 hover:bg-red-700 font-bold"
                  >
                    Bersihkan
                  </button>
                </div>
              )}
              
              {cart.items.map((item) => {
                const itemSlug = item.item_type === 'akun' 
                  ? (item as any).jualBeliAkun?.slug || (item as any).listing?.slug || item.id_listing
                  : (item as any).produk?.game?.slug || (item as any).product?.game?.slug || item.id_produk;
                
                const targetUrl = item.item_type === 'akun' 
                  ? `/accounts/${itemSlug}` 
                  : `/topup/${itemSlug}`;

                return (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = targetUrl;
                    }}
                    className={`cursor-pointer bg-white border-[3px] border-gray-900 p-4 rounded-xl shadow-[4px_4px_0px_#111827] relative transition-all ${!item.bisa_dibeli ? 'opacity-60 bg-gray-50' : 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111827]'}`}
                  >
                    {/* Delete Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.id);
                      }}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors border-2 border-transparent hover:border-red-600 z-10"
                      title="Hapus item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="pr-10">
                      {/* Badge Tipe */}
                      <div className="mb-2">
                        {item.item_type === 'akun' ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-1 rounded-md border-2 border-purple-900 uppercase tracking-widest shadow-[2px_2px_0px_#581c87]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Akun Game
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1 rounded-md border-2 border-blue-900 uppercase tracking-widest shadow-[2px_2px_0px_#1e3a8a]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Top Up / Voucher
                          </span>
                        )}
                      </div>

                      {/* Nama Produk */}
                      <p className="font-black text-gray-900 text-sm leading-tight line-clamp-2 mb-1.5 hover:text-blue-600 transition-colors">
                        {item.item_type === 'akun' 
                          ? (item as any).jualBeliAkun?.nama_post || (item as any).listing?.nama_post || `Beli Akun (ID: ${item.id_listing})`
                          : (item as any).produk?.name || (item as any).product?.name || `Produk Digital (ID: ${item.id_produk})`
                        }
                      </p>

                      {/* Detail Topup (Target & Qty) */}
                      {item.item_type === 'topup' && (
                        <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-2 mb-2">
                          <p className="text-[10px] text-gray-600 font-bold flex items-center gap-1.5">
                            <span className="bg-gray-300 text-gray-800 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Target</span> 
                            {item.topup_target_id} {item.topup_target_server ? `(${item.topup_target_server})` : ''}
                          </p>
                          {item.quantity && item.quantity > 1 && (
                            <p className="text-[10px] text-gray-600 font-bold flex items-center gap-1.5 mt-1">
                              <span className="bg-gray-300 text-gray-800 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Qty</span> 
                              {item.quantity}x Pembelian
                            </p>
                          )}
                        </div>
                      )}

                      {/* Harga dan Checkout */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-blue-600 font-black text-lg drop-shadow-[1px_1px_0_#111827]">
                          Rp {item.harga_sekarang.toLocaleString('id-ID')}
                        </span>
                        
                        {item.bisa_dibeli ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpen(false);
                              if (item.item_type === 'akun') {
                                const itemSlug = (item as any).jualBeliAkun?.slug || (item as any).listing?.slug || item.id_listing;
                                window.location.href = `/checkout/akun/${itemSlug}`;
                              } else {
                                toast('Sistem checkout Top Up / Voucher segera hadir!', 'info');
                              }
                            }}
                            className="text-[10px] bg-green-500 text-white px-3 py-1.5 rounded-md font-black border-2 border-green-900 shadow-[2px_2px_0px_#14532d] hover:bg-green-600 hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all uppercase tracking-wider flex items-center gap-1 z-10 relative"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Checkout
                          </button>
                        ) : (
                          <span className="text-[10px] bg-red-100 text-red-800 px-2 py-1 rounded-md font-black border-2 border-red-900 shadow-[2px_2px_0px_#7f1d1d] uppercase tracking-wider">
                            Habis
                          </span>
                        )}
                      </div>

                      {/* Notifikasi Perubahan Harga */}
                      {item.harga_berubah && (
                        <div className="mt-2 bg-orange-50 border-2 border-orange-400 p-1.5 rounded-md flex items-start gap-1.5">
                          <svg className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-[10px] text-orange-800 font-bold leading-tight">
                            Harga berubah (Selisih: Rp {item.selisih_harga.toLocaleString('id-ID')})
                          </p>
                        </div>
                      )}

                      {/* Input Catatan */}
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Catatan Tambahan</label>
                        <input
                          type="text"
                          placeholder="Contoh: Nomor WA / Catatan untuk penjual"
                          defaultValue={item.catatan || ''}
                          onBlur={(e) => updateCartItem(item.id, { catatan: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 border-2 border-gray-300 bg-gray-50 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-[2px_2px_0px_#2563eb] transition-all placeholder:font-medium placeholder:text-gray-400 relative z-10"
                          disabled={!item.bisa_dibeli}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="p-4 border-t-2 border-gray-900 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-bold">Total Nilai ({cart.summary.item_aktif} Item)</span>
              <span className="text-xl font-black text-gray-900">Rp {cart.summary.total_harga.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => clearCart()}
                className="w-full py-3 bg-white border-2 border-gray-900 rounded-lg shadow-[3px_3px_0px_#111827] text-gray-900 font-bold hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all uppercase text-sm"
              >
                Kosongkan Keranjang
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
