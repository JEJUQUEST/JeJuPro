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

// --- 1. 정적 파일 및 업로드 경로 설정 (수정 없음) ---
// 클라이언트에게 public 폴더의 파일들(index.html, JS, CSS 등)을 제공
app.use(express.static(path.join(__dirname, "public")));
// 업로드된 파일 접근 경로 설정
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// --- 2. DB 연결 함수 (DB_HOST 환경 변수 사용) ---
async function connectDB() {
    return await mysql.createConnection({
        // Render 환경 변수를 사용하도록 설정. 로컬 테스트를 위해 fallback 값 포함
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASS || "1234",
        database: process.env.DB_NAME || "memory"
    });
}

// --- 3. Multer 설정 (수정 없음) ---
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

// --- 4. API 라우트 (수정 없음: /login, /save, /notices) ---
// *이 부분은 기존 코드와 동일합니다.*

app.post("/login", async (req, res) => {
    // ... 기존 로그인 로직 ...
});

app.post("/save", upload.single("image"), (req, res) => {
    // ... 기존 저장 로직 ...
});

app.get("/notices", (req, res) => {
    // ... 기존 공지 불러오기 로직 ...
});

// ------------------------------------------------------------------
// --- 5. "Cannot GET /" 에러 해결을 위한 핵심 수정 부분 ---
// ------------------------------------------------------------------

/**
 * 중요: "Cannot GET /" 에러 해결!
 * 모든 GET 요청 (API 라우트 처리 후 남은 요청)에 대해 public 폴더의 index.html을 반환합니다.
 * 이는 클라이언트 측 라우팅(React Router 등)이 페이지 전환을 담당할 수 있도록 해줍니다.
 * 이 라우트는 반드시 모든 API 라우트 *다음*에 위치해야 합니다.
 */
app.get('*', (req, res) => {
    // public 폴더 내의 index.html 파일을 반환하여 SPA의 진입점으로 사용
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- 6. Render 환경에 맞는 포트 리스닝 설정 (필수 수정) ---
const PORT = process.env.PORT || 3000; 

/**
 * Render에서 사용하는 PORT 환경 변수를 사용하고, 
 * 서버가 외부 요청을 받도록 호스트를 '0.0.0.0'으로 명시적으로 바인딩합니다.
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
