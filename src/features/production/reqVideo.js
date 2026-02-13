import { genVideo } from "../../api/n8nClient.js";
import { pollVideo } from "../../polling/pollVideo.js";
import {
  store,
  beginSceneTask,
  attachScenePollStop,
  endSceneTask,
  isSceneTaskInFlight,
  isSceneTaskCurrent,
  cancelSceneTask,
} from "../../state/store.js";
import { setSceneSpinner, setSceneVideo, setTaskButtonState } from "../../ui/renderProduction.js";

function cacheBust(url) {
  if (!url) return url;
  const t = Date.now();
  return url.includes("?") ? `${url}&t=${t}` : `${url}?t=${t}`;
}

export async function reqVideo(sceneId) {
  if (!store.lastJobId) return alert("먼저 1~2단계에서 시나리오를 생성해주세요.");

  if (isSceneTaskInFlight(sceneId, "video")) {
    const ok = confirm("영상 생성이 진행 중입니다.\n취소하고 다시 시작할까요?");
    if (!ok) return;
    cancelSceneTask(sceneId, "video");
  }

  const scene = store.confirmedScenes.find((s) => s.scene_id === sceneId);
  if (!scene) return alert("씬 데이터를 찾을 수 없습니다.");

  const imgEl = document.getElementById(`img-${sceneId}`);
  if (!imgEl?.src || !imgEl.src.startsWith("http")) {
    alert("먼저 이미지를 생성해주세요.");
    return;
  }

  const vidEl = document.getElementById(`vid-${sceneId}`);
  const oldUrl = vidEl?.src || null;
  const hasVideo = vidEl && vidEl.style.display !== "none" && oldUrl;

  const ok = hasVideo
    ? confirm("영상이 이미 존재합니다.\n다시 생성하시겠습니까? (비용 발생)")
    : confirm("영상을 생성하시겠습니까? (비용 발생)");
  if (!ok) return;

  const { requestId, signal } = beginSceneTask(sceneId, "video");

  setTaskButtonState(sceneId, "video", { disabled: true });
  setSceneSpinner(sceneId, true, "영상 생성 요청 중...");
  if (vidEl) vidEl.style.display = "none";

  try {
    await genVideo(
      {
        scene_id: sceneId,
        image_url: imgEl.src,
        prompt: `${scene.visual_situation}, cinematic, 4k`,
        ref_job_id: store.lastJobId,
      },
      { signal }
    );

    const stop = pollVideo({
      jobId: store.lastJobId,
      sceneId,
      oldUrl,
      signal,
      onDone: (url) => {
        if (!isSceneTaskCurrent(sceneId, "video", requestId)) return;

        setSceneSpinner(sceneId, false);
        setTaskButtonState(sceneId, "video", { disabled: false, text: "🔄 영상 재생성" });
        setSceneVideo(sceneId, cacheBust(url));
        alert(`Scene ${sceneId} 영상 생성 완료!`);

        endSceneTask(sceneId, "video", requestId);
      },
      onTimeout: () => {
        if (!isSceneTaskCurrent(sceneId, "video", requestId)) return;

        setSceneSpinner(sceneId, false);
        setTaskButtonState(sceneId, "video", { disabled: false });
        alert("시간 초과: 영상 생성 실패.");

        endSceneTask(sceneId, "video", requestId);
      },
      onError: (e) => console.error("pollVideo error:", e),
    });

    attachScenePollStop(sceneId, "video", stop);
  } catch (e) {
    if (!isSceneTaskCurrent(sceneId, "video", requestId)) return;

    setSceneSpinner(sceneId, false);
    setTaskButtonState(sceneId, "video", { disabled: false });
    alert("에러: " + e.message);

    endSceneTask(sceneId, "video", requestId);
  }
}
