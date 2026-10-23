import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { getImageUrl } from "../utils/productUtils";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-black text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="inline-flex px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Shopping Cart ({cart.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-3">
          {cart.map((it) => {
            const id = it._id || it.id;
            const img = Array.isArray(it.images) && it.images.length > 0 ? it.images[0] : it.image;
            return (
              <div key={id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                <img src={getImageUrl(img)} alt={it.name} className="w-16 h-16 object-cover rounded-xl" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{it.name}</h4>
                  <p className="text-xs font-black text-slate-900 mt-1">₹{(it.finalPrice || it.price).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1">
                  <button onClick={() => updateQuantity(id, -1)} className="p-0.5 text-slate-500"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-bold text-slate-800">{it.quantity}</span>
                  <button onClick={() => updateQuantity(id, 1)} className="p-0.5 text-slate-500"><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => removeFromCart(id)} className="p-2 text-rose-500 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h3 className="font-black text-sm text-slate-900 mb-4">Order Summary</h3>
          <div className="space-y-2 text-xs font-bold text-slate-600 pb-4 border-b border-slate-100">
            <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Delivery:</span><span>FREE</span></div>
          </div>
          <div className="flex justify-between text-sm font-black text-slate-900 py-4">
            <span>Total:</span><span>₹{subtotal.toLocaleString()}</span>
          </div>
          <button
            onClick={() => navigate("/payment")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}