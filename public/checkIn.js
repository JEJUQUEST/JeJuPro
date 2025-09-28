// checkin.js — 일정 바인딩 + 체크인 저장(중복 방지, 시간대 제한)
// 내일이 Day 1 기준으로 Day 계산
(function () {
  'use strict';

  const STORAGE_KEY = 'tm_checkins';
  const ACTIVE_MIN = 30; // 시작 30분 전 ~ 종료 30분 후 허용
  const MS_DAY = 24 * 60 * 60 * 1000;

  const qs = (s, r = document) => r.querySelector(s);
  const me = () => { try { return JSON.parse(localStorage.getItem('tm_user') || 'null'); } catch { return null; } };
  const classLabel = () => (me()?.classNo ? `${me().classNo}조` : '1조');
  const parseMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); return m ? (+m[1]) * 60 + (+m[2]) : -1; };

  const $btnYes = qs('#btnYes');
  const $btnNo = qs('#btnNo');
  const $btnBack = qs('#btnBack');
  const $place = qs('.place');
  const $time = qs('.time');
  const $sched = qs('.schedule');

  const SCHEDULE_URL = 'schedule.json'; // 필요 시 '/data/schedule.json' 등으로 수정

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  // 내일이 Day 1: 오늘 < 내일 00:00이면 1, 이후는 경과 일수 + 1
  function computeDayTomorrowIsDay1(maxDay = 4) {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = startOfDay(tomorrow);
    let day;
    if (now < start) day = 1;
    else day = Math.floor((now - start) / MS_DAY) + 1;
    // 스케줄 범위로 클램프
    day = Math.max(1, Math.min(maxDay, day));
    return day;
  }

  async function pickNextSchedule() {
    try {
      const r = await fetch(SCHEDULE_URL, { cache: 'no-store' });
      const all = r.ok ? await r.json() : [];
      const listAll = (Array.isArray(all) ? all : []).filter(x => String(x.class).trim() === String(classLabel()));

      if (!listAll.length) return null;

      // 반별 최대 day 파악 후 "내일=Day1" 로 계산
      const maxDay = Math.max(...listAll.map(x => Number(x.day) || 1));
      let day = computeDayTomorrowIsDay1(maxDay);

      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      // 특정 day 목록 정렬
      const byDay = (d) =>
        listAll.filter(x => Number(x.day) === Number(d))
               .sort((a, b) => parseMin(a.start) - parseMin(b.start));

      let todayList = byDay(day);

      // 오늘(해당 day)에서 진행중 또는 다음 일정
      const pickFrom = (arr) => {
        if (!arr.length) return null;
        const running = arr.find(i => {
          const s = parseMin(i.start), e = parseMin(i.end);
          if (s < 0) return false;
          if (e < 0) return nowMin >= s; // 종료 미기입 시 시작 이후면 진행중으로 간주
          return s <= nowMin && nowMin <= e;
        });
        if (running) return running;
        const upcoming = arr.find(i => parseMin(i.start) >= nowMin);
        if (upcoming) return upcoming;
        return null;
      };

      let target = pickFrom(todayList);

      // 오늘(day)에서 남은 게 없으면 다음 day들에서 가장 빠른 일정 선택
      if (!target) {
        for (let d = day + 1; d <= maxDay; d++) {
          const arr = byDay(d);
          if (arr.length) { target = arr[0]; day = d; break; }
        }
      }

      // 그래도 없으면 마지막 day의 마지막 일정으로 폴백(또는 null 반환)
      if (!target) {
        const lastList = byDay(maxDay);
        if (lastList.length) target = lastList[lastList.length - 1];
      }

      return target || null;
    } catch {
      return null;
    }
  }

  function bindInfo(item) {
    if (!item) {
      $place && ($place.textContent = '일정 없음');
      $time && ($time.textContent = '--:-- - --:--');
      if ($btnYes) { $btnYes.disabled = true; $btnYes.title = '일정이 없습니다.'; }
      return;
    }

    $place && ($place.textContent = item.title || item.location || '장소 미정');
    $time && ($time.textContent = `${item.start || '--:--'} - ${item.end || '--:--'}`);

    let img = $sched?.querySelector('img.thumb');
    if (item.image) {
      if (!img) { img = document.createElement('img'); img.className = 'thumb'; $sched?.prepend(img); }
      img.src = item.image; img.alt = item.title || '일정 이미지'; img.style.display = '';
    } else if (img) { img.style.display = 'none'; }

    toggleActive(item.start, item.end);

    // 버튼에 메타 저장
    if ($btnYes) {
      $btnYes.dataset.scheduleTitle = item.title || '';
      $btnYes.dataset.scheduleTime = `${item.start}-${item.end}`;
    }
  }

  function toggleActive(start, end) {
    if (!$btnYes) return;
    const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
    const s = parseMin(start), e = parseMin(end);
    if (s < 0 || e < 0) { $btnYes.disabled = false; $btnYes.title = ''; return; }
    const active = nowMin >= (s - ACTIVE_MIN) && nowMin <= (e + ACTIVE_MIN);
    $btnYes.disabled = !active;
    $btnYes.title = active ? '' : `체크인 가능 시간은 시작 ${ACTIVE_MIN}분 전부터 종료 ${ACTIVE_MIN}분 후까지입니다.`;
  }

  function getRecs() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
  function setRecs(a) { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); }
  function isDup(userId, title, timeText) {
    const today = new Date().toDateString();
    return getRecs().some(r => r.userId === userId && r.title === title && r.timeText === timeText && new Date(r.at).toDateString() === today);
  }

  async function init() {
    const target = await pickNextSchedule();
    bindInfo(target);
  }

  // 돌아가기/취소
  function goBack() {
    if (history.length > 1) history.back();
    else {
      const role = localStorage.getItem('role');
      location.href = (role === 'admin' || role === 'teacher') ? 'teacher.html' : 'main.html';
    }
  }
  $btnNo?.addEventListener('click', goBack);
  $btnBack?.addEventListener('click', goBack);

  // 체크인 실행
  $btnYes?.addEventListener('click', () => {
    const u = me();
    if (!u?.id) return alert('로그인 정보가 없습니다.');
    if ($btnYes.disabled) return alert('지금은 체크인 가능 시간대가 아닙니다.');

    const title = $btnYes.dataset.scheduleTitle || ($place?.textContent?.trim() || '');
    const timeText = $btnYes.dataset.scheduleTime || ($time?.textContent?.trim() || '');
    if (isDup(u.id, title, timeText)) return alert('이미 체크인되었습니다.');
    if (!confirm('도착했습니다. 체크인할까요?')) return;

    const recs = getRecs();
    recs.unshift({
      id: 'ck_' + Date.now(),
      userId: u.id,
      classNo: u.classNo ?? null, // teacher_main에서 반별 집계에 사용
      title, timeText,
      at: Date.now()
    });
    setRecs(recs);

    alert('체크인 완료! (' + new Date().toLocaleTimeString() + ')');
    goBack();
  });

  window.addEventListener('DOMContentLoaded', init);
})();
