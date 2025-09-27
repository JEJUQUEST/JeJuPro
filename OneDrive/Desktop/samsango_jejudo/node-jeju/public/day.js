const state = { day: 1, klass: '1조' };
let data = []; 

const $list = document.getElementById('list');
const $empty = document.getElementById('empty');
const dayChips = [...document.querySelectorAll('#dayChips .chip')];
const classChips = [...document.querySelectorAll('#classChips .chip')];
const $backLink = document.querySelector('.back'); 

fetch('schedule.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    render();
  })
  .catch(err => console.error('JSON 불러오기 실패', err));

function render() {
  const items = data.filter(it => it.day === state.day && it.class === state.klass);

  if (items.length === 0) {
    $list.innerHTML = '';
    $empty.hidden = false;
    return;
  }

  $empty.hidden = true;
  $list.innerHTML = items.map(it => `
    <article class="card">
      <img class="thumb" src="${it.img || ''}" alt="${it.title}">
      <div>
        <h2 class="title2">${it.title}</h2>
        <div class="time">${it.start} - ${it.end}</div>
        <div class="desc">${it.desc}</div>
      </div>
    </article>
  `).join('');
}

dayChips.forEach(chip => {
  chip.addEventListener('click', () => {
    dayChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.day = Number(chip.dataset.day);
    render();
  });
});

classChips.forEach(chip => {
  chip.addEventListener('click', () => {
    classChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.klass = chip.dataset.class;
    render();
  });
});

// 뒤로가기 버튼 클릭 이벤트 핸들러
$backLink.addEventListener('click', (e) => {
  e.preventDefault(); 
  const role = localStorage.getItem("role");

  if (role === 'admin') {
    window.location.href = 'teacher.html';
  } else {
    window.location.href = 'main.html';
  }
});