const ContactQuery = require("../models/ContactQuery");

exports.submitQuery = async (req, res) => {
  try {
    const query = await ContactQuery.create({
      tenant: req.tenant._id,
      ...req.body
    });
    res.status(201).json({
      success: true,
      message: "Ticket created successfully.",
      data: query
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllQueries = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { status, search, page = 1, limit = 15 } = req.query;
    const filter = { tenant: tenantId };

    if (status && status !== "All") filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ];
    }

    const total = await ContactQuery.countDocuments(filter);
    const queries = await ContactQuery.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: queries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateQueryStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === "Resolved" || status === "Closed") {
        updateData.resolvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const query = await ContactQuery.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      updateData,
      { new: true }
    );
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });

    res.status(200).json({ success: true, message: "Status updated successfully", data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findOneAndDelete({ _id: req.params.id, tenant: req.tenant._id });
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });
    res.status(200).json({ success: true, message: "Query deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};