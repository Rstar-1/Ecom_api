import multer from "multer";

export const fileUpload = (key, multiple = false) => {
  const storage = multer.memoryStorage(); // store files in memory
  const upload = multer({ storage });

  if (typeof key === "object" && key.length > 1) {
    return upload.fields(key);
  } else if (multiple) {
    return upload.array(key);
  } else {
    return upload.single(key);
  }
};