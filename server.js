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
//                   PostgreSQL 연결
// =======================================================
// Render 배포 환경에서는 process.env.DATABASE_URL이 설정되어야 합니다.
const DB_CONNECTION_STRING = process.env.DATABASE_URL;

if (!DB_CONNECTION_STRING) {
    console.error("FATAL ERROR: DATABASE_URL 환경 변수가 설정되지 않았습니다.");
    // 실제 운영 환경에서는 process.exit(1); 로 서버를 중단시켜야 하지만,
    // 테스트를 위해 일단 진행합니다.
}

const pool = new Pool({
    // DATABASE_URL이 설정되지 않은 경우, pool 생성은 가능하나 연결 시 에러 발생
    connectionString: DB_CONNECTION_STRING,
    // Render PostgreSQL 연결 시 SSL 설정은 필수입니다.
    ssl: { rejectUnauthorized: false }
});

// 데이터베이스 연결 테스트 및 에러 핸들링
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // 서버를 중지하거나 재연결 로직을 추가할 수 있습니다.
});


// =======================================================
//                   API 라우트 정의
// =======================================================

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // pool.query를 사용하여 DB 연결을 시도
        const result = await pool.query(
            "SELECT * FROM users WHERE username=$1 AND password=$2",
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ success: true, role: user.role });
        } else {
            res.json({ success: false, message: "아이디 또는 비밀번호가 틀렸습니다" });
        }
    } catch (err) {
        // DB 연결 오류, 쿼리 오류 등 모든 서버 내부 오류는 500 응답과 함께 로그 출력
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
//          SPA 라우팅용 와일드카드 처리 (Render 대응)
// =======================================================
// API 라우트에서 처리되지 않은 모든 GET 요청은 index.html로 이동
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =======================================================
//               Render 환경 포트 바인딩
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
