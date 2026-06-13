import React, { createContext, useState, useContext } from 'react';

export interface ModifierOption {
  type: 'size' | 'temperature' | 'milk' | 'sweetness' | 'protein';
  value: string;
  name_th: string;
  name_en: string;
  priceAdded: number;
}

export interface AddOnOption {
  value: string;
  name_th: string;
  name_en: string;
  priceAdded: number;
}

export interface CartItem {
  cartItemId: string; // unique ID representing this specific customization
  id: number;         // menu item id
  name_th: string;
  name_en: string;
  price: number;      // unit price including customizations
  quantity: number;
  modifiers: ModifierOption[];
  addOns: AddOnOption[];
  note: string;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: any, modifiers: ModifierOption[], addOns: AddOnOption[], quantity: number, note: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

// Helper to generate a unique key for the item customization state
const generateCartItemId = (id: number, modifiers: ModifierOption[], addOns: AddOnOption[], note: string): string => {
  const modKey = modifiers
    .map(m => `${m.type}:${m.value}`)
    .sort()
    .join('|');
  const addOnKey = addOns
    .map(a => a.value)
    .sort()
    .join('|');
  return `${id}-${modKey}-${addOnKey}-${note.trim()}`;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Calculate cart total dynamically
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const addToCart = (
    item: any,
    modifiers: ModifierOption[],
    addOns: AddOnOption[],
    quantity: number,
    note: string
  ) => {
    // 1. Calculate price for this customized unit
    // Base price starts with the selected temperature or protein option
    let basePrice = item.price; // default fallback

    const tempMod = modifiers.find(m => m.type === 'temperature');
    const proteinMod = modifiers.find(m => m.type === 'protein');

    if (tempMod) {
      if (tempMod.value === 'iced' && item.price_iced !== null) {
        basePrice = item.price_iced;
      } else if (tempMod.value === 'frappe' && item.price_frappe !== null) {
        basePrice = item.price_frappe;
      } else if (tempMod.value === 'hot' && item.price !== null) {
        basePrice = item.price;
      }
    } else if (proteinMod) {
      if (proteinMod.value === 'beef' && item.price_beef) {
        basePrice = item.price_beef;
      } else if (proteinMod.value === 'shrimp' && item.price_shrimp) {
        basePrice = item.price_shrimp;
      } else if (proteinMod.value === 'seafood' && item.price_seafood) {
        basePrice = item.price_seafood;
      } else {
        basePrice = item.price; // chicken or default
      }
    }

    // Add extra price increments for size, milk, and add-ons
    const modifiersCost = modifiers
      .filter(m => m.type !== 'temperature' && m.type !== 'protein') // temp and protein are already folded in basePrice
      .reduce((sum, m) => sum + m.priceAdded, 0);

    const addOnsCost = addOns.reduce((sum, a) => sum + a.priceAdded, 0);

    const unitPrice = basePrice + modifiersCost + addOnsCost;

    // 2. Add to cart or increment quantity
    const cartItemId = generateCartItemId(item.id, modifiers, addOns, note);

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(i => i.cartItemId === cartItemId);
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            cartItemId,
            id: item.id,
            name_th: item.name_th,
            name_en: item.name_en,
            price: unitPrice,
            quantity,
            modifiers,
            addOns,
            note: note.trim()
          }
        ];
      }
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
