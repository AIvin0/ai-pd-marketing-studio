const API_BASE = import.meta.env.VITE_API_BASE;

export const ENV = {
  API_BASE,
  // 프론트는 n8n을 몰라야 하므로 proxy 경로만 정의
  STEP1_UPLOAD_PATH: "/api/step1/upload",
  CHECK_STATUS_PATH: "/api/check-status",
  GEN_IMAGE_PATH: "/api/gen-image",
  GEN_VIDEO_PATH: "/api/gen-video",
  GEN_AUDIO_PATH: "/api/gen-audio",
  FINAL_MERGE_PATH: "/api/final-merge",
};

// ✅ 실제 요청 URL 생성 헬퍼
export function apiUrl(path, queryString = "") {
  if (!ENV.API_BASE) return path; // 개발 중 방어
  const base = ENV.API_BASE.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}${queryString}`;
}

export function assertEnv() {
  const missing = [];
  if (!ENV.API_BASE) missing.push("VITE_API_BASE");

  if (missing.length) {
    console.warn("[ENV Missing]", missing);
  }
}
