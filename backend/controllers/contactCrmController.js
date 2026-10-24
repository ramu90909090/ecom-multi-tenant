const ContactQuery = require("../models/ContactQuery");

// 1. Submit Public Ticket Query (Tenant Scoped)
exports.submitQuery = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = await ContactQuery.create({
      tenant: tenantId,
      ...req.body
    });
    return res.status(201).json({
      success: true,
      message: "Ticket created successfully. Our team will contact you shortly.",
      data: query
    });
  } catch (error) {
    console.error("submitQuery Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Tickets (Search, Filter, Limits 10,25,50,100 & Pagination)
exports.getAllQueries = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    let filter = tenantId ? { tenant: tenantId } : {};

    const {
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt-desc"
    } = req.query;

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { subject: regex },
        { message: regex }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * perPage;

    const [queries, totalQueries, pendingCount, inProgressCount, resolvedCount] =
      await Promise.all([
        ContactQuery.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(perPage),
        ContactQuery.countDocuments(filter),
        ContactQuery.countDocuments({ ...filter, status: "Pending" }),
        ContactQuery.countDocuments({ ...filter, status: "In Progress" }),
        ContactQuery.countDocuments({ ...filter, status: { $in: ["Resolved", "Closed"] } })
      ]);

    const totalPages = Math.ceil(totalQueries / perPage) || 1;

    return res.status(200).json({
      success: true,
      count: queries.length,
      data: queries,
      pagination: {
        total: totalQueries,
        page: currentPage,
        limit: perPage,
        totalPages
      },
      stats: {
        total: totalQueries,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      }
    });
  } catch (error) {
    console.error("getAllQueries Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update Status & Admin Internal Notes
exports.updateQueryStatus = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { status, adminNotes } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === "Resolved" || status === "Closed") {
        updateData.resolvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const queryFilter = { _id: req.params.id };
    if (tenantId) queryFilter.tenant = tenantId;

    const query = await ContactQuery.findOneAndUpdate(queryFilter, updateData, { new: true });
    if (!query) return res.status(404).json({ success: false, message: "Ticket nahi mila." });

    return res.status(200).json({
      success: true,
      message: "Ticket status safaltapoorvak update ho gaya!",
      data: query
    });
  } catch (error) {
    console.error("updateQueryStatus Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete Single Ticket
exports.deleteQuery = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const queryFilter = { _id: req.params.id };
    if (tenantId) queryFilter.tenant = tenantId;

    const query = await ContactQuery.findOneAndDelete(queryFilter);
    if (!query) return res.status(404).json({ success: false, message: "Ticket nahi mila." });

    return res.status(200).json({
      success: true,
      message: "Ticket safaltapoorvak delete ho gaya."
    });
  } catch (error) {
    console.error("deleteQuery Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Bulk Delete Tickets (Multiple IDs or All Closed)
exports.bulkDeleteQueries = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { ticketIds, deleteAllClosed } = req.body;

    let deleteFilter = {};
    if (tenantId) deleteFilter.tenant = tenantId;

    if (deleteAllClosed) {
      deleteFilter.status = { $in: ["Closed", "Resolved"] };
    } else if (Array.isArray(ticketIds) && ticketIds.length > 0) {
      deleteFilter._id = { $in: ticketIds };
    } else {
      return res.status(400).json({
        success: false,
        message: "Delete karne ke liye ticket IDs specify karein."
      });
    }

    const result = await ContactQuery.deleteMany(deleteFilter);

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} tickets safaltapoorvak delete kar diye gaye!`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("bulkDeleteQueries Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};