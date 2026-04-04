import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { saveCart, getCart, clearCart } from '@/storage';
import type { Cart, CartItem } from '@/api/types';

const EMPTY_CART: Cart = { storeId: null, storeName: null, items: [] };

// ── Reducer ───────────────────────────────────────────────────────────────────

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; menuItemId: string }
  | { type: 'UPDATE_QTY'; menuItemId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'RESTORE'; cart: Cart };

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'RESTORE':
      return action.cart;

    case 'CLEAR':
      return EMPTY_CART;

    case 'ADD_ITEM': {
      const { item } = action;
      // If cart is from a different store, replace it
      if (state.storeId && state.storeId !== item.storeId) {
        return { storeId: item.storeId, storeName: item.storeName, items: [{ ...item }] };
      }
      const existing = state.items.findIndex((i) => i.menuItemId === item.menuItemId);
      if (existing >= 0) {
        const updated = [...state.items];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + item.quantity };
        return { ...state, items: updated };
      }
      return {
        storeId: item.storeId,
        storeName: item.storeName,
        items: [...state.items, { ...item }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.menuItemId !== action.menuItemId),
        storeId: state.items.length === 1 ? null : state.storeId,
        storeName: state.items.length === 1 ? null : state.storeName,
      };

    case 'UPDATE_QTY': {
      if (action.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', menuItemId: action.menuItemId });
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, quantity: action.quantity } : i,
        ),
      };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQty: (menuItemId: string) => number;
  isDifferentStore: (storeId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);

  // Restore cart from storage
  useEffect(() => {
    getCart<Cart>().then((stored) => {
      if (stored?.storeId) dispatch({ type: 'RESTORE', cart: stored });
    });
  }, []);

  // Persist whenever cart changes
  useEffect(() => {
    if (cart.storeId) {
      saveCart(cart);
    } else {
      clearCart();
    }
  }, [cart]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', item });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', menuItemId });
  }, []);

  const updateQty = useCallback((menuItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', menuItemId, quantity });
  }, []);

  const doClearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const getItemQty = useCallback(
    (menuItemId: string) => cart.items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0,
    [cart.items],
  );

  const isDifferentStore = useCallback(
    (storeId: string) => !!cart.storeId && cart.storeId !== storeId,
    [cart.storeId],
  );

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQty,
        clearCart: doClearCart,
        getItemQty,
        isDifferentStore,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
