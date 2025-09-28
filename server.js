const express = require("express");
const { Pool } = require("pg");
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

// =======================================================
//                   PostgreSQL 연결
// =======================================================
const DB_CONNECTION_STRING = process.env.DATABASE_URL;

if (!DB_CONNECTION_STRING) {
    console.error("FATAL ERROR: DATABASE_URL 환경 변수가 설정되지 않았습니다. Render 대시보드에서 설정이 필요합니다.");
    // 환경 변수 누락 시 서버 시작을 중지하여 런타임 오류 방지
    process.exit(1); 
}

const pool = new Pool({
    connectionString: DB_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false } 
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// =======================================================
//                   API 라우트 정의
// =======================================================

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // [수정된 부분] 'class_no' 대신 'class' 컬럼을 조회한다고 가정합니다.
        // **🚨 주의: DB의 실제 컬럼명이 'class'가 아니라면, 이 부분을 실제 이름으로 변경해야 합니다.
        const result = await pool.query(
            "SELECT id, role, class FROM users WHERE username=$1 AND password=$2",
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            
            // 클라이언트가 checkin.js에서 원하는 user 객체 구조를 맞춰서 반환합니다.
            res.json({ 
                success: true, 
                role: user.role,
                user: { 
                    id: user.id,
                    role: user.role,
                    // DB에서 가져온 'class' 값을 클라이언트의 'classNo'로 매핑하여 전달
                    classNo: user.class 
                }
            });
        } else {
            res.json({ success: false, message: "아이디 또는 비밀번호가 틀렸습니다" });
        }
    } catch (err) {
        console.error("Login DB Error:", err.message);
        res.status(500).json({ success: false, message: "서버 오류: 데이터베이스 연결 또는 쿼리 실패" });
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
//          SPA 라우팅용 와일드카드 처리 (원래 코드로 복원)
// =======================================================
app.get(/^\/(?!login|save|notices).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =======================================================
//               Render 환경 포트 바인딩
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
