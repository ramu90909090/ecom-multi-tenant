import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
  Package,
  Calendar
} from "lucide-react";
import API from "../../api/axios";

export default function AdminDelivery() {
  const [rules, setRules] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([
    "Electronics",
    "Fashion",
    "Footwear",
    "Home",
    "Accessories",
    "Groceries"
  ]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, isEdit: false, data: {} });
  const [customCategory, setCustomCategory] = useState(false);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/delivery");
      if (res.data?.success) {
        setRules(res.data.data || []);
      }

      // Live product categories ko list me merge karein
      try {
        const prodRes = await API.get("/products");
        const prods = prodRes.data?.data?.products || prodRes.data?.products || prodRes.data?.data || [];
        if (Array.isArray(prods) && prods.length > 0) {
          const cats = [...new Set(prods.map((p) => p.category).filter(Boolean))];
          if (cats.length > 0) {
            setAvailableCategories((prev) => [...new Set([...prev, ...cats])]);
          }
        }
      } catch {
        // Fallback default categories
      }
    } catch (err) {
      console.error("Delivery fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await API.patch(`/delivery/${id}/toggle`);
      if (res.data?.success) fetchDeliveryData();
    } catch (err) {
      alert("Toggle error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, category) => {
    if (!window.confirm(`Kya aap category '${category}' ka delivery rule delete karna chahte hain?`)) return;
    try {
      await API.delete(`/delivery/${id}`);
      fetchDeliveryData();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      category: modal.data.category?.trim(),
      shippingFee: Number(modal.data.shippingFee),
      freeDeliveryAbove: Number(modal.data.freeDeliveryAbove || 1000),
      estimatedDays: modal.data.estimatedDays?.trim() || "2-4 Business Days",
      description: modal.data.description?.trim() || "",
      isActive: modal.data.isActive !== undefined ? Boolean(modal.data.isActive) : true
    };

    if (!payload.category || isNaN(payload.shippingFee)) {
      alert("Category aur valid delivery fee daalna zaroori hai.");
      return;
    }

    try {
      if (modal.isEdit) {
        await API.put(`/delivery/${modal.data._id}`, payload);
      } else {
        await API.post("/delivery", payload);
      }
      setModal({ open: false, isEdit: false, data: {} });
      setCustomCategory(false);
      fetchDeliveryData();
    } catch (err) {
      alert(err.response?.data?.message || "Delivery rule save nahi ho saka.");
    }
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-pink-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Category Shipping Engine</h1>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Admin Controlled Category Delivery: Active rule ke anusaar checkout par highest shipping fee lagegi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDeliveryData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setCustomCategory(false);
              setModal({
                open: true,
                isEdit: false,
                data: {
                  category: availableCategories[0] || "Electronics",
                  shippingFee: 60,
                  freeDeliveryAbove: 1000,
                  estimatedDays: "2-4 Business Days",
                  description: "",
                  isActive: true
                }
              });
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Delivery Rules</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{rules.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Live (Active) Shipping</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Standard Free Shipping Threshold</span>
          <p className="text-2xl font-black text-pink-600 mt-1">₹1,000</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-bold text-[11px]">
              <tr>
                <th className="p-4">Category</th>
                <th className="p-4">Delivery Fee (₹)</th>
                <th className="p-4">Free Shipping Above</th>
                <th className="p-4">Est. Delivery Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-bold">
                    Loading shipping rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-bold">
                    Koi delivery rule nahi mila. 'Add Delivery Rule' par click karke naya rule banayein.
                  </td>
                </tr>
              ) : (
                rules.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        {r.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-black text-sm text-pink-600">
                      ₹{r.shippingFee}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">
                      ₹{r.freeDeliveryAbove.toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-500">{r.estimatedDays || "2-4 Days"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggle(r._id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition ${
                          r.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-300"
                        }`}
                      >
                        {r.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                        <span>{r.isActive ? "Active (Fee Applied)" : "Inactive (0 Charge)"}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setCustomCategory(!availableCategories.includes(r.category));
                          setModal({ open: true, isEdit: true, data: { ...r } });
                        }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(r._id, r.category)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete"
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
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {modal.isEdit ? `Edit Rule: ${modal.data.category}` : "Add Category Shipping Rule"}
              </h3>
              <button
                type="button"
                onClick={() => setModal({ open: false, isEdit: false, data: {} })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label>Target Category *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCategory(!customCategory);
                      setModal({
                        ...modal,
                        data: { ...modal.data, category: customCategory ? availableCategories[0] : "" }
                      });
                    }}
                    className="text-[10px] text-pink-600 hover:underline cursor-pointer"
                  >
                    {customCategory ? "Select from list" : "+ Enter custom category"}
                  </button>
                </div>
                {customCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Heavy Appliances, Groceries"
                    value={modal.data.category || ""}
                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, category: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-pink-500 font-bold"
                  />
                ) : (
                  <select
                    value={modal.data.category || availableCategories[0]}
                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, category: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-pink-500 font-bold cursor-pointer"
                  >
                    {availableCategories.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Shipping Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="60"
                    value={modal.data.shippingFee !== undefined ? modal.data.shippingFee : 60}
                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, shippingFee: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1">Free Delivery Above (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="1000"
                    value={modal.data.freeDeliveryAbove !== undefined ? modal.data.freeDeliveryAbove : 1000}
                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, freeDeliveryAbove: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Estimated Delivery Time</label>
                <input
                  type="text"
                  placeholder="e.g. 2-3 Business Days"
                  value={modal.data.estimatedDays || ""}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, estimatedDays: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="deliveryActive"
                  checked={modal.data.isActive !== false}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, isActive: e.target.checked } })}
                  className="accent-pink-600 rounded cursor-pointer"
                />
                <label htmlFor="deliveryActive" className="cursor-pointer">
                  Is category par shipping charge ko turant LIVE (Active) karein
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setModal({ open: false, isEdit: false, data: {} })}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:opacity-95"
              >
                Save Shipping Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}