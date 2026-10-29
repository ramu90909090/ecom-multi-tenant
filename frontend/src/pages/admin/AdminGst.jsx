import React, { useState, useEffect } from "react";
import {
  Percent,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2
} from "lucide-react";
import API from "../../api/axios";

export default function AdminGst() {
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
  const [statusMsg, setStatusMsg] = useState("");

  // 1. Fetch GST Rules & Dynamic Product Categories
  const fetchGstData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/gst");
      if (res.data?.success) {
        setRules(res.data.data || []);
      }

      // Live products se actual categories fetch karein
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
      console.error("Fetch error:", err);
      setStatusMsg("Server endpoint not connected. Check backend routes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGstData();
  }, []);

  // 2. Toggle Status (Active / Inactive)
  const handleToggleStatus = async (id) => {
    try {
      const res = await API.patch(`/gst/${id}/toggle`);
      if (res.data?.success) {
        fetchGstData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Status toggle nahi ho saka.");
    }
  };

  // 3. Delete GST Rule
  const handleDelete = async (id, category) => {
    if (!window.confirm(`Kya aap category '${category}' ka GST rule delete karna chahte hain?`)) return;
    try {
      const res = await API.delete(`/gst/${id}`);
      if (res.data?.success) {
        fetchGstData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Delete fail ho gaya.");
    }
  };

  // 4. Save (Create or Update)
  const handleSaveRule = async (e) => {
    e.preventDefault();
    setStatusMsg("");

    const payload = {
      category: modal.data.category?.trim(),
      gstRate: Number(modal.data.gstRate),
      hsnCode: modal.data.hsnCode?.trim() || "",
      description: modal.data.description?.trim() || "",
      isActive: modal.data.isActive !== undefined ? Boolean(modal.data.isActive) : true
    };

    if (!payload.category || payload.gstRate === undefined || isNaN(payload.gstRate)) {
      alert("Category aur valid GST rate (%) daalna anivarya hai.");
      return;
    }

    try {
      let res;
      if (modal.isEdit) {
        res = await API.put(`/gst/${modal.data._id}`, payload);
      } else {
        res = await API.post("/gst", payload);
      }

      if (res.data?.success) {
        setModal({ open: false, isEdit: false, data: {} });
        setCustomCategory(false);
        fetchGstData();
      } else {
        alert(res.data?.message || "Save nahi ho saka.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Server endpoint not found. Kripya check karein ki server.js me app.use('/api/v1/gst', gstRoutes) mounted hai.");
    }
  };

  const activeCount = rules.filter((r) => r.isActive).length;
  const maxGst = rules.filter((r) => r.isActive).reduce((max, r) => Math.max(max, r.gstRate), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Percent className="w-6 h-6 text-pink-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Category GST Engine</h1>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Admin Controlled Category Tax: Active rule se tax calculate hoga, cart me highest active rule lagu hoga.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchGstData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh"
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
                  gstRate: 18,
                  hsnCode: "",
                  description: "",
                  isActive: true
                }
              });
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category GST</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
          {statusMsg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Defined Rules</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{rules.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Live (Active) Rules</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Peak Active GST</span>
          <p className="text-2xl font-black text-pink-600 mt-1">{maxGst}%</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-bold text-[11px]">
              <tr>
                <th className="p-4">Category</th>
                <th className="p-4">GST Rate (%)</th>
                <th className="p-4">HSN Code</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-bold">
                    Loading GST Rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-bold">
                    Koi GST rule nahi mila. 'Add Category GST' button se rule banayein.
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
                    <td className="p-4 font-mono font-black text-sm text-pink-600">{r.gstRate}%</td>
                    <td className="p-4 font-mono text-slate-500">{r.hsnCode || "-"}</td>
                    <td className="p-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {r.description || "N/A"}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(r._id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition ${
                          r.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-300"
                        }`}
                      >
                        {r.isActive ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                        <span>{r.isActive ? "Active (Tax Applied)" : "Inactive (0% Tax)"}</span>
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

      {/* Add / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveRule}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {modal.isEdit ? `Edit GST Rule: ${modal.data.category}` : "Add Category GST Rule"}
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
              {/* Category Dropdown & Custom Category Toggle */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block">Target Category *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCategory(!customCategory);
                      setModal({
                        ...modal,
                        data: {
                          ...modal.data,
                          category: customCategory ? availableCategories[0] : ""
                        }
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
                    placeholder="e.g. Beauty, Sports, Books"
                    value={modal.data.category || ""}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, category: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-pink-500 font-bold"
                  />
                ) : (
                  <select
                    value={modal.data.category || availableCategories[0]}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, category: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-pink-500 font-bold cursor-pointer"
                  >
                    {availableCategories.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Rate & HSN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">GST Rate (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="40"
                    placeholder="18"
                    value={modal.data.gstRate !== undefined ? modal.data.gstRate : 18}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, gstRate: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">HSN Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8517"
                    value={modal.data.hsnCode || ""}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, hsnCode: e.target.value } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Rule Note / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Standard GST for Electronics"
                  value={modal.data.description || ""}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, description: e.target.value } })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="ruleActive"
                  checked={modal.data.isActive !== false}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, isActive: e.target.checked } })
                  }
                  className="accent-pink-600 rounded cursor-pointer"
                />
                <label htmlFor="ruleActive" className="cursor-pointer">
                  Is category par GST ko turant LIVE (Active) karein
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
                Save GST Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}