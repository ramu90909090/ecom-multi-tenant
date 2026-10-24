import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  UploadCloud,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RefreshCw
} from "lucide-react";
import { getImageUrl } from "../../utils/productUtils";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockStatus, setStockStatus] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10); // Options: 10, 25, 50, 100
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  // Modal Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics",
    price: "",
    discount: 0,
    stock: 10,
    description: "",
    newUrlInput: ""
  });

  // Image states
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newFilePreviews, setNewFilePreviews] = useState([]);

  const [quickStock, setQuickStock] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Products with Dynamic Filter & Pagination Query
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (stockStatus !== "All") params.append("stockStatus", stockStatus);
      params.append("sortBy", sortBy);
      params.append("page", currentPage);
      params.append("limit", limit);

      const res = await API.get(`/products?${params.toString()}`);
      if (res.data?.success) {
        setProducts(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on filter or pagination changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, limit, selectedCategory, stockStatus, sortBy]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setStockStatus("All");
    setSortBy("createdAt-desc");
    setCurrentPage(1);
  };

  // Clean object preview URLs
  useEffect(() => {
    return () => {
      newFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFilePreviews]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "Electronics",
      price: "",
      discount: 0,
      stock: 10,
      description: "",
      newUrlInput: ""
    });
    setExistingImages([]);
    setNewFiles([]);
    setNewFilePreviews([]);
    setError("");
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    let imgs = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      imgs = p.images.map((img) => (typeof img === "object" ? img.url : img));
    } else if (p.image) {
      imgs = [p.image];
    }

    setFormData({
      name: p.name || "",
      category: p.category || "Electronics",
      price: p.price || "",
      discount: p.discount || 0,
      stock: p.stock !== undefined ? p.stock : 10,
      description: p.description || "",
      newUrlInput: ""
    });

    setExistingImages(imgs);
    setNewFiles([]);
    setNewFilePreviews([]);
    setError("");
    setModalOpen(true);
  };

  // File Upload Selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    const totalCount = existingImages.length + newFiles.length + selectedFiles.length;
    if (totalCount > 5) {
      setError(`⚠️ Maximum 5 images allow hain! Total: ${totalCount}`);
      return;
    }

    setNewFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setNewFilePreviews((prev) => [...prev, ...newPreviews]);
    setError("");
  };

  // Add Direct URL
  const handleAddUrlImage = () => {
    const url = formData.newUrlInput.trim();
    if (!url) return;

    if (existingImages.length + newFiles.length + 1 > 5) {
      setError("⚠️ Maximum 5 images allow hain!");
      return;
    }

    setExistingImages([...existingImages, url]);
    setFormData({ ...formData, newUrlInput: "" });
    setError("");
  };

  // Remove Image Handlers
  const handleDeleteExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteNewFile = (idx) => {
    URL.revokeObjectURL(newFilePreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewFilePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError("");

    const totalImages = existingImages.length + newFiles.length;
    if (totalImages < 1) {
      setError("⚠️ Kam se kam 1 product image hona zaroori hai!");
      return;
    }
    if (totalImages > 5) {
      setError(`⚠️ Maximum 5 images allow hain! Abhi ${totalImages} images hain.`);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("category", formData.category);
    data.append("price", Number(formData.price) || 0);
    data.append("discount", Number(formData.discount) || 0);
    data.append("stock", Number(formData.stock) || 0);
    data.append("description", formData.description.trim());

    data.append("existingImages", JSON.stringify(existingImages));
    for (let f of newFiles) {
      data.append("images", f);
    }

    setLoading(true);
    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, data, {
          headers: { "Content-Type": undefined }
        });
        alert("✅ Product safaltapoorvak update ho gaya!");
      } else {
        await API.post("/products", data, {
          headers: { "Content-Type": undefined }
        });
        alert("✅ Naya Product catalog me add ho gaya!");
      }

      setModalOpen(false);
      setEditingProduct(null);
      setNewFiles([]);
      setNewFilePreviews([]);
      fetchProducts();
    } catch (err) {
      console.error("Product save error:", err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Product save request fail ho gayi.";
      setError(serverMsg);
      alert(`❌ Error: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Quick Stock Inline Update
  const handleQuickStockUpdate = async (id) => {
    const newStock = quickStock[id];
    if (newStock === undefined || newStock === "") return;
    try {
      await API.put(`/products/${id}`, { stock: Number(newStock) });
      alert("✅ Stock updated!");
      fetchProducts();
    } catch (err) {
      alert(`❌ ${err.response?.data?.message || err.message}`);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Kya aap sach me is product ko delete karna chahte hain?")) {
      try {
        await API.delete(`/products/${id}`);
        alert("✅ Product delete ho gaya!");
        fetchProducts();
      } catch (err) {
        alert(`❌ ${err.response?.data?.message || err.message}`);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Products Catalog Studio
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Total {pagination.total} products registered in store inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* 2. Search, Filter & Per-Page Control Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box (5 cols) */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none transition"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-black transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Category Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Footwear">Footwear</option>
              <option value="Home">Home</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          {/* Stock Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Stock Status</option>
              <option value="inStock">In Stock (&gt; 0)</option>
              <option value="outOfStock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort By (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="discount-high">Max Discount</option>
            </select>
          </div>

          {/* Items Per Page Dropdown: 10, 25, 50, 100 (2 cols) */}
          <div className="md:col-span-2 flex items-center justify-end space-x-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-2 px-2.5 bg-indigo-50/70 border border-indigo-200 text-indigo-700 font-black rounded-xl text-xs outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

        </div>

        {/* Active Filters Clear Badge Bar */}
        {(search || selectedCategory !== "All" || stockStatus !== "All") && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-bold">Active Filters:</span>
            {search && (
              <span className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-1">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} />
              </span>
            )}
            {selectedCategory !== "All" && (
              <span className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-1">
                {selectedCategory}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("All")} />
              </span>
            )}
            {stockStatus !== "All" && (
              <span className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-1">
                {stockStatus === "inStock" ? "In Stock" : "Out of Stock"}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setStockStatus("All")} />
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-pink-600 hover:text-pink-700 font-bold ml-auto cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* 3. Products Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4">Quick Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching catalog records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">
                    Koi product filter match nahi hua. Search clear karke dobara check karein.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.image;
                  const totalImgs = Array.isArray(p.images) ? p.images.length : p.image ? 1 : 0;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={getImageUrl(img)}
                          alt=""
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80";
                          }}
                        />
                        <div className="max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                          <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-0.5">
                            <ImageIcon className="w-3 h-3" /> {totalImgs} image(s) attached
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-700">{p.category}</td>
                      <td className="p-4 font-black text-slate-900">₹{Number(p.price).toLocaleString()}</td>
                      <td className="p-4 font-bold text-amber-600">{p.discount || 0}% OFF</td>
                      <td className="p-4 font-bold">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            p.stock > 0
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-rose-50 text-rose-600 border border-rose-200"
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            placeholder={p.stock}
                            onChange={(e) => setQuickStock({ ...quickStock, [p._id]: e.target.value })}
                            className="w-16 border border-slate-200 rounded-lg p-1.5 text-center font-bold text-xs bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none"
                          />
                          <button
                            onClick={() => handleQuickStockUpdate(p._id)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition cursor-pointer"
                            title="Save Quick Stock"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-block cursor-pointer"
                          title="Edit Product & Manage Images"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition inline-block cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Complete Server Pagination Bar */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-500">
            Showing <b className="text-slate-800">{products.length}</b> of{" "}
            <b className="text-slate-800">{pagination.total}</b> products • Page{" "}
            <b className="text-slate-800">{pagination.page}</b> of{" "}
            <b className="text-slate-800">{pagination.totalPages}</b>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Current Page Pill */}
            <span className="px-4 py-1.5 text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl">
              {currentPage} / {pagination.totalPages}
            </span>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={currentPage >= pagination.totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 my-auto shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingProduct ? "Edit Product Details" : "Add New Store Product"}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Product details aur multi-image previews manage karein (Max 5 images)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Smart Noise-Cancelling Headphones"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 bg-white outline-none cursor-pointer"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Home">Home</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 2999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="95"
                    placeholder="e.g. 15"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1">Stock Units *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Multi-Image Gallery with Live Previews & Deletion */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                    Product Images ({existingImages.length + newFiles.length}/5)
                  </span>
                  <span className="text-[10px] text-slate-400">Pehli image Primary hogi</span>
                </div>

                {(existingImages.length > 0 || newFilePreviews.length > 0) && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-1">
                    {/* Existing Saved Images */}
                    {existingImages.map((imgUrl, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm aspect-square"
                      >
                        <img
                          src={getImageUrl(imgUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 hover:scale-110 transition shadow cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[8px] font-black text-center py-0.5">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}

                    {/* New Upload Previews */}
                    {newFilePreviews.map((previewUrl, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative group rounded-xl overflow-hidden border-2 border-indigo-500 bg-white shadow-sm aspect-square"
                      >
                        <img
                          src={previewUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteNewFile(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 hover:scale-110 transition shadow cursor-pointer"
                          title="Remove selection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0 inset-x-0 bg-indigo-600 text-white text-[8px] font-black text-center py-0.5">
                          New
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Trigger */}
                <div>
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition group">
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition mb-1" />
                    <span className="text-[11px] font-bold text-slate-700">
                      Upload from computer
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Select JPG, PNG, WEBP files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Image URL input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or paste image URL: https://..."
                    value={formData.newUrlInput}
                    onChange={(e) => setFormData({ ...formData, newUrlInput: e.target.value })}
                    className="flex-1 border border-slate-200 focus:border-indigo-600 rounded-xl px-3 py-1.5 outline-none bg-white text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    + Add URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1">Product Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Features, box packaging, warranty & specifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{editingProduct ? "Save Changes" : "Publish Product"}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
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