import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'campusbite_cart'

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        items: parsed.items || [],
        storeId: parsed.storeId || null,
        storeName: parsed.storeName || '',
        specialInstructions: parsed.specialInstructions || '',
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { items: [], storeId: null, storeName: '', specialInstructions: '' }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCartFromStorage().items)
  const [storeId, setStoreId] = useState(() => loadCartFromStorage().storeId)
  const [storeName, setStoreName] = useState(() => loadCartFromStorage().storeName)
  const [specialInstructions, setSpecialInstructions] = useState(
    () => loadCartFromStorage().specialInstructions
  )

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items, storeId, storeName, specialInstructions })
    )
  }, [items, storeId, storeName, specialInstructions])

  const addItem = useCallback(
    (item, store) => {
      if (storeId && storeId !== store.id) {
        const confirmed = window.confirm(
          `Your cart contains items from ${storeName}. Would you like to clear the cart and add items from ${store.name}?`
        )
        if (!confirmed) return false
        setItems([])
      }

      setStoreId(store.id)
      setStoreName(store.name)

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === item.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + (item.quantity || 1),
          }
          return updated
        }
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            imageUrl: item.imageUrl || null,
            notes: item.notes || '',
          },
        ]
      })
      return true
    },
    [storeId, storeName]
  )

  const removeItem = useCallback((itemId) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== itemId)
      if (updated.length === 0) {
        setStoreId(null)
        setStoreName('')
        setSpecialInstructions('')
      }
      return updated
    })
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== itemId)
        if (updated.length === 0) {
          setStoreId(null)
          setStoreName('')
          setSpecialInstructions('')
        }
        return updated
      })
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setStoreId(null)
    setStoreName('')
    setSpecialInstructions('')
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  const value = useMemo(
    () => ({
      items,
      storeId,
      storeName,
      specialInstructions,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount,
      setSpecialInstructions,
    }),
    [
      items,
      storeId,
      storeName,
      specialInstructions,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
