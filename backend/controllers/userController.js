const User = require("../models/User");
const bcrypt = require("bcryptjs");

// =========================================================================
// 1. GET ALL USERS (Search, Filters, Pagination & Analytics)
// =========================================================================
exports.getAllUsers = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    let query = tenantId ? { store: tenantId } : {};

    const {
      search,
      role,
      isVerified,
      page = 1,
      limit = 10,
      sortBy = "createdAt-desc"
    } = req.query;

    // Search by Name, Email, or Mobile
    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ name: regex }, { email: regex }, { mobile: regex }];
    }

    // Role filter
    if (role && role !== "All") {
      query.role = role;
    }

    // Verification filter
    if (isVerified && isVerified !== "All") {
      query.isVerified = isVerified === "true";
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else if (sortBy === "name-asc") sortOptions = { name: 1 };
    else if (sortBy === "name-desc") sortOptions = { name: -1 };

    // Pagination
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * perPage;

    const [users, totalUsers, totalAdmins, totalCustomers, verifiedCount] =
      await Promise.all([
        User.find(query)
          .select("-password")
          .sort(sortOptions)
          .skip(skip)
          .limit(perPage),
        User.countDocuments(query),
        User.countDocuments({ ...query, role: "admin" }),
        User.countDocuments({ ...query, role: "user" }),
        User.countDocuments({ ...query, isVerified: true })
      ]);

    const totalPages = Math.ceil(totalUsers / perPage) || 1;

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
      pagination: {
        total: totalUsers,
        page: currentPage,
        limit: perPage,
        totalPages
      },
      stats: {
        totalUsers,
        totalAdmins,
        totalCustomers,
        verifiedCount
      }
    });
  } catch (error) {
    console.error("getAllUsers Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 2. CREATE USER (Admin Manual Onboarding)
// =========================================================================
exports.createUser = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const {
      name,
      email,
      mobile,
      password,
      role = "user",
      isVerified = true,
      address,
      district,
      state = "Uttar Pradesh",
      pincode
    } = req.body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email aur Password mandatory hain."
      });
    }

    // Check existing in this tenant
    const query = { email: cleanEmail };
    if (tenantId) query.store = tenantId;

    const exists = await User.findOne(query);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Yeh email pehle se store me registered hai."
      });
    }

    const newUser = await User.create({
      store: tenantId,
      name: name ? String(name).trim() : "Store User",
      email: cleanEmail,
      mobile: mobile ? String(mobile).trim() : "N/A",
      password,
      role,
      isVerified: Boolean(isVerified),
      address: address || "",
      district: district || "",
      state: state || "Uttar Pradesh",
      pincode: pincode || ""
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: "Naya user safaltapoorvak create ho gaya!",
      data: userObj
    });
  } catch (error) {
    console.error("createUser Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "User create karne me problem aayi."
    });
  }
};

// =========================================================================
// 3. UPDATE USER (Edit Profile, Change Role & Optional Password)
// =========================================================================
exports.updateUser = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const {
      name,
      mobile,
      role,
      isVerified,
      address,
      district,
      state,
      pincode,
      password
    } = req.body;

    const query = { _id: req.params.id };
    if (tenantId) query.store = tenantId;

    let updateFields = {
      name: name ? String(name).trim() : undefined,
      mobile: mobile ? String(mobile).trim() : undefined,
      role: role || undefined,
      isVerified: isVerified !== undefined ? Boolean(isVerified) : undefined,
      address: address !== undefined ? address : undefined,
      district: district !== undefined ? district : undefined,
      state: state !== undefined ? state : undefined,
      pincode: pincode !== undefined ? pincode : undefined
    };

    // Agar Admin ne password change karne ka input diya ho
    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }

    // Clean undefined fields
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const updatedUser = await User.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User account nahi mila."
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details update ho gayi!",
      data: updatedUser
    });
  } catch (error) {
    console.error("updateUser Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 4. DELETE USER (With Self-Delete Protection)
// =========================================================================
exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.store = tenantId;

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account nahi mila."
      });
    }

    // Security: Logged-in admin khud apna account delete na kare
    const currentAdminId = req.user?._id || req.user?.id;
    if (currentAdminId && currentAdminId.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Aap apna khud ka admin account delete nahi kar sakte."
      });
    }

    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: `User '${user.name}' safaltapoorvak delete ho gaya!`
    });
  } catch (error) {
    console.error("deleteUser Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};