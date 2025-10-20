import { Router } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/upload-logo", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileExt = req.file.originalname.split(".").pop();
    const key = `logos/${nanoid()}.${fileExt}`;
    
    const result = await storagePut(key, req.file.buffer, req.file.mimetype);
    
    res.json({ url: result.url, key: result.key });
  } catch (error) {
    console.error("Logo upload error:", error);
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

export default router;
