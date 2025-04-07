import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

interface Database {
  dbName: string;
  username: string;
  password: string;
}

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  logs_url: string;
  run_started_at: string | null;
}

interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      createS3,
      createRDS,
      createEKS,
      s3BucketName,
      databases,
      clusterName,
    } = await req.json();

    console.log(      userId,
      createS3,
      createRDS,
      createEKS,
      s3BucketName,
      databases,
      clusterName,);
    

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const firstDatabase: Database | null =
      Array.isArray(databases) && databases.length > 0 ? databases[0] : null;

    const dispatchTime = new Date().toISOString();
    const DISPATCH_URL =
      "https://api.github.com/repos/abdelbaki-nazim/workflows/actions/workflows/deploy.yml/dispatches";

    const inputs: Record<string, string> = {
      userId,
      createS3: String(createS3),
      createRDS: String(createRDS),
      createEKS: String(createEKS),
      s3BucketName: s3BucketName || "",
      clusterName: clusterName || "",
    };

    if (firstDatabase) {
      inputs.dbName = firstDatabase.dbName;
      inputs.dbUsername = firstDatabase.username;
      inputs.dbPassword = firstDatabase.password;
    }

    const dispatchRes = await fetch(DISPATCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs,
      }),
    });

    if (!dispatchRes.ok) {
      return NextResponse.json(
        { error: "Failed to trigger workflow" },
        { status: dispatchRes.status }
      );
    }

    const RUNS_URL =
      "https://api.github.com/repos/abdelbaki-nazim/workflows/actions/workflows/deploy.yml/runs?per_page=5";
    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    };

    const MAX_ATTEMPTS = 10;
    const POLL_INTERVAL_MS = 2000;
    let runId: number | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const runsRes = await fetch(RUNS_URL, { headers });
      if (!runsRes.ok) {
        throw new Error(
          `Failed to fetch workflow runs (status ${runsRes.status})`
        );
      }

      const { workflow_runs } = (await runsRes.json()) as WorkflowRunsResponse;
      const match = workflow_runs.find(
        (r) => r.run_started_at && r.run_started_at > dispatchTime
      );

      if (match) {
        runId = match.id;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    if (!runId) {
      return NextResponse.json(
        { error: "Timed out waiting for the new workflow run" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Deployment triggered", runId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Deploy API error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
