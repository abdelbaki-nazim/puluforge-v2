import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  logs_url: string;
}

interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
}

export async function POST(req: NextRequest) {
  try {
    const { userId, createS3, createRDS, createEKS, s3BucketName } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const dispatchResponse = await fetch(
      "https://api.github.com/repos/abdelbaki-nazim/workflows/actions/workflows/deploy.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            userId,
            createS3: String(createS3),
            createRDS: String(createRDS),
            createEKS: String(createEKS),
            s3BucketName,
          },
        }),
      }
    );

    if (!dispatchResponse.ok) {
      return NextResponse.json({ error: "Failed to trigger workflow" }, { status: dispatchResponse.status });
    }

    const runsResponse = await fetch(
      "https://api.github.com/repos/abdelbaki-nazim/workflows/actions/workflows/deploy.yml/runs",
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!runsResponse.ok) {
      throw new Error("Failed to fetch workflow runs");
    }

    const runsData = (await runsResponse.json()) as WorkflowRunsResponse;
    const latestRun = runsData.workflow_runs[0];

    if (!latestRun) {
      throw new Error("No workflow runs found");
    }

    return NextResponse.json({
      message: "Deployment triggered",
      runId: latestRun.id,
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}