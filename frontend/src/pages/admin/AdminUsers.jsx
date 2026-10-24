import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Key,
  Mail,
  Phone,
  MapPin,
  CheckCircle2
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");

  // Pagination (10, 25, 50, 100)
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalCustomers: 0,
    verifiedCount: 0
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "user",
    isVerified: true,
    address: "",
    district: "",
    state: "Uttar Pradesh",
    pincode: ""
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (roleFilter !== "All") params.append("role", roleFilter);
      if (verifiedFilter !== "All") params.append("isVerified", verifiedFilter);
      params.append("page", currentPage);
      params.append("limit", limit);

      const res = await API.get(`/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
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
  }, [currentPage, limit, roleFilter, verifiedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      mobile: "",
      password: "",
      role: "user",
      isVerified: true,
      address: "",
      district: "",
      state: "Uttar Pradesh",
      pincode: ""
    });
    setModalError("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || "",
      email: u.email || "",
      mobile: u.mobile || "",
      password: "", // blank rakhne par purana password change nahi hoga
      role: u.role || "user",
      isVerified: u.isVerified !== undefined ? u.isVerified : true,
      address: u.address || "",
      district: u.district || "",
      state: u.state || "Uttar Pradesh",
      pincode: u.pincode || ""
    });
    setModalError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    try {
      if (editingUser) {
        await API.put(`/users/${editingUser._id}`, formData);
        alert("✅ User details safaltapoorvak update ho gayi!");
      } else {
        await API.post("/users", formData);
        alert("✅ Naya User create ho gaya!");
      }
      setModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || "Failed to save user.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Kya aap sach me user '${name}' ko delete karna chahte hain?`)) {
      try {
        const res = await API.delete(`/users/${id}`);
        alert(res.data?.message || "User delete ho gaya!");
        fetchUsers();
      } catch (err) {
        alert(`❌ Delete failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            User Accounts & Permissions
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Manage customer accounts, promote managers, and monitor verified logins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Users</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Verified Accounts</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.verifiedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Customers</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalCustomers}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Admin Staff</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalAdmins}</h3>
          </div>
        </div>
      </div>

      {/* 3. Search & Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Name, Email, or Mobile..."
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

          {/* Role Filter */}
          <div className="md:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="user">User (Customer)</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Verification Filter */}
          <div className="md:col-span-2">
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {/* Limit: 10, 25, 50, 100 */}
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
      </div>

      {/* 4. Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Mobile & Location</th>
                <th className="p-4">Role</th>
                <th className="p-4">Verification</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 font-bold">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 font-bold">
                    Koi user match nahi hua. Search reset karein.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white font-black text-sm flex items-center justify-center shrink-0 uppercase shadow-sm">
                        {u.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400 font-semibold">{u.email}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{u.mobile || "N/A"}</p>
                      <p className="text-[10px] text-slate-400">
                        {u.district || u.city || "India"} {u.pincode ? `(${u.pincode})` : ""}
                      </p>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : u.role === "manager"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.isVerified
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isVerified ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {u.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>

                    <td className="p-4 text-[11px] text-slate-500 font-semibold">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium"
                      })}
                    </td>

                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-500">
            Showing <b className="text-slate-800">{users.length}</b> of{" "}
            <b className="text-slate-800">{pagination.total}</b> users • Page{" "}
            <b className="text-slate-800">{pagination.page}</b> of{" "}
            <b className="text-slate-800">{pagination.totalPages}</b>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-4 py-1.5 text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl">
              {currentPage} / {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

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

      {/* 6. Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-xl w-full my-auto max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingUser ? `Edit User: ${editingUser.name}` : "Create New User Account"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">
                    {editingUser ? "New Password (Optional)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? "Leave blank to keep same" : "Min 6 characters"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1">Role Permission *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 bg-white outline-none cursor-pointer"
                  >
                    <option value="user">User (Normal Customer)</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Account Verified</label>
                  <select
                    value={formData.isVerified}
                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.value === "true" })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 bg-white outline-none cursor-pointer"
                  >
                    <option value="true">Verified (Active)</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">District / City</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
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