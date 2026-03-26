import * as ProductController from "../controllers/product/ProductController.js";
import * as LoginController from "../controllers/login/LoginController.js";
import * as Logcontroller from "../controllers/log/LogController.js";

// ✅ Export all controllers
export {
  ProductController,
  Logcontroller,
  LoginController as authController,
};