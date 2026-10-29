const DeliveryConfig = require("../models/DeliveryConfig");

// 1. GET ALL DELIVERY RULES (Admin)
exports.getAllDeliveryRules = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const filter = tenantId ? { tenant: tenantId } : {};
    const rules = await DeliveryConfig.find(filter).sort({ category: 1 });
    return res.status(200).json({ success: true, data: rules });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. CREATE NEW DELIVERY RULE (Admin)
exports.createDeliveryRule = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { category, shippingFee, freeDeliveryAbove, estimatedDays, description, isActive } = req.body;

    if (!category || shippingFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Category aur Delivery Fee anivarya hain."
      });
    }

    const cleanCategory = category.trim();
    const query = { category: cleanCategory };
    if (tenantId) query.tenant = tenantId;

    const existing = await DeliveryConfig.findOne(query);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category '${cleanCategory}' ke liye delivery rule pehle se bana hua hai.`
      });
    }

    const newRule = await DeliveryConfig.create({
      tenant: tenantId || null,
      category: cleanCategory,
      shippingFee: Number(shippingFee),
      freeDeliveryAbove: Number(freeDeliveryAbove !== undefined ? freeDeliveryAbove : 1000),
      estimatedDays: estimatedDays ? estimatedDays.trim() : "2-4 Business Days",
      description: description ? description.trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({
      success: true,
      message: `${cleanCategory} ke liye delivery rule safalta-purvak create ho gaya!`,
      data: newRule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. UPDATE DELIVERY RULE (Admin)
exports.updateDeliveryRule = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const rule = await DeliveryConfig.findOne(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: "Delivery rule nahi mila." });
    }

    if (req.body.category) rule.category = req.body.category.trim();
    if (req.body.shippingFee !== undefined) rule.shippingFee = Number(req.body.shippingFee);
    if (req.body.freeDeliveryAbove !== undefined) rule.freeDeliveryAbove = Number(req.body.freeDeliveryAbove);
    if (req.body.estimatedDays !== undefined) rule.estimatedDays = req.body.estimatedDays.trim();
    if (req.body.description !== undefined) rule.description = req.body.description.trim();
    if (req.body.isActive !== undefined) rule.isActive = Boolean(req.body.isActive);

    await rule.save();
    return res.status(200).json({ success: true, message: "Delivery rule update ho gaya!", data: rule });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. TOGGLE STATUS (Active / Inactive)
exports.toggleDeliveryStatus = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const rule = await DeliveryConfig.findOne(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: "Delivery rule nahi mila." });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    return res.status(200).json({
      success: true,
      message: `Rule ab ${rule.isActive ? "ACTIVE (Delivery Charge Lagu) ✅" : "INACTIVE (Free / No Charge) ⏸️"} hai.`,
      data: rule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. DELETE DELIVERY RULE (Admin)
exports.deleteDeliveryRule = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const rule = await DeliveryConfig.findOneAndDelete(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: "Delivery rule nahi mila." });
    }

    return res.status(200).json({ success: true, message: "Delivery rule delete ho gaya." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. DYNAMIC DELIVERY FEE CALCULATION FOR PAYMENT PAGE
exports.calculateCartDelivery = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { items, subtotal } = req.body;
    const cartSubtotal = Number(subtotal) || 0;

    if (!Array.isArray(items) || items.length === 0 || cartSubtotal <= 0) {
      return res.status(200).json({
        success: true,
        data: { deliveryFee: 0, appliedCategory: null, freeThreshold: 0, isFree: true, ruleNote: "Cart Empty" }
      });
    }

    // Cart me se saari unique categories
    const uniqueCategories = [
      ...new Set(items.map((it) => (it.category ? it.category.trim() : "")).filter(Boolean))
    ];

    const query = { isActive: true };
    if (tenantId) query.tenant = tenantId;

    const activeRules = await DeliveryConfig.find(query);

    let selectedFee = 0;
    let selectedThreshold = 1000;
    let selectedCategory = null;
    let estimatedDays = "2-4 Days";

    // Cart categories me se highest active shipping fee rule select karna
    uniqueCategories.forEach((cat) => {
      const matched = activeRules.find((r) => r.category.toLowerCase() === cat.toLowerCase());
      if (matched && matched.shippingFee > selectedFee) {
        selectedFee = matched.shippingFee;
        selectedThreshold = matched.freeDeliveryAbove;
        selectedCategory = matched.category;
        estimatedDays = matched.estimatedDays;
      }
    });

    // Check agar subtotal free delivery threshold se upar hai
    const isFree = selectedFee === 0 || (selectedThreshold > 0 && cartSubtotal >= selectedThreshold);
    const finalFee = isFree ? 0 : selectedFee;

    return res.status(200).json({
      success: true,
      data: {
        deliveryFee: finalFee,
        originalFee: selectedFee,
        appliedCategory: selectedCategory,
        freeThreshold: selectedThreshold,
        estimatedDays,
        isFree,
        ruleNote: isFree
          ? `Free Express Delivery (Order ≥ ₹${selectedThreshold.toLocaleString()})`
          : `Standard Delivery Fee for ${selectedCategory || "Category"}`
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};