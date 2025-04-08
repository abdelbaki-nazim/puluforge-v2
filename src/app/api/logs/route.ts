import { NextRequest } from "next/server";
import fetch from "node-fetch";
import JSZip from "jszip";

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  logs_url: string;
  run_started_at: string | null;
}

function sendSseMessage(
  controller: ReadableStreamDefaultController,
  event: string,
  data: any
) {
  controller.enqueue(
    new TextEncoder().encode(
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    )
  );
}

export async function GET(req: NextRequest) {
  const runIdParam = req.nextUrl.searchParams.get("runId");
  if (!runIdParam) {
    return new Response("runId query parameter is required", { status: 400 });
  }
  const runId = Number(runIdParam);
  if (isNaN(runId)) {
    return new Response("runId must be a number", { status: 400 });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    return new Response("GitHub token not configured", { status: 500 });
  }

  const OWNER = "abdelbaki-nazim";
  const REPO = "workflows";
  const RUN_DETAILS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${runId}`;

  const stream = new ReadableStream({
    async start(controller) {
      let lastStatus = "";
      let lastConclusion: string | null = null;
      let previousLogs = "";

      try {
        const initialRes = await fetch(RUN_DETAILS_URL, {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!initialRes.ok) {
          throw new Error(`Failed to fetch run ${runId}: ${initialRes.status}`);
        }
        const initialData = (await initialRes.json()) as WorkflowRun;
        sendSseMessage(controller, "run_found", {
          runId: initialData.id,
          initialStatus: initialData.status,
        });
        lastStatus = initialData.status;
        lastConclusion = initialData.conclusion;
      } catch (err: any) {
        sendSseMessage(controller, "error", { message: err.message });
        controller.close();
        return;
      }

      const pollInterval = 4000;
      const maxAttempts = 580;
      let attempts = 0;

      const poll = async () => {
        if (attempts++ >= maxAttempts) {
          sendSseMessage(controller, "error", {
            message: "Polling timeout reached.",
          });
          controller.close();
          return;
        }

        try {
          const runRes = await fetch(RUN_DETAILS_URL, {
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          });
          if (!runRes.ok) {
            throw new Error(`Status fetch failed: ${runRes.status}`);
          }
          const runData = (await runRes.json()) as WorkflowRun;

          if (
            runData.status !== lastStatus ||
            runData.conclusion !== lastConclusion
          ) {
            sendSseMessage(controller, "status", {
              status: runData.status,
              conclusion: runData.conclusion,
            });
            lastStatus = runData.status;
            lastConclusion = runData.conclusion;
          }

          if (runData.logs_url) {
            const logsRes = await fetch(runData.logs_url, {
              headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
            });
            if (logsRes.ok) {
              const buffer = await logsRes.buffer();
              const zip = await JSZip.loadAsync(buffer);
              let allText = "";
              for (const name of Object.keys(zip.files).sort()) {
                const file = zip.files[name];
                if (!file.dir && name.endsWith(".txt")) {
                  const text = await file.async("text");
                  allText += text
                    .replace(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\s/gm,
                      ""
                    )
                    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
                }
              }
              if (allText.startsWith(previousLogs)) {
                const delta = allText.slice(previousLogs.length);
                if (delta) sendSseMessage(controller, "log", { lines: delta });
              } else {
                // non‐sequential change, replace
                sendSseMessage(controller, "log", {
                  lines: allText,
                  replace: true,
                });
              }
              previousLogs = allText;
            }
          }

          if (runData.status === "completed") {
            const success = runData.conclusion === "success";
            sendSseMessage(controller, "done", {
              success,
              message: `Workflow ${runData.conclusion || "finished"}.`,
            });
            controller.close();
            return;
          }

          setTimeout(poll, pollInterval);
        } catch (err: any) {
          sendSseMessage(controller, "error", { message: err.message });
          controller.close();
        }
      };

      poll();
    },

    cancel(reason) {
      console.log("SSE cancelled:", reason);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
