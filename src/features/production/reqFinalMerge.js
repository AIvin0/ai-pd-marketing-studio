import { finalMerge } from "../../api/n8nClient.js";
import { pollFinal } from "../../polling/pollFinal.js";
import {
  store,
  beginGlobalTask,
  attachGlobalPollStop,
  endGlobalTask,
  isGlobalTaskInFlight,
  isGlobalTaskCurrent,
} from "../../state/store.js";
import { showLoader, hideLoader } from "../../ui/loader.js";
import { renderFinalResultCard } from "../../ui/renderProduction.js";

export async function reqFinalMerge() {
  if (!store.lastJobId) return alert("먼저 시나리오를 생성해주세요.");

  if (isGlobalTaskInFlight("final")) {
    alert("최종 영상 합치기가 이미 진행 중입니다.");
    return;
  }

  if (!confirm("최종 영상을 생성하시겠습니까?\n(완료 시 결과가 표시됩니다)")) return;

  const { requestId, signal } = beginGlobalTask("final");
  showLoader("영상 제작 요청 중...");

  try {
    await finalMerge({ job_id: store.lastJobId }, { signal });

    const stop = pollFinal({
      jobId: store.lastJobId,
      signal,
      onDone: ({ finalUrl, hashtags }) => {
        if (!isGlobalTaskCurrent("final", requestId)) return;

        hideLoader();
        renderFinalResultCard(finalUrl, hashtags);
        alert("🎉 최종 영상 제작이 완료되었습니다!");
        endGlobalTask("final", requestId);
      },
      onTimeout: () => {
        if (!isGlobalTaskCurrent("final", requestId)) return;

        hideLoader();
        alert("생성 시간 초과.\nAirtable을 확인해주세요.");
        endGlobalTask("final", requestId);
      },
      onError: (e) => console.error("pollFinal error:", e),
    });

    attachGlobalPollStop("final", stop);
  } catch (e) {
    if (!isGlobalTaskCurrent("final", requestId)) return;
    hideLoader();
    alert("요청 중 에러 발생: " + e.message);
    endGlobalTask("final", requestId);
  }
}
