import { ENV, assertEnv } from "../config/env.js";

assertEnv();

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function uploadStep1(formData, { signal } = {}) {
  const res = await fetch(ENV.STEP1_UPLOAD, { method: "POST", body: formData, signal });
  if (!res.ok) throw new Error("서버 연결 실패(upload)");
  return res.json();
}

export async function getStatus(jobId, extraQuery = "", { signal } = {}) {
  const url = `${ENV.CHECK_STATUS}?job_id=${encodeURIComponent(jobId)}${extraQuery}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`상태 조회 실패(HTTP ${res.status})`);
  return safeJson(res);
}

export async function genImage(payload, { signal } = {}) {
  const res = await fetch(ENV.GEN_IMAGE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error("이미지 생성 요청 실패");
  return safeJson(res);
}

export async function genAudio(payload, { signal } = {}) {
  const res = await fetch(ENV.GEN_AUDIO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error("오디오 생성 요청 실패");
  return safeJson(res);
}

export async function genVideo(payload, { signal } = {}) {
  const res = await fetch(ENV.GEN_VIDEO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error("영상 생성 요청 실패");
  return safeJson(res);
}

export async function finalMerge(payload, { signal } = {}) {
  const res = await fetch(ENV.FINAL_MERGE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error("최종 합치기 요청 실패");
  return safeJson(res);
}
