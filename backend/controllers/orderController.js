const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");
const jwt = require("jsonwebtoken");
const { queueMessage } = require("../services/queueService");
const whatsappService = require("../services/whatsappService");
const getAdminWhatsappPhone = require("../utils/getAdminWhatsappPhone");

const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString("en-IN")}`;

const getOrderPlacedMessage = ({ storeName, order, recipientName, isForAdmin = false }) => {
  const itemList = order.items
    .map((it) => `• ${it.name} (Qty: ${it.quantity}) - ${formatCurrency(it.total)}`)
    .join("\n");

  if (isForAdmin) {
    return (
      `🔔 *NEW ORDER RECEIVED - ${storeName.toUpperCase()}*\n\n` +
      `📦 *Order ID:* ${order.orderId}\n` +
      `👤 *Customer:* ${order.shippingDetails.name}\n` +
      `📞 *Phone:* ${order.shippingDetails.phone}\n` +
      `📍 *City:* ${order.shippingDetails.city} - ${order.shippingDetails.pincode}\n` +
      `💳 *Payment Mode:* ${order.paymentInfo.mode.toUpperCase()} (UTR: ${order.paymentInfo.utrNumber})\n\n` +
      `*Order Items:*\n${itemList}\n\n` +
      `💰 *Total Amount:* ${formatCurrency(order.pricing.totalPayable)}\n\n` +
      `Admin panel se order review karein.`
    );
  }

  return (
    `🎉 *ORDER CONFIRMED - ${storeName.toUpperCase()}*\n\n` +
    `Namaste *${recipientName}* ji,\n` +
    `Aapka order receive ho gaya hai.\n\n` +
    `📦 *Order ID:* ${order.orderId}\n\n` +
    `*Items:*\n${itemList}\n\n` +
    `💰 *Grand Total:* ${formatCurrency(order.pricing.totalPayable)}\n` +
    `🚚 *Address:* ${order.shippingDetails.address}, ${order.shippingDetails.city} (${order.shippingDetails.pincode})\n\n` +
    `Thank you for shopping with *${storeName}*!`
  );
};

const getStatusUpdateMessage = ({ storeName, order, newStatus }) => {
  return (
    `🚚 *ORDER STATUS UPDATE - ${storeName.toUpperCase()}*\n\n` +
    `Namaste *${order.shippingDetails.name}* ji,\n\n` +
    `Order *${order.orderId}* ka status update hua hai:\n` +
    `📍 *Status:* *${newStatus.toUpperCase()}*\n` +
    (order.notes ? `💬 *Note:* ${order.notes}\n` : "") +
    `\nTeam *${storeName}*`
  );
};

const getPaymentStatusUpdateMessage = ({ storeName, order, newPaymentStatus }) => {
  return (
    `💳 *PAYMENT STATUS UPDATE - ${storeName.toUpperCase()}*\n\n` +
    `Namaste *${order.shippingDetails.name}* ji,\n\n` +
    `Order *${order.orderId}* ka payment status update hua hai:\n` +
    `💳 *Status:* *${newPaymentStatus.toUpperCase()}*\n` +
    `🔢 *UTR:* ${order.paymentInfo.utrNumber || "N/A"}\n` +
    (order.notes ? `💬 *Note:* ${order.notes}\n` : "") +
    `\nTeam *${storeName}*`
  );
};

exports.createOrder = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { orderId, items, shippingDetails, paymentInfo, pricing, userId } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "Order items cannot be empty." });
    }

    let finalUserId = userId || null;
    if (!finalUserId) {
      const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "production_secure_multitenant_jwt_secret_key_2026");
          finalUserId = decoded.id;
        } catch (e) {}
      }
    }

    const formattedItems = items.map((it) => ({
      product: it.product || it.id || it._id,
      name: it.name,
      image: Array.isArray(it.images) && it.images.length > 0 ? it.images[0] : it.image,
      price: it.finalPrice || it.price,
      quantity: it.quantity || 1,
      total: (it.finalPrice || it.price) * (it.quantity || 1)
    }));

    const newOrder = await Order.create({
      tenant: tenantId,
      orderId,
      user: finalUserId,
      items: formattedItems,
      shippingDetails,
      paymentInfo: {
        mode: paymentInfo.mode,
        utrNumber: paymentInfo.utrNumber || "N/A",
        status: paymentInfo.mode === "cod" ? "Not Verified" : "Processing"
      },
      orderStatus: "Pending",
      pricing,
      stockDeducted: false
    });

    const settings = await SiteSettings.findOne({ tenant: tenantId });
    const storeName = settings?.navbar?.brandName || req.tenant.storeName || "KHASTORE";

    const dynamicAdminPhone = (await getAdminWhatsappPhone(tenantId)) || whatsappService.getConnectedAdminNumber();
    const customerPhone = newOrder.shippingDetails.phone;

    const customerMsg = getOrderPlacedMessage({
      storeName,
      order: newOrder,
      recipientName: newOrder.shippingDetails.name,
      isForAdmin: false
    });

    await queueMessage({
      tenantId,
      orderId: newOrder.orderId,
      recipientNumber: customerPhone,
      recipientType: "customer",
      triggerType: "order_placed",
      messageBody: customerMsg
    });

    if (dynamicAdminPhone) {
      const adminMsg = getOrderPlacedMessage({
        storeName,
        order: newOrder,
        recipientName: "Admin",
        isForAdmin: true
      });
      await queueMessage({
        tenantId,
        orderId: newOrder.orderId,
        recipientNumber: dynamicAdminPhone,
        recipientType: "admin",
        triggerType: "order_placed",
        messageBody: adminMsg
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email;
    const userPhone = req.user?.mobile || req.user?.phone;
    const { search, orderStatus, page = 1, limit = 5 } = req.query;

    let query = {
      tenant: tenantId,
      $or: [
        { user: userId },
        ...(userEmail ? [{ "shippingDetails.email": userEmail }] : []),
        ...(userPhone ? [{ "shippingDetails.phone": userPhone }] : [])
      ]
    };

    if (orderStatus && orderStatus !== "All") query.orderStatus = orderStatus;

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$and = [{
        $or: [
          { orderId: regex },
          { "items.name": regex },
          { "paymentInfo.utrNumber": regex }
        ]
      }];
    }

    const currentPage = Number(page);
    const perPage = Number(limit);
    const skip = (currentPage - 1) * perPage;

    const [orders, totalOrders] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      Order.countDocuments(query)
    ]);

    const [deliveredCount, pendingCount] = await Promise.all([
      Order.countDocuments({ ...query, orderStatus: "Delivered" }),
      Order.countDocuments({ ...query, orderStatus: { $in: ["Pending", "Processing", "Shipped"] } })
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / perPage) || 1,
        currentPage,
        limit: perPage
      },
      stats: {
        totalOrders,
        pendingOrders: pendingCount,
        deliveredOrders: deliveredCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { orderStatus, paymentStatus, notes } = req.body;
    const order = await Order.findOne({ _id: req.params.id, tenant: tenantId });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const previousOrderStatus = order.orderStatus;
    const previousPaymentStatus = order.paymentInfo?.status;

    // Stock deduction logic upon verification
    if (paymentStatus === "Verified" && !order.stockDeducted) {
      for (const item of order.items) {
        const prod = await Product.findOne({ _id: item.product, tenant: tenantId });
        if (!prod) {
          return res.status(404).json({ success: false, message: `Product "${item.name}" nahi mila.` });
        }
        if (prod.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Product "${prod.name}" me sirf ${prod.stock} bache hain.`
          });
        }
      }

      for (const item of order.items) {
        await Product.findOneAndUpdate(
          { _id: item.product, tenant: tenantId },
          { $inc: { stock: -item.quantity } }
        );
      }
      order.stockDeducted = true;
    }

    const isCancelledOrRejected =
      orderStatus === "Cancelled" || paymentStatus === "Rejected" || paymentStatus === "Cancelled";

    if (isCancelledOrRejected && order.stockDeducted) {
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          { _id: item.product, tenant: tenantId },
          { $inc: { stock: item.quantity } }
        );
      }
      order.stockDeducted = false;
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentInfo.status = paymentStatus;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    const settings = await SiteSettings.findOne({ tenant: tenantId });
    const storeName = settings?.navbar?.brandName || req.tenant.storeName || "KHASTORE";

    if (orderStatus && orderStatus !== previousOrderStatus) {
      const statusMsg = getStatusUpdateMessage({ storeName, order, newStatus: orderStatus });
      await queueMessage({
        tenantId,
        orderId: order.orderId,
        recipientNumber: order.shippingDetails.phone,
        recipientType: "customer",
        triggerType: "status_updated",
        messageBody: statusMsg
      });
    }

    if (paymentStatus && paymentStatus !== previousPaymentStatus) {
      const paymentMsg = getPaymentStatusUpdateMessage({ storeName, order, newPaymentStatus: paymentStatus });
      await queueMessage({
        tenantId,
        orderId: order.orderId,
        recipientNumber: order.shippingDetails.phone,
        recipientType: "customer",
        triggerType: "payment_verified",
        messageBody: paymentMsg
      });
    }

    res.status(200).json({ success: true, message: "Order updated successfully.", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { search, orderStatus, paymentStatus, paymentMode, page = 1, limit = 10 } = req.query;

    let query = { tenant: tenantId };

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { orderId: regex },
        { "shippingDetails.name": regex },
        { "shippingDetails.phone": regex },
        { "shippingDetails.email": regex },
        { "paymentInfo.utrNumber": regex }
      ];
    }

    if (orderStatus && orderStatus !== "All") query.orderStatus = orderStatus;
    if (paymentStatus && paymentStatus !== "All") query["paymentInfo.status"] = paymentStatus;
    if (paymentMode && paymentMode !== "All") query["paymentInfo.mode"] = paymentMode;

    const currentPage = Number(page);
    const perPage = Number(limit);
    const skip = (currentPage - 1) * perPage;

    const [orders, totalOrders] = await Promise.all([
      Order.find(query).populate("user", "name email").sort({ createdAt: -1 }).skip(skip).limit(perPage),
      Order.countDocuments(query)
    ]);

    const [totalRevenueData, pendingOrdersCount, deliveredOrdersCount] = await Promise.all([
      Order.aggregate([
        { $match: { tenant: tenantId, "paymentInfo.status": "Verified" } },
        { $group: { _id: null, total: { $sum: "$pricing.totalPayable" } } }
      ]),
      Order.countDocuments({ tenant: tenantId, orderStatus: "Pending" }),
      Order.countDocuments({ tenant: tenantId, orderStatus: "Delivered" })
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / perPage) || 1,
        currentPage,
        limit: perPage
      },
      stats: {
        totalOrders,
        totalRevenue: totalRevenueData[0]?.total || 0,
        pendingOrders: pendingOrdersCount,
        deliveredOrders: deliveredOrdersCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const order = await Order.findOne({ _id: req.params.id, tenant: tenantId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.stockDeducted) {
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          { _id: item.product, tenant: tenantId },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    await Order.findOneAndDelete({ _id: req.params.id, tenant: tenantId });
    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};