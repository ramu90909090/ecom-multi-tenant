const Product = require("../models/Product");

// ==========================================
// 1. CREATE PRODUCT (Tenant Scoped)
// ==========================================
exports.createProduct = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant store identify nahi ho saka. Request header me store slug missing hai."
      });
    }

    const {
      name,
      description,
      price,
      actualPrice,
      discount,
      category,
      stock,
      isTrending
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Product Name required hai." });
    }
    if (!price || isNaN(Number(price))) {
      return res.status(400).json({ success: false, message: "Valid Base Price enter karein." });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: "Category select karna zaroori hai." });
    }

    // Process Multer Uploaded Files
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (req.body.imageUrl && typeof req.body.imageUrl === "string") {
      imagePaths = [req.body.imageUrl.trim()];
    }

    if (imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kam se kam ek product image upload karein."
      });
    }

    const parsedPrice = Number(price);
    const parsedActualPrice = actualPrice ? Number(actualPrice) : parsedPrice;
    const parsedDiscount = discount ? Number(discount) : 0;
    const finalPrice =
      parsedDiscount > 0
        ? Math.round(parsedPrice - (parsedPrice * parsedDiscount) / 100)
        : parsedPrice;

    // Create Document
    const newProduct = await Product.create({
      tenant: tenantId,
      name: name.trim(),
      description: description ? description.trim() : "Genuine store product.",
      price: parsedPrice,
      actualPrice: parsedActualPrice,
      discount: parsedDiscount,
      finalPrice: finalPrice,
      category: category.trim(),
      stock: stock ? Number(stock) : 10,
      images: imagePaths, // Pure [String] array for schema compatibility
      image: imagePaths[0],
      isTrending: isTrending === "true" || isTrending === true
    });

    return res.status(201).json({
      success: true,
      message: "Product successfully add ho gaya!",
      data: newProduct
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Database validation failed while inserting product."
    });
  }
};

// ==========================================
// 2. GET ALL PRODUCTS
// ==========================================
exports.getAllProducts = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = tenantId ? { tenant: tenantId } : {};

    const { category, search, sortBy } = req.query;
    if (category && category !== "All") query.category = category;
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } }
      ];
    }

    let productsQuery = Product.find(query);

    if (sortBy === "price-low") productsQuery = productsQuery.sort({ price: 1 });
    else if (sortBy === "price-high") productsQuery = productsQuery.sort({ price: -1 });
    else if (sortBy === "discount") productsQuery = productsQuery.sort({ discount: -1 });
    else productsQuery = productsQuery.sort({ createdAt: -1 });

    const products = await productsQuery;
    return res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. GET SINGLE PRODUCT
// ==========================================
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product nahi mila." });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. UPDATE PRODUCT
// ==========================================
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product nahi mila." });
    }

    const { name, description, price, actualPrice, discount, category, stock, isTrending, existingImages } = req.body;

    let finalImages = [];
    if (existingImages) {
      try {
        const parsed = typeof existingImages === "string" ? JSON.parse(existingImages) : existingImages;
        if (Array.isArray(parsed)) {
          finalImages = parsed.map((img) => (typeof img === "object" ? img.url : img));
        }
      } catch (e) {
        // fallback
      }
    }

    if (req.files && req.files.length > 0) {
      const newUrls = req.files.map((file) => `/uploads/${file.filename}`);
      finalImages.push(...newUrls);
    }

    if (finalImages.length === 0 && product.images) {
      finalImages = product.images;
    }

    const parsedPrice = price !== undefined ? Number(price) : product.price;
    const parsedDiscount = discount !== undefined ? Number(discount) : product.discount;
    const finalPrice =
      parsedDiscount > 0
        ? Math.round(parsedPrice - (parsedPrice * parsedDiscount) / 100)
        : parsedPrice;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name ? name.trim() : product.name,
        description: description ? description.trim() : product.description,
        price: parsedPrice,
        actualPrice: actualPrice !== undefined ? Number(actualPrice) : parsedPrice,
        discount: parsedDiscount,
        finalPrice,
        category: category ? category.trim() : product.category,
        stock: stock !== undefined ? Number(stock) : product.stock,
        isTrending: isTrending === "true" || isTrending === true,
        images: finalImages,
        image: finalImages[0] || product.image
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      data: updated
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. DELETE PRODUCT
// ==========================================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product nahi mila." });
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Product successfully delete ho gaya." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// server/controllers/productController.js ke getAllProducts function ko update karein:
exports.getAllProducts = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = tenantId ? { tenant: tenantId } : {};

    const {
      category,
      search,
      stockStatus,
      sortBy = "createdAt-desc",
      page = 1,
      limit = 10
    } = req.query;

    // 1. Category Filter
    if (category && category !== "All") {
      query.category = category;
    }

    // 2. Search Query (Name or Description)
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } }
      ];
    }

    // 3. Stock Status Filter
    if (stockStatus === "inStock") {
      query.stock = { $gt: 0 };
    } else if (stockStatus === "outOfStock") {
      query.stock = { $lte: 0 };
    }

    // 4. Sorting Logic
    let sortOptions = { createdAt: -1 };
    if (sortBy === "price-low") sortOptions = { price: 1 };
    else if (sortBy === "price-high") sortOptions = { price: -1 };
    else if (sortBy === "name-asc") sortOptions = { name: 1 };
    else if (sortBy === "stock-low") sortOptions = { stock: 1 };
    else if (sortBy === "discount-high") sortOptions = { discount: -1 };

    // 5. Pagination Calculation
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * perPage;

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage) || 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(perPage);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      pagination: {
        total: totalProducts,
        page: currentPage,
        limit: perPage,
        totalPages
      }
    });
  } catch (error) {
    console.error("getAllProducts Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};