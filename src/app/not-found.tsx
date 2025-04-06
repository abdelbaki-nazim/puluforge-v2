"use client";

import Link from "next/link";
import { Button } from "@progress/kendo-react-buttons";
import { Card, CardBody } from "@progress/kendo-react-layout";
import { Typography } from "@progress/kendo-react-common";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card style={{ maxWidth: "460px", textAlign: "center", padding: 8 }}>
        <CardBody>
          <Typography.h1 style={{ marginBottom: "0.5rem" }}>404</Typography.h1>
          <Typography.p style={{ marginBottom: "1.5rem", fontSize: "1.1rem" }}>
            Oops! The page you are looking for does not exist.
          </Typography.p>
          <Link href="/">
            <Button themeColor="primary">Return to Home</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
