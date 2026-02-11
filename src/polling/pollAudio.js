import { getStatus } from "../api/n8nClient.js";
import { startPoll } from "./poller.js";

function normalizeFields(statusData) {
  let record = statusData?.data || statusData?.record || statusData;
  if (Array.isArray(record)) record = record[0];
  if (!record) return null;
  return record.fields || record;
}

function extractUrl(fields, key) {
  const raw = fields?.[key];
  if (Array.isArray(raw) && raw[0]?.url) return raw[0].url;
  if (typeof raw === "string" && raw.startsWith("http")) return raw;
  return null;
}

export function pollAudio({
  jobId,
  sceneId,
  oldUrl = null,
  signal,
  intervalMs = 3000,
  maxAttempts = 60,
  onDone,
  onTimeout,
  onError,
}) {
  return startPoll({
    intervalMs,
    maxAttempts,
    signal,
    run: async ({ signal }) => {
      const statusData = await getStatus(jobId, "", { signal });
      if (!statusData) return { done: false };

      const fields = normalizeFields(statusData);
      if (!fields) return { done: false };

      const key = `scene_${sceneId}_audio`;
      const url = extractUrl(fields, key);

      if (!url) return { done: false };
      if (!oldUrl || url !== oldUrl) return { done: true, value: url };

      return { done: false };
    },
    onDone,
    onTimeout,
    onError,
  });
}
