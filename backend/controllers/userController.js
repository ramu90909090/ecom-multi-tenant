const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.getAllUsers = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { search, role, isVerified, page = 1, limit = 10 } = req.query;

    let query = { tenant: tenantId };

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ name: regex }, { email: regex }, { mobile: regex }, { district: regex }];
    }

    if (role && role !== "All") query.role = role;
    if (isVerified && isVerified !== "All") query.isVerified = isVerified === "true";

    const currentPage = Number(page);
    const perPage = Number(limit);
    const skip = (currentPage - 1) * perPage;

    const [users, totalUsers] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(perPage),
      User.countDocuments(query)
    ]);

    const [totalAdmins, totalCustomers, verifiedCount] = await Promise.all([
      User.countDocuments({ tenant: tenantId, role: "admin" }),
      User.countDocuments({ tenant: tenantId, role: "user" }),
      User.countDocuments({ tenant: tenantId, isVerified: true })
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / perPage) || 1,
        currentPage,
        limit: perPage
      },
      stats: {
        totalUsers,
        totalAdmins,
        totalCustomers,
        verifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { name, email, mobile, password, role, isVerified, address, district, state, pincode } = req.body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: "Email aur password anivarya hain." });
    }

    const exists = await User.findOne({ tenant: tenantId, email: cleanEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: "Yeh email pehle se registered hai." });
    }

    const newUser = await User.create({
      tenant: tenantId,
      name,
      email: cleanEmail,
      mobile: mobile || "N/A",
      password,
      role: role || "user",
      isVerified: isVerified === true || isVerified === "true",
      address: address || "",
      district: district || "",
      state: state || "Uttar Pradesh",
      pincode: pincode || ""
    });

    res.status(201).json({
      success: true,
      message: "User successfully create ho gaya!",
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { name, mobile, role, isVerified, address, district, state, pincode, password } = req.body;

    let updateFields = {
      name,
      mobile,
      role,
      isVerified: isVerified === true || isVerified === "true",
      address,
      district,
      state,
      pincode
    };

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id, tenant: tenantId },
      updateFields,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User nahi mila." });

    res.status(200).json({
      success: true,
      message: "User details update ho gayi!",
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const user = await User.findOne({ _id: req.params.id, tenant: tenantId });
    if (!user) return res.status(404).json({ success: false, message: "User nahi mila." });

    if (req.user && req.user._id?.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, message: "Aap apna khud ka account delete nahi kar sakte." });
    }

    await User.findOneAndDelete({ _id: req.params.id, tenant: tenantId });
    res.status(200).json({ success: true, message: "User account delete ho gaya." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};