// 현재 도메인 기반으로 API URL 설정
const BASE_URL = window.location.origin;

document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault(); 

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("role", result.role);

      if(result.role === 'admin') {
        window.location.href = "teacher.html"; 
      } else {
        window.location.href = "main.html";
      }
    } else {
      alert(result.message || "로그인 실패");
    }
  } catch (err) {
    console.error("서버 요청 오류:", err);
    alert("서버 연결 실패");
  }
});
