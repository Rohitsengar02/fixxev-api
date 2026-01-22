const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create
router.post('/', async (req, res) => {
    const productData = {
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        stock: req.body.stock,
        status: req.body.status,
        features: req.body.features,
        subtitle: req.body.subtitle
    };
    if (req.body.image && req.body.image.trim() !== '') {
        productData.image = req.body.image;
    }

    const product = new Product(productData);

    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
