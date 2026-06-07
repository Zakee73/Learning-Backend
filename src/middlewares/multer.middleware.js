
import multer from "multer";
import path from "path";

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // yaha file save hogi
  },

  filename: function (req, file, cb) {
   

    cb(null,(file.originalname));
  },
});

// Multer instance
const upload = multer({
  storage: storage,
});

export { upload };