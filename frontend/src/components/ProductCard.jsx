import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag } from "lucide-react";
import { calculateFinalPrice, getImageUrl } from "../utils/productUtils";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const id = product._id || product.id;
  const primaryImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image;
  const finalPrice = calculateFinalPrice(product.price, product.discount);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col group">
      <Link to={`/product/${id}`} className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={getImageUrl(primaryImage)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
          }}
        />
        {product.discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            {product.discount}% OFF
          </span>
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{product.rating || 4.5}</span>
          </div>
          <Link to={`/product/${id}`} className="text-xs font-bold text-slate-800 hover:text-indigo-600 transition line-clamp-2">
            {product.name}
          </Link>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-slate-900">₹{finalPrice.toLocaleString()}</span>
              {product.discount > 0 && (
                <span className="text-[10px] text-slate-400 line-through">₹{Number(product.price).toLocaleString()}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => addToCart({ ...product, finalPrice }, 1)}
            className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}