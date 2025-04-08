"use client";

import React, { useState, useEffect, useRef, useCallback, JSX } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import {
  Form,
  Field,
  FormElement,
  FormRenderProps,
} from "@progress/kendo-react-form";
import { Card, CardTitle, CardBody } from "@progress/kendo-react-layout";
import { Typography } from "@progress/kendo-react-common";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import { Stepper, StepperChangeEvent } from "@progress/kendo-react-layout";
import styles from "./DeploymentForm.module.css";
import DeployedResourcesList from "./DeployedResourcesList";

// --- Interfaces ---
interface DatabaseConfig {
  dbName: string;
  username: string;
  password: string;
}

interface FormValues {
  userId: string;
  createS3: boolean;
  createRDS: boolean;
  createEKS: boolean;
  clusterName: string;
  s3BucketName: string;
  databases: DatabaseConfig[];
}

interface StoredDeploymentOutput {
  s3?: { bucketName: string };
  rds?: {
    dbName: string;
    username: string;
  };
  eks?: { requested: boolean };
}

interface StoredDeployment {
  runId: string;
  userId: string;
  stackName: string;
  timestamp: string;
  status: "success" | "failed";
  outputs: StoredDeploymentOutput;
  requested: { createS3: boolean; createRDS: boolean; createEKS: boolean };
}

const steps = [
  { label: "User Info" },
  { label: "Resource Selection" },
  { label: "Configuration" },
  { label: "Deploy" },
];
const LOCAL_STORAGE_KEY = "cloudDeployments";

interface ImageCheckboxProps {
  id: string;
  name: string;
  label: string;
  imageSrc: string;
  formRenderProps: FormRenderProps;
}

const ImageCheckbox = ({
  id,
  name,
  label,
  imageSrc,
  formRenderProps,
}: ImageCheckboxProps) => {
  const [checked, setChecked] = useState(!!formRenderProps.valueGetter(name));
  useEffect(() => {
    setChecked(!!formRenderProps.valueGetter(name));
  }, [formRenderProps.valueGetter, name]);

  const handleChange = () => {
    const currentlyChecked = formRenderProps.valueGetter(name);
    const newValue = !currentlyChecked;

    if (newValue) {
      const otherResources = ["createS3", "createRDS", "createEKS"].filter(
        (resName) => resName !== name
      );
      otherResources.forEach((resName) => {
        if (formRenderProps.valueGetter(resName)) {
          formRenderProps.onChange(resName, { value: false });
        }
      });
    }
    setChecked(newValue);
    formRenderProps.onChange(name, { value: newValue });
  };

  return (
    <div
      className={`${styles.imageCheckbox} ${checked ? styles.selected : ""}`}
      onClick={handleChange}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleChange();
        }
      }}
    >
      <img src={imageSrc} alt={label} className={styles.checkboxImage} />
      <p>{label}</p>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        readOnly
        style={{ display: "none" }}
      />
    </div>
  );
};

const DeploymentForm = () => {
  const [step, setStep] = useState(0);
  const [initialFormValues] = useState<FormValues>({
    userId: "",
    createS3: false,
    createRDS: false,
    createEKS: false,
    clusterName: "",
    s3BucketName: "",
    databases: [{ dbName: "", username: "", password: "" }],
  });

  const currentRunIdRef = useRef<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logOutput, setLogOutput] = useState<string>("");
  const [deploymentStatus, setDeploymentStatus] = useState<string>("idle");
  const [deploymentConclusion, setDeploymentConclusion] = useState<
    string | null
  >(null);
  const [showTriggerNotification, setShowTriggerNotification] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalDeploymentMessage, setFinalDeploymentMessage] = useState<{
    type: "success" | "error";
    message: string;
    details?: string;
  } | null>(null);

  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (
      isDeploying &&
      (deploymentStatus === "running" || deploymentStatus === "queued")
    ) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 95 ? 95 : prev + 5));
      }, 800);
    } else if (
      deploymentStatus === "completed" &&
      deploymentConclusion === "success"
    ) {
      setProgress(100);
    } else if (
      deploymentStatus === "failed" ||
      (deploymentStatus === "completed" && deploymentConclusion !== "success")
    ) {
      setProgress(0);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isDeploying, deploymentStatus, deploymentConclusion]);

  useEffect(() => {
    if (logContainerRef.current && logOutput && isDeploying) {
      const pre = logContainerRef.current.querySelector("pre");
      if (pre) pre.scrollTop = pre.scrollHeight;
    }
  }, [logOutput, isDeploying]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const saveDeploymentToLocalStorage = (deploymentData: StoredDeployment) => {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      let deployments: StoredDeployment[] = existing
        ? JSON.parse(existing)
        : [];
      if (!Array.isArray(deployments)) deployments = [];
      deployments.push(deploymentData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(deployments));
      console.log("Deployment saved:", deploymentData);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  const setupEventSource = useCallback(
    (runId: string, submittedData: FormValues) => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      setLogOutput("");
      setDeploymentStatus("queued");
      setIsDeploying(true);
      console.log(`Setting up SSE for runId: ${runId}`);

      const es = new EventSource(`/api/logs?runId=${runId}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log("SSE Open");
        setDeploymentStatus("running");
        logContainerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      };

      es.addEventListener("log", (event: MessageEvent) => {
        try {
          const d = JSON.parse(event.data);
          setLogOutput((prev) =>
            d.replace ? d.lines || "" : prev + (d.lines || "")
          );
        } catch (e) {
          console.error("Log parse error", e);
          setLogOutput((prev) => prev + "Error parsing log line.\n");
        }
      });

      es.addEventListener("status", (event: MessageEvent) => {
        try {
          const d = JSON.parse(event.data);
          console.log("Status:", d);
          setDeploymentStatus(d.status || "unknown");
          setDeploymentConclusion(d.conclusion || null);
        } catch (e) {
          console.error("Status parse error", e);
        }
      });

      es.addEventListener("done", (event: MessageEvent) => {
        try {
          const doneData = JSON.parse(event.data);
          console.log("SSE Done:", doneData);
          setDeploymentStatus("completed");
          setDeploymentConclusion(doneData.conclusion || "unknown");

          if (doneData.success === true) {
            setFinalDeploymentMessage({
              type: "success",
              message: "Deployment successful!",
              details: "Please check your Pulumi account for resource details.",
            });
            const stackName = `${submittedData.userId}-resources`;
            const deploymentToStore: StoredDeployment = {
              runId: currentRunIdRef.current || "unknown-run-id",
              userId: submittedData.userId,
              stackName,
              timestamp: new Date().toISOString(),
              status: "success",
              outputs: {
                ...(submittedData.createS3 && {
                  s3: { bucketName: submittedData.s3BucketName },
                }),
                ...(submittedData.createRDS && {
                  rds: {
                    dbName: submittedData.databases[0].dbName,
                    username: submittedData.databases[0].username,
                  },
                }),
                ...(submittedData.createEKS && {
                  eks: { requested: true },
                }),
              },
              requested: {
                createS3: submittedData.createS3,
                createRDS: submittedData.createRDS,
                createEKS: submittedData.createEKS,
              },
            };
            console.log("Storing deployment:", deploymentToStore);
            saveDeploymentToLocalStorage(deploymentToStore);
            window.dispatchEvent(new Event("deploymentsUpdated"));
          } else {
            setFinalDeploymentMessage({
              type: "error",
              message: `Deployment ${doneData.conclusion || "failed"}.`,
              details: "Please review the logs above for errors.",
            });
            console.log("Deployment failed, not storing details.");
          }

          setIsDeploying(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        } catch (e) {
          console.error("Done event parse error:", e);
          setFinalDeploymentMessage({
            type: "error",
            message: "Error processing deployment result.",
            details: "Could not parse the final status event.",
          });
          setIsDeploying(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      });

      es.addEventListener("error", (event: MessageEvent) => {
        try {
          const d = JSON.parse(event.data);
          console.error("SSE BE Error:", d.message);
          setLogOutput((p) => p + `\n--- ERROR: ${d.message} ---\n`);
          setFinalDeploymentMessage({
            type: "error",
            message: "Deployment Error",
            details: d.message || "An error occurred on the server.",
          });
          setDeploymentStatus("failed");
          setDeploymentConclusion("backend_error");
        } catch (e) {
          console.error("SSE Error parse failed:", e);
          setLogOutput((p) => p + "\n--- Non-JSON error event received ---\n");
          setFinalDeploymentMessage({
            type: "error",
            message: "Deployment Error",
            details: "Received an unreadable error from the server.",
          });
          setDeploymentStatus("failed");
          setDeploymentConclusion("sse_error");
        }
        setIsDeploying(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      });

      es.onerror = (error) => {
        if (eventSourceRef.current) {
          console.error("SSE Connection Error:", error);
          if (
            deploymentStatus !== "completed" &&
            deploymentStatus !== "failed"
          ) {
            setLogOutput((p) => p + "\n--- Connection lost ---\n");
            setFinalDeploymentMessage({
              type: "error",
              message: "Connection Lost",
              details: "The connection to the server was interrupted.",
            });
            setDeploymentStatus("failed");
            setDeploymentConclusion("network_error");
            setIsDeploying(false);
          }
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    },
    [deploymentConclusion, deploymentStatus]
  );

  const handleStepperChange = (e: StepperChangeEvent) => {
    if (!isDeploying) setStep(e.value);
  };
  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0 && !isDeploying) setStep(step - 1);
  };

  const handleSubmit = async (data: FormValues) => {
    const finalFormValues = data;

    setIsDeploying(true);
    setDeploymentResult(null);
    setShowTriggerNotification(false);
    if (notificationTimeoutRef.current)
      clearTimeout(notificationTimeoutRef.current);
    setLogOutput("");
    setDeploymentStatus("starting");
    setDeploymentConclusion(null);
    setProgress(0);
    setFinalDeploymentMessage(null);
    setLogOutput("");
    currentRunIdRef.current = null;

    console.log("Submitting:", finalFormValues);
    let triggerResult: any = null;

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalFormValues),
      });
      let errorMsg = `Trigger failed: ${res.status}`;
      if (!res.ok) {
        try {
          const d = await res.json();
          errorMsg = d.message || d.error || JSON.stringify(d);
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }
      const responseData = await res.json();
      triggerResult = responseData;
      if (!responseData?.runId)
        throw new Error("API ok but no runId received.");

      currentRunIdRef.current = responseData.runId;
      console.log(`Triggered. Run ID: ${responseData.runId}`);
      setDeploymentResult(triggerResult);
      setShowTriggerNotification(true);
      notificationTimeoutRef.current = setTimeout(() => {
        setShowTriggerNotification(false);
        notificationTimeoutRef.current = null;
      }, 5000);

      setupEventSource(responseData.runId, finalFormValues);
    } catch (error: any) {
      console.error("Trigger failed:", error);
      triggerResult = { error: error.message };
      setDeploymentResult(triggerResult);
      setShowTriggerNotification(true);
      notificationTimeoutRef.current = setTimeout(() => {
        setShowTriggerNotification(false);
        notificationTimeoutRef.current = null;
      }, 5000);
      setDeploymentStatus("failed");
      setDeploymentConclusion("trigger_error");
      setIsDeploying(false);
    }
  };

  const processLogLine = (line: string): JSX.Element => {
    line = line.trim();
    if (line.startsWith("+")) {
      return (
        <span style={{ color: "#28a745" }} key={Math.random()}>
          {line}
          {"\n"}
        </span>
      );
    } else if (line.startsWith("~")) {
      return (
        <span style={{ color: "#ffc107" }} key={Math.random()}>
          {line}
          {"\n"}
        </span>
      );
    } else if (line.startsWith("-")) {
      return (
        <span style={{ color: "#dc3545" }} key={Math.random()}>
          {line}
          {"\n"}
        </span>
      );
    } else if (line.match(/pulumi:pulumi:Stack/)) {
      return (
        <span style={{ fontWeight: "bold" }} key={Math.random()}>
          {line}
          {"\n"}
        </span>
      );
    } else if (
      line.match(/aws:[a-z0-9\/\-]+:[A-Za-z0-9]+/) ||
      line.match(/Diagnostics:|Outputs:/)
    ) {
      return (
        <span
          style={{ fontWeight: "bold", color: "#007bff" }}
          key={Math.random()}
        >
          {line}
          {"\n"}
        </span>
      );
    }
    return (
      <React.Fragment key={Math.random()}>
        {line}
        {"\n"}
      </React.Fragment>
    );
  };

  const renderProcessedLogs = (logs: string): JSX.Element[] => {
    return logs.split("\n").map(processLogLine);
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  useEffect(() => {
    if (isDeploying) {
      setElapsedTime(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isDeploying]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return (
    <>
      {deploymentResult && (
        <div
          className={`${styles.fixedNotification} ${
            deploymentResult.error ? styles.triggerError : styles.triggerSuccess
          } ${!showTriggerNotification ? styles.fixedNotificationHidden : ""}`}
          role="alert"
        >
          {deploymentResult.error ? (
            <p>
              Trigger Failed: <span>{String(deploymentResult.error)}</span>
            </p>
          ) : (
            <p>
              Triggered!
              {deploymentResult.runId && (
                <span>Run ID: {deploymentResult.runId}</span>
              )}
            </p>
          )}
        </div>
      )}

      <div className={styles.formContainer}>
        <div className={styles.header}>
          <Typography.h3 className={styles.title}>
            Cloud Deployment
          </Typography.h3>
          <Typography.p className={styles.subtitle}>
            Automated resource creation.
          </Typography.p>
          <Card
            style={{ width: "100%", marginTop: "32px", textAlign: "start" }}
            type="warning"
          >
            <CardBody>
              <CardTitle>Action Required: Use Your Own AWS Account</CardTitle>
              <p>
                This demonstration uses a limited AWS Free Tier account. For
                reliable testing :
              </p>
              <ol style={{ margin: "10px 0 10px 20px", paddingLeft: "0" }}>
                <li>
                  <strong>Clone the project repository</strong> to your local
                  environment.
                </li>
                <li>
                  <strong>Configure your personal AWS credentials</strong>
                  within the project setup.
                </li>
              </ol>
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "0.9em",
                  marginTop: "15px",
                }}
              >
                <strong>Note on Vercel Hosting:</strong> This application is
                hosted on Vercel. Serverless functions have execution time
                limits. The real-time log streaming for infrastructure updates
                that take several minutes might be interrupted due to these
                timeouts.
              </p>

              <p>
                Start deploying you <strong>S3 bucket</strong>.
              </p>
            </CardBody>
          </Card>
        </div>
        <Stepper
          value={step}
          onChange={handleStepperChange}
          items={steps}
          className={styles.stepper}
          disabled={isDeploying}
        />

        <Form
          initialValues={initialFormValues}
          render={(formRenderProps: FormRenderProps) => (
            <FormElement className={styles.formElement}>
              {step === 0 && (
                <div className={styles.stepContent}>
                  <Field
                    name="userId"
                    label="User ID"
                    component={Input}
                    validator={(value) => {
                      if (!value) {
                        return "User ID is required.";
                      }
                      if (!/^[a-z]+$/.test(value)) {
                        return "User ID must contain only lowercase letters (a-z) and no spaces or special characters.";
                      }
                      return "";
                    }}
                    required
                    className={styles.input}
                  />
                </div>
              )}
              {step === 1 && (
                <div className={styles.stepContent}>
                  <div className={styles.imageCheckboxGroup}>
                    <ImageCheckbox
                      id="createS3"
                      name="createS3"
                      label="S3"
                      imageSrc="/images/s3.png"
                      formRenderProps={formRenderProps}
                    />
                    <ImageCheckbox
                      id="createRDS"
                      name="createRDS"
                      label="RDS"
                      imageSrc="/images/rds.png"
                      formRenderProps={formRenderProps}
                    />
                    <ImageCheckbox
                      id="createEKS"
                      name="createEKS"
                      label="EKS"
                      imageSrc="/images/eks.png"
                      formRenderProps={formRenderProps}
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className={styles.stepContent}>
                  {formRenderProps.valueGetter("createS3") && (
                    <div>
                      <Field
                        name="s3BucketName"
                        label="S3 Prefix"
                        component={Input}
                        validator={(value) => {
                          if (!value) return "S3 Bucket Name is required.";
                          if (
                            !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(value)
                          ) {
                            return "Must be 3-63 chars, lowercase letters, numbers, or hyphens. Cannot start/end with hyphen.";
                          }
                          if (
                            value.includes("..") ||
                            value.includes(".-") ||
                            value.includes("-.")
                          ) {
                            return "Cannot contain '..', '.-', or '-.'";
                          }
                          return "";
                        }}
                        required
                        className={styles.input}
                      />
                    </div>
                  )}
                  {formRenderProps.valueGetter("createEKS") && (
                    <div>
                      <Field
                        name="clusterName"
                        label="EKS Cluster Name"
                        component={Input}
                        validator={(value) => {
                          if (!value) return "EKS Cluster Name is required.";
                          if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(value)) {
                            return "Must be 1-100 chars, start with letter/number, contain only lowercase letters, numbers, hyphens.";
                          }
                          return "";
                        }}
                        required
                        className={styles.input}
                      />
                    </div>
                  )}
                  {formRenderProps.valueGetter("createRDS") && (
                    <div>
                      <Field
                        name="databases[0].dbName"
                        label="DB Name"
                        component={Input}
                        validator={(value) => {
                          if (!value) return "DB Name is required.";
                          if (!/^[a-z][a-z0-9]{0,62}$/.test(value)) {
                            return "Must be 1-63 chars, start with a letter, contain only lowercase letters and numbers.";
                          }
                          return "";
                        }}
                        required
                        className={styles.input}
                      />
                      <Field
                        name="databases[0].username"
                        label="DB User"
                        component={Input}
                        validator={(value) => {
                          if (!value) return "DB User is required.";
                          if (!/^[a-z][a-z0-9]{0,15}$/.test(value)) {
                            return "Must be 1-16 chars, start with a letter, contain only lowercase letters and numbers.";
                          }
                          return "";
                        }}
                        required
                        className={styles.input}
                      />
                      <Field
                        name="databases[0].password"
                        label="DB Pass"
                        component={Input}
                        type="password"
                        validator={(v) =>
                          !v ? "Required" : v.length < 8 ? "Min 8" : ""
                        }
                        required
                        className={styles.input}
                      />
                    </div>
                  )}
                  {!formRenderProps.valueGetter("createEKS") &&
                    !formRenderProps.valueGetter("createS3") &&
                    !formRenderProps.valueGetter("createRDS") &&
                    !formRenderProps.valueGetter("createEKS") && (
                      <p>Select resource</p>
                    )}
                </div>
              )}
              {step === 3 && (
                <div className={styles.stepContent}>
                  <div className={styles.reviewSection}>
                    <Typography.h4>Review Your Configuration</Typography.h4>
                    <ul>
                      <li>
                        <strong>User ID:</strong>
                        {formRenderProps.valueGetter("userId")}
                      </li>
                      {formRenderProps.valueGetter("createS3") && (
                        <li>
                          <strong>Resource:</strong> S3 Bucket <br />
                          <strong>Bucket Name:</strong>
                          {formRenderProps.valueGetter("s3BucketName")}
                        </li>
                      )}
                      {formRenderProps.valueGetter("createRDS") && (
                        <li>
                          <strong>Resource:</strong> RDS Database <br />
                          <strong>DB Name:</strong>
                          {formRenderProps.valueGetter("databases[0].dbName")}
                          <br />
                          <strong>DB User:</strong>
                          {formRenderProps.valueGetter("databases[0].username")}
                        </li>
                      )}
                      {formRenderProps.valueGetter("createEKS") && (
                        <li>
                          <strong>Resource:</strong> EKS Cluster <br />
                          <strong>Cluster Name:</strong>
                          {formRenderProps.valueGetter("clusterName")}
                        </li>
                      )}
                    </ul>
                    <div
                      style={{
                        marginTop: "15px",
                        marginBottom: "15px",
                        fontStyle: "italic",
                        color: "#555",
                      }}
                    >
                      {formRenderProps.valueGetter("createEKS") && (
                        <p>
                          <strong>Note:</strong> EKS cluster creation typically
                          takes <strong>15-25 minutes</strong>.
                        </p>
                      )}
                      {formRenderProps.valueGetter("createRDS") && (
                        <p>
                          <strong>Note:</strong> RDS database creation typically
                          takes <strong>3-7 minutes</strong>.
                        </p>
                      )}
                      {formRenderProps.valueGetter("createS3") && (
                        <p>
                          <strong>Note:</strong> S3 bucket creation typically
                          takes <strong>under 1 minute</strong>.
                        </p>
                      )}
                    </div>
                    <hr className={styles.reviewDivider} />
                  </div>

                  {(isDeploying ||
                    deploymentStatus === "completed" ||
                    deploymentStatus === "failed") && (
                    <div>
                      Status: <strong> {deploymentStatus}...</strong>
                      <ProgressBar value={progress} />
                    </div>
                  )}
                </div>
              )}

              <div className={styles.navigation}>
                <Button
                  type="button"
                  themeColor="secondary"
                  onClick={handleBack}
                  disabled={step === 0 || isDeploying}
                  className={styles.navButton}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  themeColor="primary"
                  size="large"
                  disabled={
                    isDeploying ||
                    !formRenderProps.valid ||
                    (step === 1 &&
                      !formRenderProps.valueGetter("createS3") &&
                      !formRenderProps.valueGetter("createRDS") &&
                      !formRenderProps.valueGetter("createEKS"))
                  }
                  className={styles.navButton}
                  onClick={
                    step === steps.length - 1
                      ? () => {
                          if (formRenderProps.valid && !isDeploying) {
                            const currentValues: FormValues = {
                              userId: formRenderProps.valueGetter("userId"),
                              createS3:
                                !!formRenderProps.valueGetter("createS3"),
                              createRDS:
                                !!formRenderProps.valueGetter("createRDS"),
                              createEKS:
                                !!formRenderProps.valueGetter("createEKS"),
                              s3BucketName:
                                formRenderProps.valueGetter("s3BucketName") ||
                                "",
                              clusterName:
                                formRenderProps.valueGetter("clusterName") ||
                                "",
                              databases: [
                                {
                                  dbName:
                                    formRenderProps.valueGetter(
                                      "databases[0].dbName"
                                    ) || "",
                                  username:
                                    formRenderProps.valueGetter(
                                      "databases[0].username"
                                    ) || "",
                                  password:
                                    formRenderProps.valueGetter(
                                      "databases[0].password"
                                    ) || "",
                                },
                              ],
                            };
                            handleSubmit(currentValues);
                          }
                        }
                      : handleNext
                  }
                >
                  {step === steps.length - 1
                    ? isDeploying
                      ? `Deploying...`
                      : "Deploy"
                    : "Next"}
                </Button>
              </div>
            </FormElement>
          )}
        />

        {finalDeploymentMessage && (
          <div
            className={`${styles.finalNotification} ${
              finalDeploymentMessage.type === "success"
                ? styles.finalSuccess
                : styles.finalError
            }`}
            role="alert"
          >
            <strong>{finalDeploymentMessage.message}</strong>
            {finalDeploymentMessage.details && (
              <p>{finalDeploymentMessage.details}</p>
            )}
            <Button
              icon="close"
              title="Dismiss"
              fillMode="flat"
              themeColor={
                finalDeploymentMessage.type === "success" ? "success" : "error"
              }
              onClick={() => setFinalDeploymentMessage(null)}
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                padding: "2px",
              }}
            />
            <Button
              title="Dismiss"
              fillMode="flat"
              themeColor={
                finalDeploymentMessage.type === "success" ? "success" : "error"
              }
              onClick={() => setFinalDeploymentMessage(null)}
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                padding: "2px",
              }}
            >
              x
            </Button>
          </div>
        )}

        {(isDeploying || logOutput || deploymentResult?.error) && (
          <div ref={logContainerRef} className={styles.logsContainer}>
            <Typography.h4>Logs</Typography.h4>
            <pre className={styles.logsPre}>
              {logOutput ? (
                renderProcessedLogs(logOutput)
              ) : isDeploying ? (
                <span className={styles.logSpinner}></span>
              ) : (
                ""
              )}
            </pre>
          </div>
        )}
        <DeployedResourcesList />

        {isDeploying && (
          <div className={styles.timerDisplay}>
            Elapsed Time: {formatTime(elapsedTime)}
          </div>
        )}
      </div>
    </>
  );
};

export default DeploymentForm;
