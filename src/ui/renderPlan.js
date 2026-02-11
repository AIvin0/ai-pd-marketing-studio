import { $ } from "./dom.js";
import { store } from "../state/store.js";

export function renderPlan(plan) {
  const display = $("#planDisplay");
  const searchContent = plan.product_features || store.cachedSearchContext || "검색 결과가 없습니다.";

  let html = `
    <div class="search-result-card">
      <div class="search-header">
        <span class="search-badge">🔍 AI 시장 조사 및 제품 분석</span>
        <span class="search-title" contenteditable="true">${plan.product_name || "제품 분석 결과"}</span>
      </div>
      <div class="search-content" contenteditable="true">${searchContent}</div>
    </div>

    <div class="meta-info">
      <div class="meta-label">Core Concept (기획 의도)</div>
      <div class="meta-content" contenteditable="true" id="edit-concept">${plan.core_concept || "컨셉 내용 없음"}</div>

      <div class="meta-label" style="margin-top:15px;">Target Audience (타겟)</div>
      <div class="meta-content" contenteditable="true" id="edit-target">${plan.target_audience || "타겟 내용 없음"}</div>
    </div>
  `;

  if (Array.isArray(plan.scenario_scenes)) {
    plan.scenario_scenes.forEach((scene, index) => {
      html += `
      <div class="scene-card" id="scene-card-${index}">
        <div class="scene-header">
          <span class="scene-badge">SCENE ${scene.scene_id || index + 1}</span>
          <span class="time-badge">⏱️ ${scene.time_range || "00:00"}</span>
          <input type="hidden" class="data-time" value="${scene.time_range || ""}">
        </div>
        <div class="scene-body">
          <div class="row-item">
            <div class="icon-box">👁️</div>
            <div class="text-box-wrap">
              <span class="label-tiny">VISUAL SITUATION</span>
              <div class="editable-area visual-text" contenteditable="true">${scene.visual_situation || ""}</div>
            </div>
          </div>
          <div class="row-item">
            <div class="icon-box">🎙️</div>
            <div class="text-box-wrap">
              <span class="label-tiny">AUDIO / NARRATION</span>
              <div class="editable-area audio-text" contenteditable="true">${scene.audio_narration || ""}</div>
            </div>
          </div>
          <div class="row-item">
            <div class="icon-box">🔤</div>
            <div class="text-box-wrap">
              <span class="label-tiny">SCREEN TEXT</span>
              <div class="editable-area screen-text" contenteditable="true">${scene.screen_text || ""}</div>
            </div>
          </div>
        </div>
      </div>`;
    });
  }

  display.innerHTML = html;
}

export function readScenesFromPlanDOM() {
  const cards = document.querySelectorAll("#planDisplay .scene-card");
  const scenes = [];
  cards.forEach((card, idx) => {
    scenes.push({
      scene_id: idx + 1,
      time_range: card.querySelector(".data-time")?.value || "",
      visual_situation: card.querySelector(".visual-text")?.innerText || "",
      audio_narration: card.querySelector(".audio-text")?.innerText || "",
      screen_text: card.querySelector(".screen-text")?.innerText || "",
    });
  });
  return scenes;
}
