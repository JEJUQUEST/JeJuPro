let qnas = [];
let user = null; // 사용자 객체를 저장할 전역 변수

// =======================================================
// 1. 로그인 체크 및 사용자 정보 로드 (필수)
// =======================================================
(function checkLogin() {
    const userString = localStorage.getItem('tm_user');
    if (userString) {
        try {
            user = JSON.parse(userString); // JSON 파싱 후 user 객체에 저장
            console.log("로그인된 사용자 정보:", user);
        } catch (e) {
            console.error("사용자 정보 파싱 오류:", e);
            // 파싱 오류 시 로그인 페이지로 리디렉션
            location.href = 'login.html'; 
            return; 
        }
    } else {
        // tm_user 값이 없으면 로그인 페이지로 리디렉션
        location.href = 'login.html';
        return;
    }
})();


// =======================================================
// 2. 탭 기능
// =======================================================
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(tab.dataset.tab).style.display = 'block';
  });
});


// =======================================================
// 3. 공지사항 기능 (라인 표시 수정 완료)
// =======================================================
async function loadNotices() {
  try {
    const res = await fetch("/notices"); 
    const notices = await res.json();

    window.notices = notices; 
    renderNotices();
  } catch (err) {
    console.error("공지 불러오기 실패:", err);
    document.getElementById("noticeList").innerHTML = `<p style="color:red">공지사항을 불러올 수 없습니다. 서버가 실행 중인지 확인하세요.</p>`;
  }
}

function renderNotices() {
  const list = document.getElementById('noticeList');
  list.innerHTML = window.notices.map(n => `
    <div class="notice-item" onclick="showDetail(${n.id})">       <div>
        <span class="badge" style="display:${n.urgent?'inline-block':'none'}">긴급</span>
        <span class="notice-title">${n.title}</span>
      </div>
      <div class="notice-date">${new Date(n.date).toLocaleDateString()}</div>
    </div>
  `).join('');
}

function showDetail(id) {
  const n = window.notices.find(x => x.id === id);
  if (!n) return;

  document.getElementById('noticeList').style.display = 'none';
  const d = document.getElementById('noticeDetail');
  d.style.display = 'block';
  d.innerHTML = `
    <div class="detail">
      <h2>${n.title}</h2>
      <div class="meta">작성자: ${n.author || '관리자'} | ${new Date(n.date).toLocaleString()}</div>
      <p>${n.content}</p>
      ${n.image ? `<img src="${n.image}" alt="">` : ''}
      <button class="btn" onclick="backToList()">목록으로</button>
    </div>
  `;
}

function backToList() {
  document.getElementById('noticeDetail').style.display = 'none';
  document.getElementById('noticeList').style.display = 'block';
}


// =======================================================
// 4. 문의함(Q&A) 기능
// =======================================================
document.getElementById('btnNewQ').addEventListener('click', () => {
  document.getElementById('qnaForm').style.display = 'block';
});

document.getElementById('btnSaveQ').addEventListener('click', () => {
  const title = document.getElementById('qTitle').value;
  const content = document.getElementById('qContent').value;

  if (!title || !content) {
    alert('제목과 내용을 입력하세요');
    return;
  }

  // 문의에 사용자 정보(ID, 반 번호) 추가
  const q = {
    id: Date.now(),
    userId: user.id,         
    userClass: user.classNo,   
    title,
    content,
    status: '대기',
    updated: new Date().toLocaleDateString()
  };
    console.log("새 문의 등록:", q); 

  qnas.unshift(q);
  renderQnas();

  document.getElementById('qTitle').value = '';
  document.getElementById('qContent').value = '';
  document.getElementById('qnaForm').style.display = 'none';
});

function renderQnas() {
  const list = document.getElementById('qnaList');
  list.innerHTML = qnas.map(q => `
    <div class="item" onclick="alert('문의: ${q.content}\\n답변: ${q.answer || '아직 없음'}')">
      <div><strong>${q.title}</strong></div>
      <div class="meta">${q.status} • ${q.updated}</div>
    </div>
  `).join('');
}


// =======================================================
// 5. 초기 로드
// =======================================================
window.addEventListener('DOMContentLoaded', () => {
  loadNotices();  
  renderQnas();  
});
