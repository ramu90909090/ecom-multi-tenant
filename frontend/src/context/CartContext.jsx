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

  // 2. Direct Buy Now Item with LocalStorage Persistence
  const [checkoutItem, setCheckoutItemState] = useState(() => {
    try {
      const savedCheckout = localStorage.getItem("direct_checkout_item");
      return savedCheckout ? JSON.parse(savedCheckout) : null;
    } catch {
      return null;
    }
  });

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("store_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save error", e);
    }
  }, [cart]);

  // Robust setCheckoutItem wrapper
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

  // Add To Cart Function
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(
        (it) => (it._id || it.id) === (product._id || product.id)
      );
      if (existing) {
        return prevCart.map((it) =>
          (it._id || it.id) === (product._id || product.id)
            ? { ...it, quantity: (it.quantity || 1) + (product.quantity || 1) }
            : it
        );
      }
      return [...prevCart, { ...product, quantity: product.quantity || 1 }];
    });
  };

  // Clear Cart & Direct Buy
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
        checkoutItem,
        setCheckoutItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);