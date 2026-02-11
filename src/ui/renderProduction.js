import { $ } from "./dom.js";
import { store } from "../state/store.js";

export function renderProductionDashboard() {
  const container = $("#productionDisplay");
  let html = "";

  store.confirmedScenes.forEach((scene) => {
    html += `
    <div class="scene-card" style="border-left: 5px solid #28a745;">
      <div class="scene-header" style="background:#e8f5e9;">
        <span class="scene-badge" style="background:#2e7d32;">SCENE ${scene.scene_id}</span>
        <span class="time-badge">${scene.time_range}</span>
      </div>

      <div class="scene-body">
        <div style="background:#f9f9f9; padding:10px; border-radius:5px; font-size:14px; color:#555; margin-bottom:10px;">
          <strong>[Visual]:</strong> ${scene.visual_situation}<br>
          <strong>[Audio]:</strong> ${scene.audio_narration}
        </div>

        <div class="media-control-box" style="border:1px solid #ddd; padding:10px; border-radius:8px;">
          <div style="width:100%; aspect-ratio: 9 / 16; max-height: 75vh; background:#000; margin: 0 auto 10px auto; display:flex; align-items:center; justify-content:center; border-radius:4px; overflow:hidden; position:relative;">
            <img id="img-${scene.scene_id}" src="" style="width:100%; height:100%; object-fit:cover; display:none;">
            <video id="vid-${scene.scene_id}" src="" controls style="width:100%; height:100%; object-fit:cover; display:none;"></video>
            <span id="placeholder-${scene.scene_id}" style="color:#888; font-size:14px;">(미디어 없음)</span>

            <div id="loader-${scene.scene_id}" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); color:white; display:none; flex-direction:column; align-items:center; justify-content:center; z-index:10;">
              <div style="font-size:32px; margin-bottom:10px;">⏳</div>
              <div id="loader-text-${scene.scene_id}" style="font-size:16px; font-weight:bold;">작업 중...</div>
            </div>
          </div>

          <div id="audio-container-${scene.scene_id}" style="margin-bottom:10px; text-align:center; display:none;"></div>

          <div style="display:flex; gap:5px;">
            <button class="btn-primary btn-img" data-scene="${scene.scene_id}" style="margin:0; background:#5c6bc0; flex:1;">🎨 1. 이미지</button>
            <button class="btn-info btn-aud" data-scene="${scene.scene_id}" style="margin:0; background:#17a2b8; color:white; flex:1;">🎙️ 2. 내레이션</button>
            <button class="btn-warning btn-vid" data-scene="${scene.scene_id}" style="margin:0; display:none; flex:1;">🎬 3. 영상</button>
          </div>
        </div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

// ✅ 버튼 상태 제어 (안정화용)
export function setTaskButtonState(sceneId, kind /* image|audio|video */, { disabled, text, show } = {}) {
    const cls = kind === "image" ? ".btn-img" : kind === "audio" ? ".btn-aud" : ".btn-vid";
    const btn = document.querySelector(`${cls}[data-scene="${sceneId}"]`);
    if (!btn) return;
  
    if (typeof show === "boolean") btn.style.display = show ? "block" : "none";
    if (typeof disabled === "boolean") btn.disabled = disabled;
    if (typeof text === "string") btn.innerText = text;
  }
  

export function setSceneSpinner(sceneId, show, text = "작업 중...") {
  const sp = document.getElementById(`loader-${sceneId}`);
  const tx = document.getElementById(`loader-text-${sceneId}`);
  if (!sp || !tx) return;
  sp.style.display = show ? "flex" : "none";
  tx.innerText = text;
}

export function setSceneImage(sceneId, url) {
  const img = document.getElementById(`img-${sceneId}`);
  const vid = document.getElementById(`vid-${sceneId}`);
  const ph = document.getElementById(`placeholder-${sceneId}`);
  if (!img || !ph) return;

  if (vid) vid.style.display = "none";
  ph.style.display = "none";
  img.src = url;
  img.style.display = "block";

  const vidBtn = document.querySelector(`.btn-vid[data-scene="${sceneId}"]`);
  if (vidBtn) vidBtn.style.display = "block";

  const imgBtn = document.querySelector(`.btn-img[data-scene="${sceneId}"]`);
  if (imgBtn) imgBtn.innerText = "🔄 이미지 재생성";
}

export function setSceneAudio(sceneId, url) {
  const container = document.getElementById(`audio-container-${sceneId}`);
  if (!container) return;

  container.style.display = "block";

  if (url.includes("drive.google.com")) {
    const idMatch = url.match(/[-\w]{25,}/);
    const driveId = idMatch ? idMatch[0] : null;
    if (driveId) {
      container.innerHTML = `<iframe src="https://drive.google.com/file/d/${driveId}/preview" width="100%" height="100" frameborder="0" allow="autoplay"></iframe>`;
    } else {
      container.innerHTML = `<audio controls style="width:100%;"><source src="${url}" type="audio/mpeg"></audio>`;
    }
  } else {
    container.innerHTML = `<audio controls preload="metadata" style="width:100%; height:40px;"><source src="${url}" type="audio/mpeg"></audio>`;
  }

  const btn = document.querySelector(`.btn-aud[data-scene="${sceneId}"]`);
  if (btn) btn.innerText = "🔄 내레이션 재생성";
}

export function setSceneVideo(sceneId, url) {
  const img = document.getElementById(`img-${sceneId}`);
  const vid = document.getElementById(`vid-${sceneId}`);
  if (!vid) return;

  if (img) img.style.display = "none";
  vid.src = url;
  vid.style.display = "block";

  const btn = document.querySelector(`.btn-vid[data-scene="${sceneId}"]`);
  if (btn) btn.innerText = "🔄 영상 재생성";
}

export function renderFinalResultCard(finalUrl, hashtags) {
  const container = $("#finalResultDisplay");
  container.innerHTML = `
    <div class="scene-card" style="border-left: 5px solid #6f42c1; box-shadow: 0 4px 15px rgba(111, 66, 193, 0.2);">
      <div class="scene-header" style="background: #f3e5f5;">
        <span class="scene-badge" style="background: #6f42c1;">✨ MASTER VERSION</span>
        <span class="time-badge" style="color:#6f42c1;">한국어 원본</span>
      </div>
      <div class="scene-body">
        <div style="width:100%; aspect-ratio:9/16; background:black; border-radius:8px; overflow:hidden; margin:0 auto;">
          <video src="${finalUrl}" controls style="width:100%; height:100%;"></video>
        </div>

        <div class="hashtag-area" style="margin-top:15px; background:#fff; border:1px solid #ddd;">
          <strong>🏷️ 추천 해시태그:</strong><br>
          ${hashtags || "#영상제작완료"}
        </div>

        <div style="display:flex; gap:10px; margin-top:10px;">
          <a href="${finalUrl}" class="btn-success" style="text-decoration:none; text-align:center; padding:14px; border-radius:8px; flex:1;">💾 다운로드</a>
          <button class="btn-primary" style="background:#444; flex:1;" onclick="alert('준비 중: 영어 변환 기능')">🇺🇸 English Ver.</button>
          <button class="btn-primary" style="background:#444; flex:1;" onclick="alert('준비 중: 중국어 변환 기능')">🇨🇳 Chinese Ver.</button>
        </div>
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: "smooth" });
}
