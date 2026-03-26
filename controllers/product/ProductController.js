// -------------------------------------------- IMPORTS -------------------------------------------- //
import * as productService from "../../services/product/ProductService.js";

// -------------------------------------------- CONTROLLER -------------------------------------------- //

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const data = await productService.createProduct(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET PRODUCT LIST
export const getProduct = async (req, res) => {
  try {
    const data = await productService.getProduct(req.body);
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET SINGLE PRODUCT
export const singleProduct = async (req, res) => {
  try {
    const data = await productService.singleProduct(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const data = await productService.updateProduct(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE PRODUCT STATUS
export const statusProduct = async (req, res) => {
  try {
    const data = await productService.statusProduct(req.params.id, req.body.status, req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const data = await productService.deleteProduct(req.params.id, req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};