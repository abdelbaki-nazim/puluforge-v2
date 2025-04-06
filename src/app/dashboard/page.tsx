"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import {
  Form,
  Field,
  FormElement,
  FormRenderProps,
} from "@progress/kendo-react-form";
import { Typography } from "@progress/kendo-react-common";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import { Stepper, StepperChangeEvent } from "@progress/kendo-react-layout";
import styles from "./DeploymentForm.module.css";

interface FormValues {
  userId: string;
  createS3: boolean;
  createRDS: boolean;
  createEKS: boolean;
  s3BucketName: string;
  databases: { dbName: string; username: string; password: string }[];
}

const steps = [
  { label: "User Info", icon: "k-i-user" },
  { label: "Resource Selection", icon: "k-i-gear" },
  { label: "Configuration", icon: "k-i-wrench" },
  { label: "Deploy", icon: "k-i-play" },
];

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
  const [checked, setChecked] = useState(formRenderProps.valueGetter(name));

  useEffect(() => {
    setChecked(formRenderProps.valueGetter(name));
  }, [formRenderProps.valueGetter(name)]);

  const handleChange = () => {
    const newValue = !checked;
    setChecked(newValue);
    formRenderProps.onChange(name, { value: newValue });
  };

  return (
    <div
      className={`${styles.imageCheckbox} ${checked ? styles.selected : ""}`}
      onClick={handleChange}
    >
      <img src={imageSrc} alt={label} className={styles.checkboxImage} />
      <p>{label}</p>
      <input
        type="checkbox"
        checked={checked}
        readOnly
        style={{ display: "none" }}
      />
    </div>
  );
};

const DeploymentForm = () => {
  const [step, setStep] = useState(0);
  const [formValues, setFormValues] = useState<FormValues>({
    userId: "",
    createS3: false,
    createRDS: false,
    createEKS: false,
    s3BucketName: "",
    databases: [{ dbName: "", username: "", password: "" }],
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleStepperChange = (e: StepperChangeEvent) => {
    setStep(e.value);
  };

  const handleNext = (data: any) => {
    setFormValues((prev) => ({ ...prev, ...data }));
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await res.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Power Up Your Cloud Journey</h1>
          <Typography.p className={styles.subtitle}>
            Deploy cloud resources faster with Pulumi's smart automation.
          </Typography.p>
        </div>

        <Stepper
          value={step}
          onChange={handleStepperChange}
          items={steps}
          className={styles.stepper}
        />

        <Form
          initialValues={formValues}
          onSubmit={step === steps.length - 1 ? handleSubmit : handleNext}
          render={(formRenderProps) => (
            <FormElement className={styles.formElement}>
              {step === 0 && (
                <div className={styles.stepContent}>
                  <Typography.h4>Enter Your User ID</Typography.h4>
                  <Field
                    id="userId"
                    name="userId"
                    label="Your User ID"
                    component={Input}
                    validator={(value) => (!value ? "User ID is required" : "")}
                    required={true}
                    className={styles.input}
                  />
                </div>
              )}

              {step === 1 && (
                <div className={styles.stepContent}>
                  <Typography.h4>
                    Select the resources you want to create
                  </Typography.h4>
                  <div className={styles.imageCheckboxGroup}>
                    <ImageCheckbox
                      id="createS3"
                      name="createS3"
                      label="S3 Bucket"
                      imageSrc="/images/s3.png"
                      formRenderProps={formRenderProps}
                    />
                    <ImageCheckbox
                      id="createRDS"
                      name="createRDS"
                      label="RDS Instance"
                      imageSrc="/images/rds.png"
                      formRenderProps={formRenderProps}
                    />
                    <ImageCheckbox
                      id="createEKS"
                      name="createEKS"
                      label="EKS Cluster"
                      imageSrc="/images/eks.png"
                      formRenderProps={formRenderProps}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.stepContent}>
                  {formRenderProps.valueGetter("createS3") && (
                    <Field
                      id="s3BucketName"
                      name="s3BucketName"
                      label="S3 Bucket Name"
                      component={Input}
                      validator={(value) =>
                        !value ? "Bucket name is required" : ""
                      }
                      className={styles.input}
                    />
                  )}
                  {formRenderProps.valueGetter("createRDS") && (
                    <div className={styles.dbSection}>
                      <Typography.h4>Database Setup</Typography.h4>
                      <Field
                        id="dbName"
                        name="databases[0].dbName"
                        label="Database Name"
                        component={Input}
                        validator={(value) =>
                          !value ? "Database name is required" : ""
                        }
                        className={styles.input}
                      />
                      <Field
                        id="username"
                        name="databases[0].username"
                        label="Username"
                        component={Input}
                        validator={(value) =>
                          !value ? "Username is required" : ""
                        }
                        className={styles.input}
                      />
                      <Field
                        id="password"
                        name="databases[0].password"
                        label="Password"
                        component={Input}
                        type="password"
                        validator={(value) =>
                          !value ? "Password is required" : ""
                        }
                        className={styles.input}
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className={styles.stepContent}>
                  <img
                    src="/images/deploy.png"
                    alt="Deploy"
                    className={styles.deployImage}
                  />
                  <Typography.p className={styles.deployText}>
                    Initiate your deployment to transform your cloud
                    infrastructure. Press deploy to begin.
                  </Typography.p>

                  {loading && (
                    <div className={styles.progressContainer}>
                      <Typography.p>Deploying with Pulumi...</Typography.p>
                      <ProgressBar
                        value={progress}
                        max={100}
                        labelVisible={true}
                        style={{ width: "100%", height: "25px" }}
                        className={styles.progressBar}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className={styles.navigation}>
                {step > 0 && (
                  <Button
                    type="button"
                    themeColor="secondary"
                    onClick={handleBack}
                    className={styles.navButton}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  themeColor="primary"
                  size="large"
                  disabled={loading || !formRenderProps.allowSubmit}
                  className={styles.navButton}
                >
                  {step === steps.length - 1
                    ? loading
                      ? "Deploying..."
                      : "Deploy"
                    : "Next"}
                </Button>
              </div>
            </FormElement>
          )}
        />

        {result && (
          <div className={styles.resultContainer}>
            <Typography.h4>Deployment Result</Typography.h4>
            <pre className={styles.resultPre}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
};

export default DeploymentForm;
