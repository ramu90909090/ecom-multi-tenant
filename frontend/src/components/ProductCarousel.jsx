import React from "react";
import ProductCard from "./ProductCard";

export default function ProductCarousel({ title, subtitle, products = [] }) {
  if (!products.length) return null;

  return (
    <section className="py-8">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 font-semibold">{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id || p.id} product={p} />
        ))}
      </div>
    </section>
  );
}