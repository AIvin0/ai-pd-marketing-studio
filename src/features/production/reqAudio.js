import { genAudio } from "../../api/n8nClient.js";
import { pollAudio } from "../../polling/pollAudio.js";
import {
  store,
  beginSceneTask,
  attachScenePollStop,
  endSceneTask,
  isSceneTaskInFlight,
  isSceneTaskCurrent,
  cancelSceneTask,
} from "../../state/store.js";
import { setSceneSpinner, setSceneAudio, setTaskButtonState } from "../../ui/renderProduction.js";

function cacheBust(url) {
  if (!url) return url;
  const t = Date.now();
  return url.includes("?") ? `${url}&t=${t}` : `${url}?t=${t}`;
}

export async function reqAudio(sceneId) {
  if (!store.lastJobId) return alert("먼저 1~2단계에서 시나리오를 생성해주세요.");

  if (isSceneTaskInFlight(sceneId, "audio")) {
    const ok = confirm("내레이션 생성이 진행 중입니다.\n취소하고 다시 시작할까요?");
    if (!ok) return;
    cancelSceneTask(sceneId, "audio");
  }

  const scene = store.confirmedScenes.find((s) => s.scene_id === sceneId);
  const script = scene?.audio_narration || "";
  if (!script) return alert("내레이션 대사가 없습니다!");

  const container = document.getElementById(`audio-container-${sceneId}`);
  const oldUrl =
    container?.querySelector("source")?.src ||
    container?.querySelector("iframe")?.src ||
    null;
  const hasAudio = container && container.style.display !== "none" && oldUrl;

  const msg = hasAudio
    ? `기존 음성이 있습니다.\n덮어쓰고 재생성하시겠습니까?\n\n"${script}"`
    : `다음 대사로 음성을 생성하시겠습니까?\n\n"${script}"`;
  if (!confirm(msg)) return;

  const { requestId, signal } = beginSceneTask(sceneId, "audio");

  setTaskButtonState(sceneId, "audio", { disabled: true });
  setSceneSpinner(sceneId, true, "내레이션 생성 요청 중...");
  if (container) container.style.display = "none";

  try {
    await genAudio({ scene_id: sceneId, text: script, ref_job_id: store.lastJobId }, { signal });

    const stop = pollAudio({
      jobId: store.lastJobId,
      sceneId,
      oldUrl,
      signal,
      onDone: (url) => {
        if (!isSceneTaskCurrent(sceneId, "audio", requestId)) return;

        setSceneSpinner(sceneId, false);
        setTaskButtonState(sceneId, "audio", { disabled: false, text: "🔄 내레이션 재생성" });
        setSceneAudio(sceneId, cacheBust(url));
        alert(`Scene ${sceneId} 내레이션 생성 완료!`);

        endSceneTask(sceneId, "audio", requestId);
      },
      onTimeout: () => {
        if (!isSceneTaskCurrent(sceneId, "audio", requestId)) return;

        setSceneSpinner(sceneId, false);
        setTaskButtonState(sceneId, "audio", { disabled: false });
        alert("시간 초과: 오디오 생성 실패");
        if (container && hasAudio) container.style.display = "block";

        endSceneTask(sceneId, "audio", requestId);
      },
      onError: (e) => console.error("pollAudio error:", e),
    });

    attachScenePollStop(sceneId, "audio", stop);
  } catch (e) {
    if (!isSceneTaskCurrent(sceneId, "audio", requestId)) return;

    setSceneSpinner(sceneId, false);
    setTaskButtonState(sceneId, "audio", { disabled: false });
    alert("에러: " + e.message);
    if (container && hasAudio) container.style.display = "block";

    endSceneTask(sceneId, "audio", requestId);
  }
}
