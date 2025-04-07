"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Typography } from "@progress/kendo-react-common";
import styles from "./DeployedResourcesList.module.css";

// Local storage key for deployments
const LOCAL_STORAGE_KEY = "cloudDeployments";

// Define interfaces for type safety
interface StoredDeploymentOutput {
  s3?: { bucketName: string };
  rds?: { dbName: string; username: string };
  eks?: { requested: boolean };
}

interface StoredDeployment {
  runId: string;
  userId: string;
  stackName: string;
  timestamp: string;
  status: "success" | "failed" | "queued"; // Expanded status to match GitHub Actions
  outputs: StoredDeploymentOutput;
  requested: { createS3: boolean; createRDS: boolean; createEKS: boolean };
}

const DeployedResourcesList: React.FC = () => {
  const [deployments, setDeployments] = useState<StoredDeployment[]>([]);

  // Load deployments from local storage
  const loadDeployments = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.sort(
            (a: StoredDeployment, b: StoredDeployment) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setDeployments(parsed);
          return;
        }
        console.warn("cloudDeployments is not an array");
      }
      setDeployments([]);
    } catch (error) {
      console.error("Failed to load deployments:", error);
      setDeployments([]);
    }
  };

  // Clear all deployments
  const clearAllDeployments = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all stored deployment records? This cannot be undone."
      )
    ) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setDeployments([]);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (iso: string): string => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  // Load deployments on mount and listen for updates
  useEffect(() => {
    loadDeployments();
    const handleUpdated = () => loadDeployments();
    window.addEventListener("deploymentsUpdated", handleUpdated);
    return () =>
      window.removeEventListener("deploymentsUpdated", handleUpdated);
  }, []);

  return (
    <section className={styles.listContainer}>
      <header className={styles.listHeader}>
        <Typography.h3 className={styles.headerTitle}>
          Deployment History
        </Typography.h3>
        <Button
          themeColor="error"
          fillMode="solid"
          rounded="medium"
          size="medium"
          onClick={clearAllDeployments}
          disabled={deployments.length === 0}
          className={styles.clearButton}
        >
          Clear History
        </Button>
      </header>

      {deployments.length === 0 ? (
        <div className={styles.emptyState}>
          <Typography.p className={styles.emptyText}>
            No successful deployments yet. Start deploying to see your history!
          </Typography.p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.deploymentTable}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Deployment</th>
                <th>User</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((dep) => (
                <tr key={dep.runId}>
                  <td>
                    <span className={`${styles.statusIcon} ${styles.success}`}>
                      success
                    </span>
                  </td>
                  <td>
                    <div>{dep.stackName}</div>
                    <div className={styles.subText}>Run ID: {dep.runId}</div>
                  </td>
                  <td>{dep.userId}</td>
                  <td>{formatTimestamp(dep.timestamp)}</td>
                  <td>
                    <button className={styles.actionButton}>⋯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default DeployedResourcesList;
