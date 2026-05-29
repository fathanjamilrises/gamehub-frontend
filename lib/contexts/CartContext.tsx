'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { cartApi, CartResponse, AddToCartPayload } from '../cartApi';
import { useToast } from './ToastContext';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../authApi';

interface CartContextType {
  cart: CartResponse | null;
  cartCount: number;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fetchCart: () => Promise<void>;
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  updateCartItem: (cartId: number, body: { catatan?: string; quantity?: number }) => Promise<void>;
  removeFromCart: (cartId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cleanCart: () => Promise<void>;
  checkCartItemAkun: (idListing: number) => Promise<boolean>;
  checkCartItemTopup: (idProduk: number, targetId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchCartCount = useCallback(async () => {
    if (!getToken()) {
      setCartCount(0);
      return;
    }
    try {
      const data = await cartApi.getCartCount();
      setCartCount(data.count);
    } catch (error: any) {
      if (error.message !== 'Unauthorized') {
        console.error('Error fetching cart count:', error);
      }
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!getToken()) {
      setCart(null);
      setCartCount(0);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
      setCartCount(data.summary.total_item);
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        setCart(null);
        setCartCount(0);
      } else {
        console.error('Error fetching cart:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      fetchCartCount();
      fetchCart();
    } else {
      setCart(null);
      setCartCount(0);
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchCartCount, fetchCart]);

  const addToCart = async (payload: AddToCartPayload) => {
    try {
      await cartApi.addToCart(payload);
      toast('Item berhasil ditambahkan ke keranjang', 'success');
      await fetchCart();
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        toast('Silakan login terlebih dahulu', 'error');
      } else {
        toast(error.message || 'Gagal menambahkan item', 'error');
      }
      throw error;
    }
  };

  const updateCartItem = async (cartId: number, body: { catatan?: string; quantity?: number }) => {
    try {
      await cartApi.updateCartItem(cartId, body);
      await fetchCart();
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        toast('Silakan login terlebih dahulu', 'error');
      } else {
        toast(error.message || 'Gagal mengubah item', 'error');
      }
      throw error;
    }
  };

  const removeFromCart = async (cartId: number) => {
    try {
      await cartApi.removeFromCart(cartId);
      toast('Item dihapus dari keranjang', 'success');
      await fetchCart();
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        toast('Silakan login terlebih dahulu', 'error');
      } else {
        toast(error.message || 'Gagal menghapus item', 'error');
      }
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      toast('Keranjang berhasil dikosongkan', 'success');
      await fetchCart();
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        toast('Silakan login terlebih dahulu', 'error');
      } else {
        toast(error.message || 'Gagal mengosongkan keranjang', 'error');
      }
      throw error;
    }
  };

  const cleanCart = async () => {
    try {
      await cartApi.cleanCart();
      toast('Item tidak aktif berhasil dibersihkan', 'success');
      await fetchCart();
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        toast('Silakan login terlebih dahulu', 'error');
      } else {
        toast(error.message || 'Gagal membersihkan keranjang', 'error');
      }
      throw error;
    }
  };

  const checkCartItemAkun = async (idListing: number): Promise<boolean> => {
    if (!getToken()) return false;
    try {
      const data = await cartApi.checkCartItemAkun(idListing);
      return data.in_cart;
    } catch (error) {
      return false;
    }
  };

  const checkCartItemTopup = async (idProduk: number, targetId: string): Promise<boolean> => {
    if (!getToken()) return false;
    try {
      const data = await cartApi.checkCartItemTopup(idProduk, targetId);
      return data.in_cart;
    } catch (error) {
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isLoading,
        isOpen,
        setIsOpen,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        cleanCart,
        checkCartItemAkun,
        checkCartItemTopup,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
