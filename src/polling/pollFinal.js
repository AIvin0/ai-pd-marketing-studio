import { getStatus } from "../api/n8nClient.js";
import { startPoll } from "./poller.js";

function normalizeFields(statusData) {
  let record = statusData?.data || statusData?.record || statusData;
  if (Array.isArray(record)) record = record[0];
  if (!record) return null;
  return record.fields || record;
}

export function pollFinal({
  jobId,
  signal,
  intervalMs = 2000,
  maxAttempts = 120,
  onDone,
  onTimeout,
  onError,
}) {
  return startPoll({
    intervalMs,
    maxAttempts,
    signal,
    run: async ({ signal }) => {
      const ts = Date.now();
      const statusData = await getStatus(jobId, `&t=${ts}`, { signal });
      if (!statusData) return { done: false };

      const fields = normalizeFields(statusData);
      if (!fields) return { done: false };

      const finalUrl =
        fields.Final_Video_Url ||
        fields.final_video_url ||
        fields["Final Video Url"] ||
        fields["Video_Result"] ||
        (Array.isArray(fields.Final_Video_Url) ? fields.Final_Video_Url[0]?.url : null);

      if (finalUrl && typeof finalUrl === "string" && finalUrl.startsWith("http")) {
        const hashtags = fields.Hashtags || fields.hashtags || fields["Hash Tags"] || "#영상제작완료";
        return { done: true, value: { finalUrl, hashtags } };
      }
      return { done: false };
    },
    onDone,
    onTimeout,
    onError,
  });
}
