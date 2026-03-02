import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

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
        wasCorrupt: false,
      }
    }
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY)
    return {
      items: [],
      storeId: null,
      storeName: '',
      specialInstructions: '',
      wasCorrupt: true,
    }
  }
  return { items: [], storeId: null, storeName: '', specialInstructions: '', wasCorrupt: false }
}

export function CartProvider({ children }) {
  const cartInitRef = useRef(null)
  if (cartInitRef.current === null) {
    cartInitRef.current = loadCartFromStorage()
  }
  const init = cartInitRef.current

  const [items, setItems] = useState(init.items)
  const [storeId, setStoreId] = useState(init.storeId)
  const [storeName, setStoreName] = useState(init.storeName)
  const [specialInstructions, setSpecialInstructions] = useState(init.specialInstructions)
  const [cartWasCorrupt] = useState(init.wasCorrupt)

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items, storeId, storeName, specialInstructions })
    )
  }, [items, storeId, storeName, specialInstructions])

  const addItem = useCallback(
    (item, store) => {
      if (storeId && storeId !== store.id) {
        // Return conflict info — caller handles the confirmation dialog
        return { conflict: true, currentStoreName: storeName, newStore: store, item }
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
      return { conflict: false }
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

  const replaceCart = useCallback(
    (item, store) => {
      setStoreId(store.id)
      setStoreName(store.name)
      setSpecialInstructions('')
      setItems([
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          imageUrl: item.imageUrl || null,
          notes: item.notes || '',
        },
      ])
    },
    []
  )

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
      cartWasCorrupt,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
      getTotal,
      getItemCount,
      setSpecialInstructions,
    }),
    [
      items,
      storeId,
      storeName,
      specialInstructions,
      cartWasCorrupt,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
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
