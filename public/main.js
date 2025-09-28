    (function () {
      // 1) 다음 일정 "자세히 보기" → day.html 로 이동
      document.querySelectorAll('.card .schedule .link').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          location.href = 'day.html';
        });
      });

      // 2) 공지 리스트 "자세히 보기" → student_qna.html 로 이동
      document.querySelectorAll('.notice-list .notice-item .link').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          location.href = 'student_qna.html';
        });
      });

      // 3) 체크인 버튼 → checkin.html 로 이동 (확인/알림 없음)
      document.getElementById('checkinBtn')?.addEventListener('click', () => {
        location.href = 'checkin.html';
      });

      // 4) 하단 "공지 & 문의" 버튼이 notice.html 로 되어 있어도 student_qna.html 로 보내기
      const noticeBtn = document.querySelector('.footer-btn.btn--notice');
      if (noticeBtn) {
        if (noticeBtn.tagName === 'A') {
          noticeBtn.setAttribute('href', 'student_qna.html');
        } else {
          noticeBtn.addEventListener('click', () => (location.href = 'student_qna.html'));
        }
      }
    })();