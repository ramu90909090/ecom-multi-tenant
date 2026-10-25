import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Trash2,
  Edit3,
  Send,
  MessageCircle,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Lock,
  Smartphone
} from "lucide-react";
import API from "../../api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, customerCount: 0, verifiedCount: 0 });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [userModal, setUserModal] = useState({ open: false, isEdit: false, data: {} });
  const [broadcastModal, setBroadcastModal] = useState({ open: false, user: null, subject: "", messageText: "" });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      if (search.trim()) params.append("search", search.trim());
      if (roleFilter !== "All") params.append("role", roleFilter);
      if (verifiedFilter !== "All") params.append("isVerified", verifiedFilter);

      const res = await API.get(`/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, roleFilter, verifiedFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Save / Edit User
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (userModal.isEdit) {
        await API.put(`/users/${userModal.data._id}`, userModal.data);
        alert("✅ User details update ho gayi aur notification send kar diya gaya!");
      } else {
        await API.post("/users", userModal.data);
        alert("✅ Naya user create ho gaya aur welcome alert bhej diya gaya!");
      }
      setUserModal({ open: false, isEdit: false, data: {} });
      fetchUsers();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Kya aap sach me user "${name}" ko delete karna chahte hain?`)) return;
    try {
      await API.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert("Delete Error: " + (err.response?.data?.message || err.message));
    }
  };

  // Handle Custom Dual Broadcast (WhatsApp + Email)
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastModal.messageText.trim()) return;

    try {
      setSendingBroadcast(true);
      const res = await API.post("/users/send-custom-notification", {
        userId: broadcastModal.user._id,
        subject: broadcastModal.subject,
        messageText: broadcastModal.messageText
      });
      alert(res.data?.message || "Message dispatched successfully!");
      setBroadcastModal({ open: false, user: null, subject: "", messageText: "" });
    } catch (err) {
      alert("Dispatch failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer & User Administration
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Multi-tenant user directory, security profile controls aur dual WhatsApp-Email notifications
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() =>
              setUserModal({
                open: true,
                isEdit: false,
                data: { name: "", email: "", mobile: "", password: "", role: "user", isVerified: true }
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Total Tenant Users</span>
            <p className="text-lg font-black text-slate-900">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Verified Accounts</span>
            <p className="text-lg font-black text-emerald-600">{stats.verifiedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Shoppers / Customers</span>
            <p className="text-lg font-black text-violet-600">{stats.customerCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Store Admins</span>
            <p className="text-lg font-black text-amber-600">{stats.adminCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search, Filters & Limits */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Name, Email, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="user">Customers (User)</option>
            <option value="admin">Administrators (Admin)</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified / Suspended</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="font-bold text-slate-400">Show:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl font-black text-slate-800 outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* 4. Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-bold text-[11px]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created On</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400 font-bold">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400 font-bold">
                    Koi user nahi mila.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <span className="text-[11px] text-slate-400 font-normal">{u.email}</span>
                    </td>

                    <td className="p-4 font-mono font-bold text-indigo-600">
                      {u.mobile || "N/A"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          u.role === "admin"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-slate-400 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium"
                      })}
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Direct Custom Notification Button */}
                      <button
                        onClick={() =>
                          setBroadcastModal({
                            open: true,
                            user: u,
                            subject: "",
                            messageText: ""
                          })
                        }
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                        title="Send Direct WhatsApp & Email Notification"
                      >
                        <Send className="w-4 h-4 inline" />
                      </button>

                      {/* Edit User Button */}
                      <button
                        onClick={() =>
                          setUserModal({
                            open: true,
                            isEdit: true,
                            data: {
                              _id: u._id,
                              name: u.name,
                              email: u.email,
                              mobile: u.mobile || "",
                              role: u.role,
                              isVerified: u.isVerified,
                              newPassword: ""
                            }
                          })
                        }
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4 inline" />
                      </button>

                      {/* Delete User Button */}
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete User"
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

        {/* 5. Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Page <b>{page}</b> of <b>{totalPages}</b>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT USER                                              */}
      {/* ========================================================================= */}
      {userModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveUser}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {userModal.isEdit ? `Edit User: ${userModal.data.name}` : "Create New User"}
              </h3>
              <button
                type="button"
                onClick={() => setUserModal({ open: false, isEdit: false, data: {} })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 font-bold text-slate-700">
              <div>
                <label className="block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={userModal.data.name || ""}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, name: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  disabled={userModal.isEdit}
                  value={userModal.data.email || ""}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block mb-1">Mobile / WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={userModal.data.mobile || ""}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, mobile: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Account Role</label>
                  <select
                    value={userModal.data.role || "user"}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, role: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    <option value="user">Customer (User)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Verification Status</label>
                  <select
                    value={userModal.data.isVerified ? "true" : "false"}
                    onChange={(e) =>
                      setUserModal({ ...userModal, data: { ...userModal.data, isVerified: e.target.value === "true" } })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    <option value="true">Verified (Active)</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">
                  {userModal.isEdit ? "Reset Password (Leave blank to keep unchanged)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!userModal.isEdit}
                  placeholder={userModal.isEdit ? "New password..." : "Strong password"}
                  value={userModal.isEdit ? userModal.data.newPassword || "" : userModal.data.password || ""}
                  onChange={(e) =>
                    userModal.isEdit
                      ? setUserModal({ ...userModal, data: { ...userModal.data, newPassword: e.target.value } })
                      : setUserModal({ ...userModal, data: { ...userModal.data, password: e.target.value } })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserModal({ open: false, isEdit: false, data: {} })}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {userModal.isEdit ? "Update & Notify" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIRECT CUSTOM BROADCAST (WHATSAPP + EMAIL EK SATH)              */}
      {/* ========================================================================= */}
      {broadcastModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSendBroadcast}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Send Direct Notification</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Recipient: <b>{broadcastModal.user?.name}</b> ({broadcastModal.user?.email} | {broadcastModal.user?.mobile || "No Mobile"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModal({ open: false, user: null, subject: "", messageText: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification channels preview */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp: {broadcastModal.user?.mobile ? "Active ✅" : "No Phone ❌"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Email: Active ✅</span>
              </div>
            </div>

            <div className="text-xs space-y-3 font-bold text-slate-700">
              <div>
                <label className="block mb-1">Message Subject / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Special Festive Discount for You / Account Update"
                  value={broadcastModal.subject}
                  onChange={(e) => setBroadcastModal({ ...broadcastModal, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block mb-1">Custom Message Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message here. Yeh message user ko WhatsApp aur Email dono par ek sath dispatch hoga..."
                  value={broadcastModal.messageText}
                  onChange={(e) => setBroadcastModal({ ...broadcastModal, messageText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-indigo-500 font-normal leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBroadcastModal({ open: false, user: null, subject: "", messageText: "" })}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingBroadcast}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingBroadcast ? "Dispatching..." : "Send to WhatsApp & Email"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}