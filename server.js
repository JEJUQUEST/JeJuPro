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
        // id와 role만 명시적으로 조회합니다.
        const result = await pool.query(
            "SELECT id, role FROM users WHERE username=$1 AND password=$2",
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const userId = user.id;
            let assignedClassNo = null;

            // ✨✨✨ ID 값에 따른 반 분류 로직 (최종 적용) ✨✨✨
            const EXCLUDED_COUNT = 22; // 제외될 1~22번 학생 수
            const CLASS_SIZE = 28; // 1반~8반의 기준 인원
            const MAX_STUDENT_ID = 246; // 최대 학생 ID

            // 1. 관리자/선생님 처리
            if (user.role === 'admin' || user.role === 'teacher') {
                 assignedClassNo = 999; // 관리자 전용 코드로 설정
            }
            // 2. ID 1번부터 22번까지의 학생 처리 (분류에서 제외)
            else if (userId >= 1 && userId <= EXCLUDED_COUNT) {
                assignedClassNo = 998; // 특수 제외 코드 할당
            }
            // 3. ID 23번부터 246번까지의 학생 처리 (28명씩 1반부터 8반까지)
            else if (userId > EXCLUDED_COUNT && userId <= MAX_STUDENT_ID) {
                // 22명을 제외한 나머지 ID 그룹을 계산합니다.
                const adjustedId = userId - EXCLUDED_COUNT;
                
                // 28로 나누어 그룹 인덱스(0부터 7)를 구한 후, 1을 더해 1반부터 8반으로 설정
                const groupIndex = Math.floor((adjustedId - 1) / CLASS_SIZE);
                assignedClassNo = groupIndex + 1; // 1반부터 8반 (0~7 + 1)
            }
            // 4. 그 외 ID 처리
            else {
                assignedClassNo = -1; // 미분류 오류 코드
            }

            // ✨✨✨ ------------------------------ ✨✨✨
            
            // 클라이언트에게 올바른 classNo를 전달합니다.
            res.json({ 
                success: true, 
                role: user.role,
                user: { 
                    id: userId,
                    role: user.role,
                    classNo: assignedClassNo // 계산된 반 번호를 전달 (1~8 또는 특수 코드)
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
