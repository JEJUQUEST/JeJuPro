/* --------- 오늘 체크인 --------- */
const classes = [
  {name:'1반', count:'18/20'},
  {name:'2반', count:'20/20'},
  {name:'3반', count:'18/20'},
  {name:'4반', count:'19/21'},
  {name:'5반', count:'17/20'},
  {name:'6반', count:'20/20'},
  {name:'7반', count:'19/20'},
  {name:'8반', count:'18/20'},
];
document.getElementById('classList').innerHTML = classes.map(c => `
  <div class="row" role="listitem" aria-label="${c.name}">
    <div class="klass">${c.name}</div>
    <div class="count">${c.count}</div>
  </div>`).join('');

/* --------- 공지 목록 + 상세 --------- */
const notices = [
  {id:'n1', title:'집합 시간 변경 안내', date:'2025-05-10',
   body:'오늘 집합 시간이 09:10에서 09:20으로 변경되었습니다. 각 반은 안내된 장소에서 담임 선생님 지시에 따라 대기해 주세요.'},
  {id:'n2', title:'숙소 유의 사항', date:'2025-05-09',
   body:'숙소 소등 시간은 22시입니다. 복도에서 소란 행위를 삼가하고 분리수거 규칙을 지켜 주세요.'},
  {id:'n3', title:'우천 대비 안내', date:'2025-05-08',
   body:'내일 오전 비 예보가 있습니다. 우비를 지참하고 미끄럼에 주의하세요.'},
  {id:'n4', title:'점심 알레르기 확인', date:'2025-05-08',
   body:'땅콩/우유/달걀 알레르기가 있는 학생은 담임 선생님께 반드시 전달 바랍니다.'},
];

const $noticeList = document.getElementById('noticeList');
const $noticeDetails = document.getElementById('noticeDetails');

// 스크롤 가능한 리스트 (제목을 앵커로)
$noticeList.innerHTML = notices.map(n => `
  <div class="notice-item" role="listitem">
    <a class="title" href="#notice-${n.id}" aria-controls="notice-${n.id}">${n.title}</a>
    <span class="date">${n.date}</span>
  </div>
`).join('');

// 상세 앵커 섹션 (:target로 열림)
$noticeDetails.innerHTML = notices.map(n => `
  <article id="notice-${n.id}" class="notice-detail" aria-labelledby="h-${n.id}">
    <h3 id="h-${n.id}">${n.title}</h3>
    <div class="meta">${n.date}</div>
    <p>${n.body}</p>
    <a class="backlink" href="#top" onclick="history.replaceState(null,null,'#');return true;">목록으로 돌아가기</a>
  </article>
`).join('');

/* --------- 문의 요약 (데모) --------- */
const $pending = document.getElementById('pendingCount');
const $done = document.getElementById('doneCount');
function updateStats(p,d){$pending.textContent=p;$done.textContent=d}
updateStats(2,2);