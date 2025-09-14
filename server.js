const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require('fs');

const app = express(); 
app.use(bodyParser.json()); 
app.use(cors());

app.use(express.static("public"));

async function connectDB() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "memory"
  });
}

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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
