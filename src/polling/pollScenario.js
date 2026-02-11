import { getStatus } from "../api/n8nClient.js";
import { startPoll } from "./poller.js";

function normalizePlanData(statusData) {
  let planData = statusData?.data || statusData?.record;
  if (typeof planData === "string") {
    try {
      planData = JSON.parse(planData);
    } catch {}
  }
  if (Array.isArray(planData)) planData = planData[0];
  return planData || null;
}

export function pollScenario({
  jobId,
  signal,
  intervalMs = 3000,
  maxAttempts = 600,
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

      if (statusData.status === "done") {
        const plan = normalizePlanData(statusData);
        return {
          done: true,
          value: {
            plan,
            searchResult: statusData.search_result || null,
            raw: statusData,
          },
        };
      }
      return { done: false };
    },
    onDone,
    onTimeout,
    onError,
  });
}
