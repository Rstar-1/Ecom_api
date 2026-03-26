// -------------------------------------------- IMPORTS -------------------------------------------- //
import * as Controller from "../../controllers/Index.js";

// -------------------------------------------- PRODUCT ROUTES -------------------------------------------- //
export default (app) => {
  app.post("/product/create", Controller.ProductController.createProduct);
  app.post("/product/list", Controller.ProductController.getProduct);
  app.get("/product/:id", Controller.ProductController.singleProduct);
  app.patch("/product/:id", Controller.ProductController.updateProduct);
  app.patch("/product/status/:id", Controller.ProductController.statusProduct);
  app.delete("/product/:id", Controller.ProductController.deleteProduct);
};