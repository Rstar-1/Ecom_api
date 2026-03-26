import * as Controller from "../../controllers/Index.js";

export default function (app) {
  app.post("/logs", Controller.Logcontroller.getlog);
}