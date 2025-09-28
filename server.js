const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 정적 파일 및 업로드 경로 설정
app.use(express.static(path.join(__dirname, "public")));
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// DB 연결 함수
async function connectDB() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "1234",
    database: process.env.DB_NAME || "memory"
  });
}

// =======================================================
//                    API 라우트 정의
// =======================================================

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const conn = await connectDB();

  try {
    const [rows] = await conn.execute(
      "SELECT * FROM users WHERE username=? AND password=?",
      [username, password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      res.json({ success: true, role: user.role });
    } else {
      res.json({ success: false, message: "아이디 또는 비밀번호가 틀렸습니다" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "서버 오류" });
  } finally {
    await conn.end();
  }
});

// Multer 설정
const uploadDir = path.join(__dirname, "upload");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("이미지 파일만 업로드 가능합니다."));
  },
});

app.post("/save", upload.single("image"), (req, res) => {
  const { title, content, urgent, author } = req.body;
  const file = req.file;

  const alarmFile = path.join(__dirname, "alarm.json");
  let notices = [];

  try {
    if (fs.existsSync(alarmFile)) {
      const data = fs.readFileSync(alarmFile, 'utf-8').trim();
      notices = data ? JSON.parse(data) : [];
    }
  } catch (err) {
    console.error('Error reading alarm.json:', err);
  }

  const newNotice = {
    id: Date.now(),
    title,
    content,
    author,
    date: new Date().toISOString(),
    urgent: urgent === 'true' || urgent === true,
    image: file ? `/upload/${file.filename}` : null
  };

  notices.unshift(newNotice);

  try {
    fs.writeFileSync(alarmFile, JSON.stringify(notices, null, 2));
    res.json({ status: "success", message: "공지 저장 완료" });
  } catch (err) {
    console.error('Error writing to alarm.json:', err);
    res.status(500).json({ status: "error", message: "공지 저장 실패" });
  }
});

app.get("/notices", (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const alarmFile = path.join(__dirname, "alarm.json");

  try {
    if (fs.existsSync(alarmFile)) {
      const data = fs.readFileSync(alarmFile, 'utf-8').trim();
      res.json(data ? JSON.parse(data) : []);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error('Error reading or parsing alarm.json:', err);
    res.status(500).json({ status: "error", message: "공지 불러오기 실패" });
  }
});

// =======================================================
//           SPA 라우팅용 와일드카드 처리 (Render 대응)
// =======================================================

// /login, /save, /notices 제외한 모든 GET 요청은 index.html
app.get(/^\/(?!login|save|notices).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =======================================================
//              Render 환경 포트 바인딩
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
