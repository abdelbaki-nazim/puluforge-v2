// pages/api/stream-logs.ts OR app/api/stream-logs/route.ts (adjust path based on your Next.js version)

import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import JSZip from "jszip";

interface WorkflowRun {
  id: number;
  status: string; // in_progress, completed, queued etc.
  conclusion: string | null; // success, failure, cancelled, etc.
  logs_url: string;
}

// Helper to send SSE messages
function sendSseMessage(
  controller: ReadableStreamDefaultController,
  event: string,
  data: any
) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) {
    // Cannot return JSON for SSE, return a plain text error or status code
    return new Response("runId is required", { status: 400 });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    return new Response("GitHub token not configured", { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let previousLogs = "";
      let lastStatus = "";
      let lastConclusion = "";
      let attempts = 0;
      const maxAttempts = 20; // Limit polling attempts
      const pollInterval = 3000; // 3 seconds

      const poll = async () => {
        if (attempts >= maxAttempts) {
          sendSseMessage(controller, "error", {
            message: "Polling timeout reached.",
          });
          controller.close();
          return;
        }
        attempts++;

        try {
          // 1. Fetch workflow run status
          const runResponse = await fetch(
            `https://api.github.com/repos/abdelbaki-nazim/workflows/actions/runs/${runId}`, // Ensure this path is correct
            {
              headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (!runResponse.ok) {
            // Handle transient errors vs permanent ones
            if (runResponse.status === 404) {
              sendSseMessage(controller, "error", {
                message: `Run ${runId} not found.`,
              });
              controller.close();
              return;
            }
            console.error(
              `GitHub API error (Run Details): ${runResponse.status}`
            );
            // Retry on server errors
            if (runResponse.status >= 500) {
              setTimeout(poll, pollInterval);
              return;
            }
            // Otherwise, might be a persistent client error
            sendSseMessage(controller, "error", {
              message: `GitHub API Error: ${runResponse.status}`,
            });
            controller.close();
            return;
          }

          const runData = (await runResponse.json()) as WorkflowRun;

          // Send status update if changed
          const currentStatus = runData.status;
          const currentConclusion = runData.conclusion;
          if (
            currentStatus !== lastStatus ||
            currentConclusion !== lastConclusion
          ) {
            sendSseMessage(controller, "status", {
              status: currentStatus,
              conclusion: currentConclusion,
            });
            lastStatus = currentStatus;
            lastConclusion = currentConclusion as string;
          }

          // 2. Fetch logs if available
          // The logs_url might not be available immediately or might 404 until ready
          if (runData.logs_url) {
            try {
              const logsResponse = await fetch(runData.logs_url, {
                headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
                // Important: Add a timeout to avoid hanging requests
                // This requires node-fetch v3+ or a different fetch implementation
                // signal: AbortSignal.timeout(5000) // Example: 5 second timeout
              });

              if (logsResponse.ok) {
                const logsBuffer = await logsResponse.buffer();
                const zip = await JSZip.loadAsync(logsBuffer);
                let currentLogContent = "";

                // Combine logs from all files, maintaining order might be tricky
                // Often logs are named like '1_job_name.txt', '2_step_name.txt'
                // Sorting filenames can help ensure a more consistent order
                const sortedFilenames = Object.keys(zip.files).sort();

                for (const filename of sortedFilenames) {
                  const file = zip.files[filename];
                  if (!file.dir) {
                    const content = await file.async("text");
                    // Basic cleaning: Remove timestamps often added by GitHub Actions runner
                    const cleanedContent = content.replace(
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\s/gm,
                      ""
                    );
                    currentLogContent += `\n=== ${filename} ===\n${cleanedContent}\n`;
                  }
                }
                currentLogContent = currentLogContent.trim(); // Trim leading/trailing whitespace

                // Send only the new parts of the log
                if (
                  currentLogContent.length > previousLogs.length &&
                  currentLogContent.startsWith(previousLogs)
                ) {
                  const newLogPart = currentLogContent
                    .substring(previousLogs.length)
                    .trim();
                  if (newLogPart.length > 0) {
                    sendSseMessage(controller, "log", { lines: newLogPart });
                    previousLogs = currentLogContent; // Update the baseline
                  }
                } else if (
                  currentLogContent.length > 0 &&
                  currentLogContent !== previousLogs
                ) {
                  // If content differs significantly (not just appended), send the whole thing (or handle differently)
                  // For simplicity, we'll resend if it's not a simple append.
                  sendSseMessage(controller, "log", {
                    lines: currentLogContent,
                    replace: true,
                  }); // Add a flag?
                  previousLogs = currentLogContent;
                }
              } else if (logsResponse.status !== 404) {
                // Log URL exists but failed to fetch (and not a 404, which means it might just not be ready)
                console.error(
                  `GitHub API error (Logs Fetch): ${logsResponse.status}`
                );
                // Decide if this is fatal or worth retrying
              }
            } catch (zipError: any) {
              console.error("Error processing logs zip:", zipError);
              // Potentially retry or send an error message
              sendSseMessage(controller, "error", {
                message: `Error processing logs: ${zipError.message}`,
              });
            }
          }

          // 3. Check if the workflow run is finished
          if (runData.status === "completed") {
            sendSseMessage(controller, "status", {
              status: runData.status,
              conclusion: runData.conclusion,
            }); // Ensure final status sent
            // Optionally send one last full log dump if needed?
            sendSseMessage(controller, "done", {
              message: "Workflow completed.",
            });
            controller.close(); // Close the SSE connection
            return;
          }

          // Schedule the next poll
          setTimeout(poll, pollInterval);
        } catch (error: any) {
          console.error("Polling error:", error);
          sendSseMessage(controller, "error", {
            message: `Polling failed: ${error.message}`,
          });
          controller.close(); // Close on unexpected errors
        }
      };

      // Start the polling loop
      poll();

      // Handle client disconnection (optional but good practice)
      req.signal.addEventListener("abort", () => {
        console.log("Client disconnected");
        // Perform any cleanup if needed (e.g., clear timeouts)
        controller.close();
      });
    },

    cancel(reason) {
      console.log("SSE stream cancelled:", reason);
      // Cleanup if the stream is cancelled externally
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform", // Ensure no buffering by proxies
      Connection: "keep-alive",
    },
  });
}

// Note: For Edge Runtime compatibility, you might need to adjust fetch/Buffer usage
// and potentially avoid 'node-fetch' and 'jszip' if they aren't compatible.
// Consider using the native fetch and Web Streams API more directly if needed.
