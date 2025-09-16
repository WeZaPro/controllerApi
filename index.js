require("dotenv").config(); // โหลด .env ไฟล์
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { sendPlateToLine } = require("./lineBot");

const app = express();
const port = 3000;

const BASE_URL = process.env.BASE_URL;

// หลังจากบันทึกไฟล์รูปเรียบร้อย
const lineUserId = process.env.LINE_UID; // ใส่ userId หรือ groupId ของ OA

// สร้างโฟลเดอร์ images ถ้ายังไม่มี
const uploadDir = path.join(__dirname, "images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// serve ไฟล์ static จากโฟลเดอร์ images
app.use("/images", express.static(uploadDir));
app.use(express.json()); // รองรับ JSON
app.use(express.urlencoded({ extended: true })); // รองรับ form-urlencoded

// สร้างโฟลเดอร์สำหรับ logs
const logFile = path.join(__dirname, "logs.json");

// ฟังก์ชันเขียน log ลงไฟล์ JSON
function saveLog(data) {
  let logs = [];

  if (fs.existsSync(logFile)) {
    try {
      const raw = fs.readFileSync(logFile, "utf-8").trim();
      if (raw) {
        logs = JSON.parse(raw);
      } else {
        logs = [];
      }
    } catch (err) {
      console.error("❌ Error parsing log file, start new log:", err);
      logs = [];
    }
  }

  logs.push({ ...data, timestamp: new Date().toISOString() });

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

// ใช้ multer เก็บไฟล์ใน disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // เก็บในโฟลเดอร์ images
  },
  filename: function (req, file, cb) {
    // ตั้งชื่อไฟล์เป็น timestamp + ชื่อเดิม
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

// ✅ Default GET (เช็คว่า server ทำงานอยู่)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "🚀 LPR API Server is running",
  });
});

app.post("/milesight", (req, res) => {
  res.json({
    status: "ok",
    data: req.body,
  });
});

app.post("/esp-send", (req, res) => {
  res.json({
    status: "ok",
    data: req.body,
  });
});

// ✅ route สำหรับรับข้อมูลจากกล้อง LPR
app.post("/getData", upload.single("image"), async (req, res) => {
  try {
    const { plate_str, province_fullname, ch, avg_conf } = req.body;
    const imageFile = req.file; // ไฟล์ roi.jpg

    console.log("📌 ได้รับข้อมูลจากกล้อง LPR");
    console.log("plate_str:", plate_str);
    console.log("province_fullname:", province_fullname);
    console.log("ch:", ch);
    console.log("avg_conf:", avg_conf);

    let imageUrl = null;
    if (imageFile) {
      console.log("image saved to:", imageFile.path);
      //   imageUrl = `http://localhost:${port}/images/${imageFile.filename}`;
      imageUrl = `${BASE_URL}/images/${imageFile.filename}`;
    }
    console.log("image url ", imageUrl);
    // ✅ Save log ลงไฟล์ JSON
    saveLog({
      plate_str,
      province_fullname,
      ch,
      avg_conf,
      image: imageUrl,
    });

    // ✅ ส่งข้อมูลไป LINE OA
    if (plate_str && province_fullname && imageUrl) {
      await sendPlateToLine(lineUserId, plate_str, province_fullname, imageUrl);
    }

    res.json({
      status: "success",
      message: "Data received successfully",
      data: {
        plate_str,
        province_fullname,
        ch,
        avg_conf,
        image: imageUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 API Server running at http://localhost:${port}`);
});
