const Coupon = require("../models/Coupon");

// ==========================================
// 1. GET ALL COUPONS (Admin Studio)
// ==========================================
exports.getAllCoupons = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const filter = tenantId ? { tenant: tenantId } : {};

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. CREATE NEW COUPON (Admin)
// ==========================================
exports.createCoupon = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      applicableCategory,
      expiryDate,
      usageLimit,
      isActive
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({
        success: false,
        message: "Coupon Code aur Discount Value anivarya hain."
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code in this store/tenant
    const query = { code: cleanCode };
    if (tenantId) query.tenant = tenantId;

    const existing = await Coupon.findOne(query);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${cleanCode}' pehle se exist karta hai.`
      });
    }

    const newCoupon = await Coupon.create({
      tenant: tenantId || null,
      code: cleanCode,
      description: description || "",
      discountType: discountType || "percentage",
      discountValue: Number(discountValue),
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      applicableCategory: applicableCategory || "All",
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usageLimit: Number(usageLimit) || 0,
      usedCount: 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({
      success: true,
      message: `Coupon '${cleanCode}' safaltapoorvak create ho gaya!`,
      data: newCoupon
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. UPDATE COUPON (Admin)
// ==========================================
exports.updateCoupon = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const coupon = await Coupon.findOne(query);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon nahi mila." });
    }

    if (req.body.code) coupon.code = req.body.code.trim().toUpperCase();
    if (req.body.description !== undefined) coupon.description = req.body.description;
    if (req.body.discountType) coupon.discountType = req.body.discountType;
    if (req.body.discountValue !== undefined) coupon.discountValue = Number(req.body.discountValue);
    if (req.body.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = Number(req.body.maxDiscountAmount);
    if (req.body.minOrderAmount !== undefined) coupon.minOrderAmount = Number(req.body.minOrderAmount);
    if (req.body.applicableCategory) coupon.applicableCategory = req.body.applicableCategory;
    if (req.body.expiryDate !== undefined) coupon.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;
    if (req.body.usageLimit !== undefined) coupon.usageLimit = Number(req.body.usageLimit);
    if (req.body.isActive !== undefined) coupon.isActive = Boolean(req.body.isActive);

    await coupon.save();
    return res.status(200).json({ success: true, message: "Coupon update ho gaya!", data: coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. TOGGLE LIVE / INACTIVE STATUS (Admin)
// ==========================================
exports.toggleCouponStatus = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const coupon = await Coupon.findOne(query);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon nahi mila." });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ab ${coupon.isActive ? "LIVE (Active) ✅" : "INACTIVE (Disabled) ⏸️"} hai.`,
      data: coupon
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. DELETE COUPON (Admin)
// ==========================================
exports.deleteCoupon = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const coupon = await Coupon.findOneAndDelete(query);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon nahi mila." });
    }

    return res.status(200).json({ success: true, message: "Coupon delete kar diya gaya." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 6. VALIDATE COUPON FOR PAYMENT PAGE (Category-Wise + Dual Payload Check)
// =========================================================================
exports.validateCoupon = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { code, items, totalAmount, cartSubtotal } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        message: "Kripya coupon code enter karein."
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const query = { code: cleanCode };
    if (tenantId) query.tenant = tenantId;

    const coupon = await Coupon.findOne(query);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon code galat hai ya exist nahi karta."
      });
    }

    // Check 1: Active Status
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Yeh coupon abhi disabled/inactive hai."
      });
    }

    // Check 2: Expiry Date
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Yeh coupon expire ho chuka hai."
      });
    }

    // Check 3: Usage Limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Is coupon ki maximum redemption limit poori ho chuki hai."
      });
    }

    // Safe Numeric Total (Dono key formats 'totalAmount' aur 'cartSubtotal' support karta hai)
    const effectiveTotal = Number(totalAmount !== undefined ? totalAmount : cartSubtotal) || 0;
    const minOrder = Number(coupon.minOrderAmount || coupon.minPurchaseAmount || 0);

    // Check 4: Minimum Order Value Check
    if (minOrder > 0 && effectiveTotal < minOrder) {
      return res.status(400).json({
        success: false,
        message: `Is coupon ko use karne ke liye kam se kam ₹${minOrder.toLocaleString()} ka order hona zaroori hai.`
      });
    }

    // Check 5: Category-Wise Verification
    let eligibleSubtotal = effectiveTotal;
    const targetCat = coupon.applicableCategory;

    if (Array.isArray(items) && items.length > 0) {
      if (targetCat && targetCat.toLowerCase() !== "all") {
        const matchingItems = items.filter(
          (it) => it.category && it.category.toLowerCase() === targetCat.toLowerCase()
        );

        if (matchingItems.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Yeh coupon sirf '${targetCat}' category ke products par lagu hota hai.`
          });
        }

        eligibleSubtotal = matchingItems.reduce((acc, it) => {
          const itemPrice = Number(it.finalPrice || it.price || 0);
          const itemQty = Number(it.quantity || 1);
          return acc + itemPrice * itemQty;
        }, 0);
      } else {
        eligibleSubtotal = items.reduce((acc, it) => {
          const itemPrice = Number(it.finalPrice || it.price || 0);
          const itemQty = Number(it.quantity || 1);
          return acc + itemPrice * itemQty;
        }, 0);
      }
    }

    // Check 6: Dynamic Discount Calculation
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((eligibleSubtotal * Number(coupon.discountValue)) / 100);
      const maxCap = Number(coupon.maxDiscountAmount || 0);
      if (maxCap > 0 && discount > maxCap) {
        discount = maxCap;
      }
    } else {
      // Flat Discount
      discount = Math.min(Number(coupon.discountValue || 0), eligibleSubtotal);
    }

    // Discount total se zyada na ho
    if (discount > effectiveTotal) {
      discount = effectiveTotal;
    }

    return res.status(200).json({
      success: true,
      message: `🎉 Coupon '${coupon.code}' applied! Saved ₹${discount.toLocaleString()}`,
      data: {
        code: coupon.code,
        discountAmount: discount,
        applicableCategory: coupon.applicableCategory || "All",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: minOrder
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};