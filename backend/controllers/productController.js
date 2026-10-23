const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

const removeLocalFiles = (imagePaths = []) => {
  if (!Array.isArray(imagePaths)) return;
  imagePaths.forEach((imgUrl) => {
    if (imgUrl && imgUrl.startsWith("/uploads/products/")) {
      const filePath = path.join(__dirname, "..", imgUrl);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("File deletion error:", err);
        });
      }
    }
  });
};

exports.getAllProducts = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { category, search, minRating, maxPrice, sortBy, trending, includeOutOfStock } = req.query;

    let query = { tenant: tenantId };

    if (includeOutOfStock !== "true") {
      query.stock = { $gt: 0 };
    }
    if (category && category !== "All") {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (maxPrice) query.price = { $lte: Number(maxPrice) };
    if (trending === "true") query.$or = [{ isTrending: true }, { rating: { $gte: 4.5 } }];

    let productsQuery = Product.find(query);

    if (sortBy === "price-low") productsQuery = productsQuery.sort({ price: 1 });
    else if (sortBy === "price-high") productsQuery = productsQuery.sort({ price: -1 });
    else if (sortBy === "rating") productsQuery = productsQuery.sort({ rating: -1 });
    else if (sortBy === "stock-low") productsQuery = productsQuery.sort({ stock: 1 });
    else if (sortBy === "discount") productsQuery = productsQuery.sort({ discount: -1 });
    else productsQuery = productsQuery.sort({ createdAt: -1 });

    const products = await productsQuery;
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, tenant: req.tenant._id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  let uploadedFiles = [];
  try {
    const tenantId = req.tenant._id;
    const {
      name,
      category,
      price,
      discount,
      stock,
      rating,
      isTrending,
      isRecent,
      description,
      existingUrls
    } = req.body;

    let finalImages = [];

    if (existingUrls) {
      try {
        const parsed = typeof existingUrls === "string" ? JSON.parse(existingUrls) : existingUrls;
        if (Array.isArray(parsed)) finalImages.push(...parsed.filter((u) => u && u.trim()));
      } catch {
        if (typeof existingUrls === "string" && existingUrls.trim()) {
          finalImages.push(existingUrls.trim());
        }
      }
    }

    if (req.files && req.files.length > 0) {
      uploadedFiles = req.files.map((file) => `/uploads/products/${file.filename}`);
      finalImages.push(...uploadedFiles);
    }

    if (finalImages.length < 3 || finalImages.length > 5) {
      removeLocalFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: `Kam se kam 3 aur jyada se jyada 5 images honi chahiye. Aapne ${finalImages.length} images di hain.`
      });
    }

    const newProduct = await Product.create({
      tenant: tenantId,
      name,
      category,
      price: Number(price),
      discount: discount ? Number(discount) : 0,
      stock: stock !== undefined ? Number(stock) : 10,
      rating: rating ? Number(rating) : 4.0,
      isTrending: isTrending === "true" || isTrending === true,
      isRecent: isRecent === "true" || isRecent === true,
      description,
      images: finalImages
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct
    });
  } catch (error) {
    removeLocalFiles(uploadedFiles);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  let uploadedFiles = [];
  try {
    const tenantId = req.tenant._id;
    const product = await Product.findOne({ _id: req.params.id, tenant: tenantId });
    if (!product) {
      if (req.files) removeLocalFiles(req.files.map((f) => `/uploads/products/${f.filename}`));
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const {
      name,
      category,
      price,
      discount,
      stock,
      rating,
      isTrending,
      isRecent,
      description,
      keptImages
    } = req.body;

    let finalImages = [];

    if (keptImages) {
      try {
        const parsed = typeof keptImages === "string" ? JSON.parse(keptImages) : keptImages;
        if (Array.isArray(parsed)) finalImages.push(...parsed);
      } catch {
        finalImages.push(keptImages);
      }
    }

    if (req.files && req.files.length > 0) {
      uploadedFiles = req.files.map((file) => `/uploads/products/${file.filename}`);
      finalImages.push(...uploadedFiles);
    }

    if (finalImages.length < 3 || finalImages.length > 5) {
      removeLocalFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: `Total images 3 se 5 ke beech honi chahiye. Abhi ${finalImages.length} images hain.`
      });
    }

    const removedFromDisk = (product.images || []).filter((oldImg) => !finalImages.includes(oldImg));
    removeLocalFiles(removedFromDisk);

    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, tenant: tenantId },
      {
        name,
        category,
        price: Number(price),
        discount: Number(discount),
        stock: stock !== undefined ? Number(stock) : product.stock,
        rating: Number(rating),
        isTrending: isTrending === "true" || isTrending === true,
        isRecent: isRecent === "true" || isRecent === true,
        description,
        images: finalImages
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updated
    });
  } catch (error) {
    removeLocalFiles(uploadedFiles);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.quickUpdateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: "Valid stock number required" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      { stock: Number(stock) },
      { new: true }
    );

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, message: "Stock updated successfully", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, tenant: req.tenant._id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    removeLocalFiles(product.images);
    await Product.findOneAndDelete({ _id: req.params.id, tenant: req.tenant._id });

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};