document.addEventListener('DOMContentLoaded', () => {
  history.replaceState(null, null, '#');

  const noticeForm = document.getElementById("noticeForm");
  const classSelect = document.getElementById("classSelect");
  const targetCls = document.getElementById("targetCls");
  const targetAll = document.getElementById("targetAll");
  const fileInput = document.getElementById("image");

  targetCls.addEventListener("change", () => classSelect.disabled = !targetCls.checked);
  targetAll.addEventListener("change", () => classSelect.disabled = targetAll.checked);

  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (targetCls.checked && !classSelect.value) {
      alert("반을 선택해주세요.");
      return;
    }

    const file = fileInput.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지는 5MB 이하만 업로드 가능합니다.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("title", noticeForm.title.value);
    formData.append("content", noticeForm.content.value);
    formData.append("class", targetCls.checked ? classSelect.value : "all");
    if (file) formData.append("image", file);

    try {
      const res = await fetch("/save", { method: "POST", body: formData });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.status === "success") {
        alert("공지 저장 완료!");
        window.location.href = "teacher.html";
      } else {
        alert("저장 실패: " + (data.message || "서버 오류"));
        window.location.href = "teacher.html";
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  });
});
