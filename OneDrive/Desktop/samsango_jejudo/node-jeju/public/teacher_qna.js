let qnas = [];

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(tab.dataset.tab).style.display = 'block';
  });
});

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
    <div class="notice-item" onclick="showDetail(${n.id})">
      <div>
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
      <div class="meta">작성자: ${n.author} | ${new Date(n.date).toLocaleString()}</div>
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

  const q = {
    id: Date.now(),
    title,
    content,
    status: '대기',
    updated: new Date().toLocaleDateString()
  };

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

window.addEventListener('DOMContentLoaded', () => {
  loadNotices(); 
  renderQnas(); 
});
