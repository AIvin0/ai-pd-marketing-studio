export const ENV = {
    STEP1_UPLOAD: import.meta.env.VITE_URL_STEP1_UPLOAD,
    CHECK_STATUS: import.meta.env.VITE_URL_CHECK_STATUS,
    GEN_IMAGE: import.meta.env.VITE_URL_GEN_IMAGE,
    GEN_VIDEO: import.meta.env.VITE_URL_GEN_VIDEO,
    GEN_AUDIO: import.meta.env.VITE_URL_GEN_AUDIO,
    FINAL_MERGE: import.meta.env.VITE_URL_FINAL_MERGE,
  };
  
  export function assertEnv() {
    const missing = Object.entries(ENV)
      .filter(([, v]) => !v)
      .map(([k]) => k);
  
    if (missing.length) {
      // 프론트에서 완전 차단할 건 아니고, 개발 중 빠르게 확인용
      console.warn("[ENV Missing]", missing);
    }
  }
  