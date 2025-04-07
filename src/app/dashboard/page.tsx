"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import {
  Form,
  Field,
  FormElement,
  FormRenderProps,
  // FormState and FormChangeEvent are removed as they don't exist here
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
  s3BucketName: string;
  databases: DatabaseConfig[];
}

interface StoredDeploymentOutput {
  s3?: { bucketName: string; bucketUrl?: string; region?: string };
  rds?: {
    instanceEndpoint: string;
    dbName: string;
    username: string;
    region?: string;
  };
  eks?: { clusterName: string; clusterEndpoint?: string; region?: string };
}

interface StoredDeployment {
  runId: string;
  userId: string;
  timestamp: string;
  status: "success";
  outputs: StoredDeploymentOutput;
  requested: { createS3: boolean; createRDS: boolean; createEKS: boolean };
}

// --- Constants ---
const steps = [
  { label: "User Info", icon: "k-i-user" },
  { label: "Resource Selection", icon: "k-i-gear" },
  { label: "Configuration", icon: "k-i-wrench" },
  { label: "Deploy", icon: "k-i-play" },
];
const LOCAL_STORAGE_KEY = "cloudDeployments";

// --- Components ---

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
    const newValue = !checked;
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
  // --- State ---
  const [step, setStep] = useState(0);
  const [initialFormValues] = useState<FormValues>({
    userId: "",
    createS3: false,
    createRDS: false,
    createEKS: false,
    s3BucketName: "",
    databases: [{ dbName: "", username: "", password: "" }],
  });
  // Removed currentFormState
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
  // const [refreshDeployments, setRefreshDeployments] = useState(0);

  // --- Refs ---
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Progress bar effect
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
    // Log scroll effect
    if (logContainerRef.current && logOutput && isDeploying) {
      const pre = logContainerRef.current.querySelector("pre");
      if (pre) pre.scrollTop = pre.scrollHeight;
    }
  }, [logOutput, isDeploying]);

  useEffect(() => {
    // Cleanup effect
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

  // --- LocalStorage Logic ---
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
      // setRefreshDeployments(prev => prev + 1);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  // --- Callbacks ---

  // Removed handleFormStateChange

  // setupEventSource now accepts the submitted data
  const setupEventSource = useCallback(
    (runId: string, submittedData: FormValues) => {
      // Added submittedData
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
          setLogOutput((p) => p + (d.lines || "") + (d.replace ? "" : "\n"));
        } catch (e) {
          console.error("Log parse error", e);
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

      // Outputs listener now uses submittedData passed into setupEventSource
      es.addEventListener("outputs", (event: MessageEvent) => {
        try {
          const outputsData = JSON.parse(event.data) as StoredDeploymentOutput;
          console.log("Received Outputs:", outputsData);

          // Use the 'submittedData' passed into this function
          const deploymentToStore: StoredDeployment = {
            runId: currentRunIdRef.current || "unknown-run-id",
            userId: submittedData.userId, // Use data from argument
            timestamp: new Date().toISOString(),
            status: "success",
            outputs: outputsData,
            requested: {
              // Use data from argument
              createS3: submittedData.createS3,
              createRDS: submittedData.createRDS,
              createEKS: submittedData.createEKS,
            },
          };
          saveDeploymentToLocalStorage(deploymentToStore);
          // Optionally close SSE connection here after getting outputs
          setIsDeploying(false); // Mark as not deploying anymore
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        } catch (e) {
          console.error("Outputs processing error:", e);
        }
      });

      es.addEventListener("done", (event: MessageEvent) => {
        console.log("SSE Done:", event.data);
        // Check state *after* status event should have potentially set it
        const finalConclusion = deploymentConclusion; // Read state variable
        setDeploymentStatus("completed"); // Mark run as completed regardless
        if (finalConclusion !== "success") {
          // If not successful (or conclusion unknown), stop deploying and close SSE
          setIsDeploying(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
        // If successful, the "outputs" listener should handle setIsDeploying(false) and closing
      });

      es.addEventListener("error", (event: MessageEvent) => {
        // Backend error event
        try {
          const d = JSON.parse(event.data);
          console.error("SSE BE Error:", d.message);
          setLogOutput((p) => p + `\n--- ERROR: ${d.message} ---\n`);
          setDeploymentStatus("failed");
          setDeploymentConclusion("backend_error");
        } catch (e) {
          console.error("SSE Error parse failed:", e);
          setLogOutput((p) => p + "\n--- Non-JSON error event ---\n");
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
        // Network/connection error
        if (eventSourceRef.current) {
          console.error("SSE Connection Error:", error);
          setLogOutput((p) => p + "\n--- Connection lost ---\n");
          if (
            deploymentStatus !== "completed" &&
            deploymentStatus !== "failed"
          ) {
            setDeploymentStatus("failed");
            setDeploymentConclusion("network_error");
          }
          setIsDeploying(false);
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    },
    // Remove currentFormState from dependencies, add deploymentConclusion
    [deploymentConclusion, deploymentStatus] // Keep status/conclusion
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

  // handleSubmit (triggered by manual button click)
  const handleSubmit = async (data: FormValues) => {
    const finalFormValues = data; // Data comes from the onClick handler

    setIsDeploying(true);
    setDeploymentResult(null);
    setShowTriggerNotification(false);
    if (notificationTimeoutRef.current)
      clearTimeout(notificationTimeoutRef.current);
    setLogOutput("");
    setDeploymentStatus("starting");
    setDeploymentConclusion(null);
    setProgress(0);
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

      currentRunIdRef.current = responseData.runId; // Store runId
      console.log(`Triggered. Run ID: ${responseData.runId}`);
      setDeploymentResult(triggerResult);
      setShowTriggerNotification(true);
      notificationTimeoutRef.current = setTimeout(() => {
        setShowTriggerNotification(false);
        notificationTimeoutRef.current = null;
      }, 5000);

      // Pass finalFormValues to setupEventSource
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

  // --- Render ---
  return (
    <>
      {/* Notifications */}
      {deploymentResult && (
        <div
          className={`${styles.fixedNotification} ${
            deploymentResult.error ? styles.triggerError : styles.triggerSuccess
          } ${!showTriggerNotification ? styles.fixedNotificationHidden : ""}`}
          role="alert"
        >
          {" "}
          {deploymentResult.error ? (
            <p>
              Trigger Failed: <span>{String(deploymentResult.error)}</span>
            </p>
          ) : (
            <p>
              Triggered!{" "}
              {deploymentResult.runId && (
                <span>Run ID: {deploymentResult.runId}</span>
              )}
            </p>
          )}{" "}
        </div>
      )}

      {/* Form Layout */}
      <div className={styles.formContainer}>
        <div className={styles.header}>
          {" "}
          <Typography.h3 className={styles.title}>
            Cloud Deployment
          </Typography.h3>{" "}
          <Typography.p className={styles.subtitle}>
            Automated resource creation.
          </Typography.p>{" "}
          <Card style={{ width: "100%", marginTop: "32px" }} type="warning">
            <CardBody>
              <CardTitle>Shared Account</CardTitle>
              <p>Please delete resources after use.</p>
            </CardBody>
          </Card>{" "}
        </div>
        <Stepper
          value={step}
          onChange={handleStepperChange}
          items={steps}
          className={styles.stepper}
          disabled={isDeploying}
        />

        {/* Kendo Form - No onSubmit, uses renderProps */}
        <Form
          initialValues={initialFormValues}
          // onStateChange removed
          // onSubmit removed
          render={(
            formRenderProps: FormRenderProps // Has access to formRenderProps
          ) => (
            <FormElement className={styles.formElement}>
              {/* Step Content - Simplified for brevity */}
              {step === 0 && (
                <div className={styles.stepContent}>
                  {" "}
                  <Field
                    name="userId"
                    label="User ID"
                    component={Input}
                    validator={(v) => (!v ? "Required" : "")}
                    required
                    className={styles.input}
                  />{" "}
                </div>
              )}
              {step === 1 && (
                <div className={styles.stepContent}>
                  {" "}
                  <div className={styles.imageCheckboxGroup}>
                    {" "}
                    <ImageCheckbox
                      id="createS3"
                      name="createS3"
                      label="S3"
                      imageSrc="/images/s3.png"
                      formRenderProps={formRenderProps}
                    />{" "}
                    <ImageCheckbox
                      id="createRDS"
                      name="createRDS"
                      label="RDS"
                      imageSrc="/images/rds.png"
                      formRenderProps={formRenderProps}
                    />{" "}
                    <ImageCheckbox
                      id="createEKS"
                      name="createEKS"
                      label="EKS"
                      imageSrc="/images/eks.png"
                      formRenderProps={formRenderProps}
                    />{" "}
                  </div>{" "}
                </div>
              )}
              {step === 2 && (
                <div className={styles.stepContent}>
                  {" "}
                  {formRenderProps.valueGetter("createS3") && (
                    <div>
                      <Field
                        name="s3BucketName"
                        label="S3 Prefix"
                        component={Input}
                        validator={(v) => (!v ? "Required" : "")}
                        required
                        className={styles.input}
                      />
                    </div>
                  )}{" "}
                  {formRenderProps.valueGetter("createRDS") && (
                    <div>
                      <Field
                        name="databases[0].dbName"
                        label="DB Name"
                        component={Input}
                        validator={(v) => (!v ? "Required" : "")}
                        required
                        className={styles.input}
                      />{" "}
                      <Field
                        name="databases[0].username"
                        label="DB User"
                        component={Input}
                        validator={(v) => (!v ? "Required" : "")}
                        required
                        className={styles.input}
                      />{" "}
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
                  )}{" "}
                  {formRenderProps.valueGetter("createEKS") && (
                    <div>EKS Config...</div>
                  )}{" "}
                  {!formRenderProps.valueGetter("createS3") &&
                    !formRenderProps.valueGetter("createRDS") &&
                    !formRenderProps.valueGetter("createEKS") && (
                      <p>Select resource</p>
                    )}{" "}
                </div>
              )}
              {step === 3 && (
                <div className={styles.stepContent}>
                  {" "}
                  <Typography.h4>Deploy</Typography.h4>{" "}
                  {(isDeploying ||
                    deploymentStatus === "completed" ||
                    deploymentStatus === "failed") && (
                    <div>
                      {" "}
                      Status: <strong> {deploymentStatus}...</strong>
                      <ProgressBar value={progress} />
                    </div>
                  )}{" "}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className={styles.navigation}>
                <Button
                  type="button"
                  themeColor="secondary"
                  onClick={handleBack}
                  disabled={step === 0 || isDeploying}
                  className={styles.navButton}
                >
                  {" "}
                  Back{" "}
                </Button>
                <Button
                  type="button" // Always button
                  themeColor="primary"
                  size="large"
                  disabled={
                    // Use formRenderProps for checks
                    isDeploying ||
                    !formRenderProps.valid || // Use validity from renderProps
                    (step >= 1 && // Use valueGetter from renderProps
                      !formRenderProps.valueGetter("createS3") &&
                      !formRenderProps.valueGetter("createRDS") &&
                      !formRenderProps.valueGetter("createEKS"))
                  }
                  className={styles.navButton}
                  onClick={
                    // Handles Next or Submit
                    step === steps.length - 1
                      ? // Submit Action: Reconstruct values and call handleSubmit
                        () => {
                          if (formRenderProps.valid && !isDeploying) {
                            // Reconstruct the FormValues object here
                            const currentValues: FormValues = {
                              userId: formRenderProps.valueGetter("userId"),
                              createS3:
                                !!formRenderProps.valueGetter("createS3"), // Ensure boolean
                              createRDS:
                                !!formRenderProps.valueGetter("createRDS"),
                              createEKS:
                                !!formRenderProps.valueGetter("createEKS"),
                              s3BucketName:
                                formRenderProps.valueGetter("s3BucketName") ||
                                "", // Handle potential null/undefined
                              databases: [
                                // Reconstruct nested object
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
                            handleSubmit(currentValues); // Call submit handler
                          }
                        }
                      : handleNext // Next Action
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

        {/* Log Output */}
        {(isDeploying || logOutput || deploymentResult?.error) && (
          <div ref={logContainerRef} className={styles.logsContainer}>
            {" "}
            <Typography.h4>Logs</Typography.h4>{" "}
            <pre className={styles.logsPre}>
              {logOutput || (isDeploying ? "Waiting..." : "")}
            </pre>{" "}
          </div>
        )}
        <DeployedResourcesList />
      </div>
    </>
  );
};

export default DeploymentForm;
