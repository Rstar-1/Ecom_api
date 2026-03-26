// routes/Index.js
import ProductRoute from "./product/ProductRoute.js";
import LoginRoute from "./login/LoginRoute.js";
import LogRoute from "./log/LogRoute.js";

export default function mainroute(app) {
  ProductRoute(app);
  LogRoute(app);
  LoginRoute(app);
}