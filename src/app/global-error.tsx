"use client";

import { useEffect } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Card, CardHeader, CardBody } from "@progress/kendo-react-layout";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Caught error:", error);
  }, [error]);

  return (
    <div style={{ margin: "20px", display: "flex", justifyContent: "center" }}>
      <Card style={{ maxWidth: "400px", textAlign: "center" }}>
        <CardHeader>
          <h1>An error has occurred!</h1>
        </CardHeader>
        <CardBody>
          <Button onClick={reset} themeColor="primary">
            Retry
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
