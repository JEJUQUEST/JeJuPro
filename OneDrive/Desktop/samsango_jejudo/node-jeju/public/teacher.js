const classes = [
  { name: '1반', checked:0, total:28 },
  { name: '2반', checked:0 , total:28 },
  { name: '3반', checked:0 , total:28 },
  { name: '4반', checked:0 , total:28 },
  { name: '5반', checked:0 , total:28 },
  { name: '6반', checked:0 , total:28 },
  { name: '7반', checked:0 , total:28 },
  { name: '8반', checked:0 , total:28 },
];
document.getElementById('classList').innerHTML = classes.map(c => `
  <div class="row" role="listitem" aria-label="${c.name}">
    <div class="klass">${c.name}</div>
    <div class="count">${c.checked}/${c.total}</div>
  </div>
`).join('');

const $noticeList = document.getElementById('noticeList');
const $noticeDetails = document.getElementById('noticeDetails');

const role = localStorage.getItem("role") || "user";

async function fetchNotices() {
  try {
    const res = await fetch('/notices');
    if (!res.ok) throw new Error('네트워크 응답 오류');
    const notices = await res.json();

    $noticeList.innerHTML = notices.map(n => `
      <div class="notice-item" role="listitem">
        <a class="title" href="#notice-${n.id}" aria-controls="notice-${n.id}">
          ${n.title}
        </a>
        <span class="date">${new Date(n.date).toLocaleString()}</span>
      </div>
    `).join('');

    $noticeDetails.innerHTML = notices.map(n => `
      <article id="notice-${n.id}" class="notice-detail" style="display:none;">
        <h3>${n.title}</h3>
        <div class="meta">${new Date(n.date).toLocaleString()} · 대상: ${n.class}</div>
        <p>${n.content}</p>
        ${n.image ? `<img src="${n.image}" alt="공지 이미지" style="max-width:100%;">` : ""}
        <a href="${role === 'admin' ? 'teacher.html' : 'main.html'}" class="backlink">목록으로</a>
      </article>
    `).join('');

    document.querySelectorAll('.notice-item .title').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.notice-detail').forEach(d => d.style.display = 'none');

        const targetId = a.getAttribute('href').substring(1);
        const targetDetail = document.getElementById(targetId);
        if(targetDetail) {
          targetDetail.style.display = 'block';
          targetDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

  } catch (err) {
    console.error('공지 불러오기 실패:', err);
    $noticeList.innerHTML = `<p style="color:red;padding:10px;">공지사항을 불러올 수 없습니다. 서버를 확인해 주세요.</p>`;
  }
}

window.addEventListener('load', fetchNotices);

const $pending = document.getElementById('pendingCount');
const $done = document.getElementById('doneCount');
function updateStats(p, d) {
  $pending.textContent = p;
  $done.textContent = d;
}
updateStats(2, 2);
