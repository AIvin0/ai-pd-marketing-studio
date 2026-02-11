import "./styles/main.css";

import { $ } from "./ui/dom.js";
import { showSection } from "./ui/sections.js";
import { closeModal, copyHashtags } from "./ui/modal.js";
import { resetAll } from "./state/store.js";

import { uploadFiles, retryFull, retryScenarioOnly, goToProduction } from "./features/upload/uploadFiles.js";
import { reqFinalMerge } from "./features/production/reqFinalMerge.js";
import { reqImage } from "./features/production/reqImage.js";
import { reqAudio } from "./features/production/reqAudio.js";
import { reqVideo } from "./features/production/reqVideo.js";
import { resetUI } from "./ui/loader.js"; // resetUI는 loader.js에 함께 둠(화면 초기화 유틸)

bindEvents();
showSection("step1");

function bindEvents() {
  $("#btn-generate-plan").addEventListener("click", () => uploadFiles("new"));
  $("#btn-retry-scenario").addEventListener("click", retryScenarioOnly);
  $("#btn-retry-full").addEventListener("click", retryFull);
  $("#btn-go-production").addEventListener("click", goToProduction);

  $("#btn-final-merge").addEventListener("click", reqFinalMerge);

  $("#btn-reset").addEventListener("click", () => {
    resetAll();
    resetUI();
    showSection("step1");
  });

  // 모달
  $("#btn-close-modal").addEventListener("click", closeModal);
  $("#btn-close-modal-2").addEventListener("click", closeModal);
  $("#btn-copy-hashtags").addEventListener("click", copyHashtags);

  // 제작 화면 동적 버튼은 이벤트 위임
  document.addEventListener("click", (e) => {
    const imgBtn = e.target.closest(".btn-img");
    const audBtn = e.target.closest(".btn-aud");
    const vidBtn = e.target.closest(".btn-vid");

    if (imgBtn) reqImage(Number(imgBtn.dataset.scene));
    if (audBtn) reqAudio(Number(audBtn.dataset.scene));
    if (vidBtn) reqVideo(Number(vidBtn.dataset.scene));
  });
}
