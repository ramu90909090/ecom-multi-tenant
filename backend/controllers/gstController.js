const GstConfig = require("../models/GstConfig");

// 1. GET ALL GST RULES (Admin Studio)
exports.getAllGstRules = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const filter = tenantId ? { tenant: tenantId } : {};
    const rules = await GstConfig.find(filter).sort({ category: 1 });
    return res.status(200).json({ success: true, data: rules });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. CREATE NEW GST RULE (Admin)
exports.createGstRule = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { category, gstRate, hsnCode, description, isActive } = req.body;

    if (!category || gstRate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Category aur GST rate (%) anivarya hain."
      });
    }

    const cleanCategory = category.trim();
    const query = { category: cleanCategory };
    if (tenantId) query.tenant = tenantId;

    const existing = await GstConfig.findOne(query);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category '${cleanCategory}' ke liye GST rule pehle se exist karta hai.`
      });
    }

    const newRule = await GstConfig.create({
      tenant: tenantId || null,
      category: cleanCategory,
      gstRate: Number(gstRate),
      hsnCode: hsnCode ? hsnCode.trim() : "",
      description: description ? description.trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({
      success: true,
      message: `${cleanCategory} ke liye GST rule create ho gaya!`,
      data: newRule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. UPDATE GST RULE (Admin)
exports.updateGstRule = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const rule = await GstConfig.findOne(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: "GST rule nahi mila." });
    }

    if (req.body.category) rule.category = req.body.category.trim();
    if (req.body.gstRate !== undefined) rule.gstRate = Number(req.body.gstRate);
    if (req.body.hsnCode !== undefined) rule.hsnCode = req.body.hsnCode.trim();
    if (req.body.description !== undefined) rule.description = req.body.description.trim();
    if (req.body.isActive !== undefined) rule.isActive = Boolean(req.body.isActive);

    await rule.save();
    return res.status(200).json({ success: true, message: "GST rule update ho gaya!", data: rule });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. TOGGLE STATUS (Live/Inactive)
exports.toggleGstStatus = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const rule = await GstConfig.findOne(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: "GST rule nahi mila." });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    return res.status(200).json({
      success: true,
      message: `GST rule ab ${rule.isActive ? "ACTIVE (Tax Lagu) ✅" : "INACTIVE (Tax Hata Diya) ⏸️"} hai.`,
      data: rule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. DELETE GST RULE (Admin)
exports.deleteGstRule = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const rule = await GstConfig.findOneAndDelete(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: "GST rule nahi mila." });
    }

    return res.status(200).json({ success: true, message: "GST rule delete ho gaya." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. CALCULATE HIGHEST DYNAMIC GST FOR CHECKOUT (Payment Page Endpoint)
exports.calculateCartGst = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { items, subtotal } = req.body;

    const cartSubtotal = Number(subtotal) || 0;
    if (!Array.isArray(items) || items.length === 0 || cartSubtotal <= 0) {
      return res.status(200).json({
        success: true,
        data: { gstRate: 0, gstAmount: 0, appliedCategory: null, activeRulesCount: 0 }
      });
    }

    // Cart me se saari unique categories nikaalo
    const uniqueCategories = [
      ...new Set(
        items
          .map((it) => (it.category ? it.category.trim() : ""))
          .filter(Boolean)
      )
    ];

    const query = { isActive: true };
    if (tenantId) query.tenant = tenantId;

    // Sirf Active GST rules fetch karo
    const activeRules = await GstConfig.find(query);

    let highestRate = 0;
    let selectedCategory = null;

    // Sabhi active categories me se highest rate find karo
    uniqueCategories.forEach((cat) => {
      const matched = activeRules.find(
        (r) => r.category.toLowerCase() === cat.toLowerCase()
      );
      if (matched && matched.gstRate > highestRate) {
        highestRate = matched.gstRate;
        selectedCategory = matched.category;
      }
    });

    const gstAmount = Math.round((cartSubtotal * highestRate) / 100);

    return res.status(200).json({
      success: true,
      data: {
        gstRate: highestRate,
        gstAmount,
        appliedCategory: selectedCategory,
        ruleApplied: highestRate > 0 ? `Highest Active Category GST (${highestRate}%) Applied` : "No GST Active"
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};