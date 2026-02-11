import { genImage } from "../../api/n8nClient.js";
import { pollImage } from "../../polling/pollImage.js";
import {
  store,
  beginSceneTask,
  attachScenePollStop,
  endSceneTask,
  isSceneTaskInFlight,
  isSceneTaskCurrent,
  cancelSceneTask,
} from "../../state/store.js";
import { setSceneSpinner, setSceneImage, setTaskButtonState } from "../../ui/renderProduction.js";

function cacheBust(url) {
  if (!url) return url;
  const t = Date.now();
  return url.includes("?") ? `${url}&t=${t}` : `${url}?t=${t}`;
}

export async function reqImage(sceneId) {
  if (!store.lastJobId) return alert("먼저 1~2단계에서 시나리오를 생성해주세요.");

  // ✅ 연타 안정화: 이미 생성 중이면 취소/재시작 선택
  if (isSceneTaskInFlight(sceneId, "image")) {
    const ok = confirm("이미지 생성이 진행 중입니다. 취소하고 다시 시작할까요?");
    if (!ok) return;
    cancelSceneTask(sceneId, "image");
  }

  const scene = store.confirmedScenes.find((s) => s.scene_id === sceneId);
  if (!scene) return alert("씬 데이터를 찾을 수 없습니다.");

  const imgEl = document.getElementById(`img-${sceneId}`);
  const hasImg = imgEl && imgEl.style.display !== "none" && imgEl.src.startsWith("http");
  const oldUrl = hasImg ? imgEl.src : null;

  if (hasImg && !confirm("이미지가 이미 존재합니다. 덮어쓰고 새로 생성하시겠습니까?")) return;

  const { requestId, signal } = beginSceneTask(sceneId, "image");

  setTaskButtonState(sceneId, "image", { disabled: true });
  setSceneSpinner(sceneId, true, hasImg ? "이미지 재생성 중..." : "이미지 생성 요청 중...");

  try {
    await genImage(
      {
        scene_id: sceneId,
        visual_prompt: scene.visual_situation,
        text: scene.audio_narration,
        ref_job_id: store.lastJobId,
      },
      { signal }
    );

    const stop = pollImage({
      jobId: store.lastJobId,
      sceneId,
      oldUrl,
      signal,
      onDone: (url) => {
        if (!isSceneTaskCurrent(sceneId, "image", requestId)) return;

        setSceneSpinner(sceneId, false);
        setTaskButtonState(sceneId, "image", { disabled: false, text: "🔄 이미지 재생성" });
        setSceneImage(sceneId, cacheBust(url));

        endSceneTask(sceneId, "image", requestId);
      },
      onTimeout: () => {
        if (!isSceneTaskCurrent(sceneId, "image", requestId)) return;

        setSceneSpinner(sceneId, false);
        setTaskButtonState(sceneId, "image", { disabled: false });
        alert("이미지 생성 확인 시간이 초과되었습니다.");

        endSceneTask(sceneId, "image", requestId);
      },
      onError: (e) => console.error("pollImage error:", e),
    });

    attachScenePollStop(sceneId, "image", stop);
  } catch (e) {
    if (!isSceneTaskCurrent(sceneId, "image", requestId)) return;

    setSceneSpinner(sceneId, false);
    setTaskButtonState(sceneId, "image", { disabled: false });
    alert("에러: " + e.message);

    endSceneTask(sceneId, "image", requestId);
  }
}
