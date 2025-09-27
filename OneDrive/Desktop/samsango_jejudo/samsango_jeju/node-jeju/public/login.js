document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault(); 

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (result.success) {
      // 권한 저장 (localStorage)
      localStorage.setItem("role", result.role);

      // 권한별 페이지 이동
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
