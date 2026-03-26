import * as Controller from "../../controllers/Index.js";
import { fileUpload } from "../../middleware/FileUpload.js";
import { uploadToCloud } from "../../middleware/Upload.js";

export default (app) => {
  app.post(
    "/register",
    fileUpload("image"),
    uploadToCloud(),
    Controller.authController.register
  );

  app.get("/getusers", Controller.authController.getUsers);

  app.post("/login", Controller.authController.login);

  app.post("/logout", Controller.authController.logout);

  app.put(
    "/update/:id",
    fileUpload("image"),
    uploadToCloud(),
    Controller.authController.updateUser
  );
};