import { uploadStep1 } from "../../api/n8nClient.js";
import { pollScenario } from "../../polling/pollScenario.js";
import {
  store,
  setLastJobId,
  setCachedSearchContext,
  setCurrentPlan,
  setConfirmedScenes,
  beginGlobalTask,
  attachGlobalPollStop,
  endGlobalTask,
  isGlobalTaskInFlight,
  isGlobalTaskCurrent,
} from "../../state/store.js";

import { showLoader, hideLoader } from "../../ui/loader.js";
import { showSection } from "../../ui/sections.js";
import { renderPlan, readScenesFromPlanDOM } from "../../ui/renderPlan.js";
import { renderProductionDashboard } from "../../ui/renderProduction.js";
import { $ } from "../../ui/dom.js";

export async function uploadFiles(mode = "new") {
  // ✅ 중복 시나리오 생성 방지(안정화)
  if (isGlobalTaskInFlight("scenario")) {
    const ok = confirm("현재 시나리오 생성이 진행 중입니다. 취소하고 새로 시작할까요?");
    if (!ok) return;
    // beginGlobalTask가 이전 작업 취소까지 처리
  }

  const product = $("#productFile").files[0];
  const characterFiles = $("#characterFile").files;
  const requestText = $("#userRequest").value;

  if (mode === "new" && (!product || characterFiles.length === 0)) {
    alert("상품 이미지와 캐릭터 이미지를 모두 등록해주세요.");
    return;
  }

  const { requestId, signal } = beginGlobalTask("scenario");

  showLoader(
    mode === "reuse"
      ? "기존 검색 결과를 바탕으로\n시나리오를 수정하고 있습니다..."
      : "제품 정보를 검색하고\n기획안을 작성 중입니다..."
  );

  const formData = new FormData();
  if (product) formData.append("product_image", product);
  for (let i = 0; i < characterFiles.length; i++) formData.append(`character_${i}`, characterFiles[i]);
  formData.append("user_request", requestText);

  if (mode === "reuse" && store.lastJobId) formData.append("ref_job_id", store.lastJobId);

  try {
    const res = await uploadStep1(formData, { signal });
    if (!isGlobalTaskCurrent("scenario", requestId)) return; // 구형 작업이면 무시

    const jobId = res?.job_id;
    if (!jobId) throw new Error("job_id가 없습니다.");

    setLastJobId(jobId);

    const stop = pollScenario({
      jobId,
      signal,
      onDone: ({ plan, searchResult }) => {
        if (!isGlobalTaskCurrent("scenario", requestId)) return;

        if (searchResult) setCachedSearchContext(searchResult);
        if (!plan) {
          hideLoader();
          alert("작업은 완료되었으나 plan 데이터 형식이 올바르지 않습니다.");
          endGlobalTask("scenario", requestId);
          return;
        }

        setCurrentPlan(plan);
        renderPlan(plan);
        hideLoader();
        showSection("step2");
        endGlobalTask("scenario", requestId);
      },
      onTimeout: () => {
        if (!isGlobalTaskCurrent("scenario", requestId)) return;
        hideLoader();
        alert("시간 초과: 서버 작업이 지연되고 있습니다.");
        showSection("step1");
        endGlobalTask("scenario", requestId);
      },
      onError: (e) => console.warn("scenario polling error:", e),
    });

    attachGlobalPollStop("scenario", stop);
  } catch (e) {
    if (!isGlobalTaskCurrent("scenario", requestId)) return;
    hideLoader();
    alert("작업 요청 중 오류 발생: " + e.message);
    showSection("step1");
    endGlobalTask("scenario", requestId);
  }
}

export async function retryScenarioOnly() {
  if (!store.lastJobId) return alert("이전 작업 기록이 없습니다.");
  if (!confirm("현재 제품 정보를 유지하고, 시나리오만 다시 작성하시겠습니까?")) return;
  await uploadFiles("reuse");
}

export async function retryFull() {
  if (!confirm("처음부터 다시 검색합니다.")) return;
  const newRequest = prompt("검색어(요청사항)를 수정하시겠습니까?", $("#userRequest").value);
  if (newRequest === null) return;
  $("#userRequest").value = newRequest;
  await uploadFiles("new");
}

export function goToProduction() {
  if (!confirm("제작을 시작하시겠습니까? (3단계로 이동)")) return;
  const scenes = readScenesFromPlanDOM();
  setConfirmedScenes(scenes);
  renderProductionDashboard();
  showSection("step3");
}
