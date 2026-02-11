export const store = {
    lastJobId: null,
    cachedSearchContext: "",
    confirmedScenes: [],
    currentPlan: null,
  
    // 전역 작업(시나리오 생성/최종 머지) 안정화용
    globalTasks: {
      scenario: makeTaskState(),
      final: makeTaskState(),
    },
  
    // sceneId -> { image/audio/video taskState }
    tasksByScene: new Map(),
  };
  
  function makeTaskState() {
    return {
      inFlight: false,
      requestId: 0,
      stopPoll: null, // polling stop function
      controller: null, // AbortController
    };
  }
  
  function ensureScene(sceneId) {
    if (!store.tasksByScene.has(sceneId)) {
      store.tasksByScene.set(sceneId, {
        image: makeTaskState(),
        audio: makeTaskState(),
        video: makeTaskState(),
      });
    }
    return store.tasksByScene.get(sceneId);
  }
  
  export function resetAll() {
    // stop all polls + abort
    // global
    cancelGlobalTask("scenario");
    cancelGlobalTask("final");
  
    // scenes
    for (const [sceneId] of store.tasksByScene.entries()) {
      cancelSceneTask(sceneId, "image");
      cancelSceneTask(sceneId, "audio");
      cancelSceneTask(sceneId, "video");
    }
    store.tasksByScene.clear();
  
    store.lastJobId = null;
    store.cachedSearchContext = "";
    store.confirmedScenes = [];
    store.currentPlan = null;
  }
  
  /* ---------- getters / setters ---------- */
  export function setLastJobId(jobId) {
    store.lastJobId = jobId;
  }
  export function setCachedSearchContext(text) {
    store.cachedSearchContext = text || "";
  }
  export function setConfirmedScenes(scenes) {
    store.confirmedScenes = scenes || [];
  }
  export function setCurrentPlan(plan) {
    store.currentPlan = plan || null;
  }
  
  export function getSceneTask(sceneId, kind) {
    return ensureScene(sceneId)[kind];
  }
  export function isSceneTaskInFlight(sceneId, kind) {
    return getSceneTask(sceneId, kind).inFlight;
  }
  export function isSceneTaskCurrent(sceneId, kind, requestId) {
    return getSceneTask(sceneId, kind).requestId === requestId;
  }
  
  /* ---------- task lifecycle: scene ---------- */
  export function beginSceneTask(sceneId, kind) {
    // 같은 kind 작업이 이미 돌고 있으면 먼저 cancel 후 새로 시작(안전)
    cancelSceneTask(sceneId, kind);
  
    const t = getSceneTask(sceneId, kind);
    t.inFlight = true;
    t.requestId += 1;
    t.controller = new AbortController();
    t.stopPoll = null;
  
    return { requestId: t.requestId, signal: t.controller.signal };
  }
  
  export function attachScenePollStop(sceneId, kind, stopFn) {
    const t = getSceneTask(sceneId, kind);
    t.stopPoll = typeof stopFn === "function" ? stopFn : null;
  }
  
  export function endSceneTask(sceneId, kind, requestId) {
    const t = getSceneTask(sceneId, kind);
    // 현재 토큰이 아니면(=구형 작업) 종료 처리하지 않음
    if (t.requestId !== requestId) return;
  
    t.inFlight = false;
    t.stopPoll = null;
    t.controller = null;
  }
  
  export function cancelSceneTask(sceneId, kind) {
    const t = getSceneTask(sceneId, kind);
    if (t.stopPoll) {
      try {
        t.stopPoll();
      } catch {}
    }
    if (t.controller) {
      try {
        t.controller.abort();
      } catch {}
    }
    t.inFlight = false;
    t.stopPoll = null;
    t.controller = null;
  }
  
  /* ---------- task lifecycle: global ---------- */
  export function beginGlobalTask(name /* scenario|final */) {
    cancelGlobalTask(name);
  
    const t = store.globalTasks[name];
    t.inFlight = true;
    t.requestId += 1;
    t.controller = new AbortController();
    t.stopPoll = null;
  
    return { requestId: t.requestId, signal: t.controller.signal };
  }
  
  export function attachGlobalPollStop(name, stopFn) {
    const t = store.globalTasks[name];
    t.stopPoll = typeof stopFn === "function" ? stopFn : null;
  }
  
  export function endGlobalTask(name, requestId) {
    const t = store.globalTasks[name];
    if (t.requestId !== requestId) return;
    t.inFlight = false;
    t.stopPoll = null;
    t.controller = null;
  }
  
  export function cancelGlobalTask(name) {
    const t = store.globalTasks[name];
    if (t.stopPoll) {
      try {
        t.stopPoll();
      } catch {}
    }
    if (t.controller) {
      try {
        t.controller.abort();
      } catch {}
    }
    t.inFlight = false;
    t.stopPoll = null;
    t.controller = null;
  }
  
  export function isGlobalTaskInFlight(name) {
    return store.globalTasks[name].inFlight;
  }
  export function isGlobalTaskCurrent(name, requestId) {
    return store.globalTasks[name].requestId === requestId;
  }
  