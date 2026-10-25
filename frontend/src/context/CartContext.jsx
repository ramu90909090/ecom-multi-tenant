import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // 1. Cart Items with LocalStorage Persistence
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("store_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // 2. Direct Buy Now Item Persistence
  const [checkoutItem, setCheckoutItemState] = useState(() => {
    try {
      const savedCheckout = localStorage.getItem("direct_checkout_item");
      return savedCheckout ? JSON.parse(savedCheckout) : null;
    } catch {
      return null;
    }
  });

  // LocalStorage Sync
  useEffect(() => {
    try {
      localStorage.setItem("store_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save error", e);
    }
  }, [cart]);

  const setCheckoutItem = (item) => {
    setCheckoutItemState(item);
    try {
      if (item) {
        localStorage.setItem("direct_checkout_item", JSON.stringify(item));
      } else {
        localStorage.removeItem("direct_checkout_item");
      }
    } catch (e) {
      console.error("CheckoutItem save error", e);
    }
  };

  // Helper: Matching ID resolver (_id or id)
  const isMatchingId = (item, targetId) => {
    const itemId = String(item._id || item.id || "");
    const searchId = String(targetId || "");
    return itemId === searchId;
  };

  // Add To Cart
  const addToCart = (product, addQty = 1) => {
    const qtyToAdd = Number(addQty) > 0 ? Number(addQty) : 1;
    setCart((prevCart) => {
      const existing = prevCart.find((it) =>
        isMatchingId(it, product._id || product.id)
      );

      if (existing) {
        return prevCart.map((it) =>
          isMatchingId(it, product._id || product.id)
            ? { ...it, quantity: (Number(it.quantity) || 1) + qtyToAdd }
            : it
        );
      }

      return [
        ...prevCart,
        {
          ...product,
          _id: product._id || product.id,
          id: product._id || product.id,
          quantity: qtyToAdd
        }
      ];
    });
  };

  // Update Quantity (+1 or -1)
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (isMatchingId(item, id)) {
            const currentQty = Number(item.quantity) || 1;
            const newQty = currentQty + delta;
            // Agar quantity 0 ho jaye to filter out karein
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Remove Item from Cart
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => !isMatchingId(item, id)));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setCheckoutItem(null);
    try {
      localStorage.removeItem("store_cart");
      localStorage.removeItem("direct_checkout_item");
    } catch (e) {}
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkoutItem,
        setCheckoutItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);