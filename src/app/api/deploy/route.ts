import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

export async function POST(req: NextRequest) {
  try {
    const { userId, createS3, createRDS, createEKS, s3BucketName } =
      await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
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

    if (response.ok) {
      return NextResponse.json(
        { message: "Deployment triggered" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Deployment failed" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.log(error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
