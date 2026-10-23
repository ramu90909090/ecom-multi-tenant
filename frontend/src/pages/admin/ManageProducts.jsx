import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { Plus, Trash2, Edit, Image as ImageIcon, Save, Check } from "lucide-react";
import { getImageUrl } from "../../utils/productUtils";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics",
    price: "",
    discount: 0,
    stock: 10,
    description: "",
    existingUrls: ""
  });
  const [files, setFiles] = useState([]);
  const [quickStock, setQuickStock] = useState({});

  const fetchProducts = async () => {
    const res = await API.get("/products?includeOutOfStock=true");
    if (res.data?.data) {
      setProducts(res.data.data);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // Check Total Images count (3 to 5 images rule)
    const urlCount = formData.existingUrls ? formData.existingUrls.split(",").filter((s) => s.trim()).length : 0;
    const totalCount = urlCount + files.length;

    if (totalCount < 3 || totalCount > 5) {
      alert(`⚠️ Please provide between 3 and 5 images! You currently provided ${totalCount}.`);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("category", formData.category);
    data.append("price", formData.price);
    data.append("discount", formData.discount);
    data.append("stock", formData.stock);
    data.append("description", formData.description);

    if (formData.existingUrls) {
      data.append("existingUrls", JSON.stringify(formData.existingUrls.split(",").map((s) => s.trim())));
    }
    for (let f of files) {
      data.append("imageFiles", f);
    }

    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, data);
      } else {
        await API.post("/products", data);
      }
      alert("✅ Product saved successfully!");
      setModalOpen(false);
      setEditingProduct(null);
      setFiles([]);
      fetchProducts();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleQuickStockUpdate = async (id) => {
    const newStock = quickStock[id];
    if (newStock === undefined) return;
    try {
      await API.patch(`/products/${id}/stock`, { stock: Number(newStock) });
      alert("✅ Stock updated!");
      fetchProducts();
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await API.delete(`/products/${id}`);
      fetchProducts();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Products Catalog Studio</h1>
          <p className="text-xs text-slate-400 font-bold">Manage store inventory, quick stock & images</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: "", category: "Electronics", price: "", discount: 0, stock: 10, description: "", existingUrls: "" });
            setFiles([]);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Quick Stock Update</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const img = p.images?.[0] || p.image;
              return (
                <tr key={p._id} className="hover:bg-slate-50/50">
                  <td className="p-4 flex items-center gap-3">
                    <img src={getImageUrl(img)} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                    <div>
                      <span className="font-bold text-slate-800 line-clamp-1">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{p.images?.length || 1} images</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold">{p.category}</td>
                  <td className="p-4 font-black text-slate-900">₹{p.price}</td>
                  <td className="p-4 font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${p.stock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder={p.stock}
                        onChange={(e) => setQuickStock({ ...quickStock, [p._id]: e.target.value })}
                        className="w-16 border border-slate-200 rounded-lg p-1 text-center font-bold text-xs"
                      />
                      <button
                        onClick={() => handleQuickStockUpdate(p._id)}
                        className="p-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-lg"
                        title="Update Stock"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleDelete(p._id)} className="text-rose-500 hover:text-rose-600 font-bold">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 my-auto shadow-2xl">
            <h3 className="font-black text-sm text-slate-900 mb-4">
              {editingProduct ? "Edit Product" : "Add New Product (3 to 5 Images)"}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Product Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white"
                  >
                    <option>Electronics</option>
                    <option>Fashion</option>
                    <option>Footwear</option>
                    <option>Home</option>
                    <option>Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Upload Images (Minimum 3, Max 5 files)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1">Or Comma-separated Image URLs</label>
                <input
                  type="text"
                  placeholder="https://..., https://..."
                  value={formData.existingUrls}
                  onChange={(e) => setFormData({ ...formData, existingUrls: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1">Product Description *</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}