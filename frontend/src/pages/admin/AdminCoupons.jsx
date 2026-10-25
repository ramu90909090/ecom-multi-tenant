import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X
} from "lucide-react";
import API from "../../api/axios";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, isEdit: false, data: {} });

  const categories = ["All", "Electronics", "Fashion", "Footwear", "Home", "Accessories"];

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await API.get("/coupons");
      if (res.data?.success) {
        setCoupons(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const res = await API.patch(`/coupons/${id}/toggle`);
      if (res.data?.success) {
        fetchCoupons();
      }
    } catch (err) {
      alert("Status toggle error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Kya aap sach me coupon '${code}' delete karna chahte hain?`)) return;
    try {
      await API.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      if (modal.isEdit) {
        await API.put(`/coupons/${modal.data._id}`, modal.data);
      } else {
        await API.post("/coupons", modal.data);
      }
      setModal({ open: false, isEdit: false, data: {} });
      fetchCoupons();
    } catch (err) {
      alert("Save Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-6 h-6 text-pink-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Coupons & Discount Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Category-wise dynamic promo codes generate karein aur live toggle karein
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCoupons}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() =>
              setModal({
                open: true,
                isEdit: false,
                data: {
                  code: "",
                  description: "",
                  discountType: "percentage",
                  discountValue: 10,
                  maxDiscountAmount: 500,
                  minOrderAmount: 999,
                  applicableCategory: "All",
                  expiryDate: "",
                  usageLimit: 0,
                  isActive: true
                }
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-bold text-[11px]">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Benefit</th>
                <th className="p-4">Target Category</th>
                <th className="p-4">Min Order</th>
                <th className="p-4">Redeemed</th>
                <th className="p-4">Live Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-bold">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-bold">
                    Koi coupon create nahi kiya gaya hai.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <span className="font-mono font-black text-sm text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200">
                        {c.code}
                      </span>
                      {c.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{c.description}</p>
                      )}
                    </td>

                    <td className="p-4 font-bold text-slate-900">
                      {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue}`}
                      {c.discountType === "percentage" && c.maxDiscountAmount > 0 && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Max Cap: ₹{c.maxDiscountAmount}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-violet-50 text-violet-700 font-black text-[10px] uppercase rounded-md border border-violet-200">
                        {c.applicableCategory || "All"}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-slate-800">
                      {c.minOrderAmount > 0 ? `₹${c.minOrderAmount.toLocaleString()}` : "None"}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-600">
                      {c.usedCount} {c.usageLimit > 0 ? `/ ${c.usageLimit}` : "used"}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(c._id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-300"
                        }`}
                        title="Click to toggle active/inactive"
                      >
                        {c.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                        <span>{c.isActive ? "Live" : "Inactive"}</span>
                      </button>
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setModal({ open: true, isEdit: true, data: { ...c } })}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                        title="Edit Coupon"
                      >
                        <Edit3 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id, c.code)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveCoupon}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {modal.isEdit ? `Edit Coupon: ${modal.data.code}` : "Generate New Promo Coupon"}
              </h3>
              <button
                type="button"
                onClick={() => setModal({ open: false, isEdit: false, data: {} })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER25"
                    value={modal.data.code || ""}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, code: e.target.value.toUpperCase() } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 uppercase font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block mb-1">Target Category *</label>
                  <select
                    value={modal.data.applicableCategory || "All"}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, applicableCategory: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1">Type</label>
                  <select
                    value={modal.data.discountType || "percentage"}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, discountType: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 cursor-pointer"
                  >
                    <option value="percentage">% Percentage</option>
                    <option value="flat">₹ Flat Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10"
                    value={modal.data.discountValue || ""}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, discountValue: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = No cap"
                    value={modal.data.maxDiscountAmount || 0}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, maxDiscountAmount: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 999"
                    value={modal.data.minOrderAmount || 0}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, minOrderAmount: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={modal.data.expiryDate ? modal.data.expiryDate.split("T")[0] : ""}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, expiryDate: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Short Description / Banner Note</label>
                <input
                  type="text"
                  placeholder="e.g. Extra 10% off on electronics orders over ₹999"
                  value={modal.data.description || ""}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, description: e.target.value } })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-normal"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  id="couponLive"
                  checked={modal.data.isActive !== false}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, isActive: e.target.checked } })
                  }
                  className="accent-pink-600 rounded"
                />
                <label htmlFor="couponLive" className="cursor-pointer">
                  Coupon ko turant LIVE (Active) karein
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setModal({ open: false, isEdit: false, data: {} })}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Save Coupon
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}