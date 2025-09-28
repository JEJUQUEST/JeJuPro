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

      // 서버에서 보낸 user 객체를 JSON 문자열로 변환하여 저장합니다.
      // 이 안에 checkin.js가 필요로 하는 id와 classNo가 들어 있습니다.
      if (result.user) {
          localStorage.setItem("tm_user", JSON.stringify(result.user));
      }

      if(result.role === 'admin' || result.role === 'teacher') {
        // 관리자/선생님 역할이면 teacher.html로 이동
        window.location.href = "teacher.html"; 
      } else {
        // 일반 사용자면 main.html로 이동
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
