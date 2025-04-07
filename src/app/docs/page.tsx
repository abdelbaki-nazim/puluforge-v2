"use client";

import React, { JSX, useEffect, useState } from "react";
import { PanelBar, PanelBarItem } from "@progress/kendo-react-layout";
import { Input } from "@progress/kendo-react-inputs";
import { Button } from "@progress/kendo-react-buttons";
import styles from "./Documentation.module.css";

interface Step {
  title: string;
  content: string;
}

const steps = [
  {
    title: "Introduction to Puluforge",
    content: `
<strong>Puluforge</strong> is a self-service infrastructure management platform designed to democratize the deployment of cloud resources. It leverages Pulumi for Infrastructure as Code (IaC) and a Next.js front-end/API to enable developers to quickly spin up AWS resources such as S3 buckets, RDS databases, and EKS clusters—without deep AWS expertise.

<strong>Key Benefits:</strong>
<ul>
  <li>Simplified AWS resource management.</li>
  <li>Self-service experience for multiple environments (dev, staging, prod).</li>
  <li>Infrastructure automation through Pulumi.</li>
  <li>User-friendly interface with guided steps.</li>
</ul>
    `,
  },
  {
    title: "System Architecture",
    content: `
Puluforge’s architecture is designed for modularity and scalability. The key components include:

<ul>
  <li><strong>Next.js Application:</strong> Hosted on Vercel, providing the front-end and API layer.</li>
  <li><strong>Pulumi Project:</strong> Contains all IaC code in TypeScript to provision AWS resources.</li>
  <li><strong>AWS Infrastructure:</strong> Resources such as S3, RDS, and EKS are deployed into AWS.</li>
  <li><strong>CI/CD & Lambda (Optional):</strong> Additional mechanisms (like GitHub Actions or Lambda functions) are used to trigger long-running Pulumi deployments.</li>
</ul>

<strong>Architecture Diagram:</strong>
<div class="code-block">
  <code>
    +----------------+       +----------------+       +---------------+<br/>
    | Next.js App    |  ---> | Pulumi Project |  ---> | AWS Resources |<br/>
    | (Vercel Host)  |       |  (IaC Code)    |       | (S3, RDS, EKS)|<br/>
    +----------------+       +----------------+       +---------------+
  </code>
</div>
    `,
  },
  {
    title: "Pulumi Project Setup",
    content: `
To set up the Pulumi project locally:

<strong>1. Initialize the Project:</strong><br/>
Run:
<div class="code-block">
  <code>
    pulumi new aws-typescript --stack puluforge-dev
  </code>
</div>

<strong>2. Project Files:</strong><br/>
Your project folder includes:
<ul>
  <li><code>Pulumi.yaml</code>: Project metadata and default configurations.</li>
  <li><code>index.ts</code>: Main file with your infrastructure code.</li>
  <li><code>package.json</code> &amp; <code>package-lock.json</code>: Dependency management.</li>
  <li><code>node_modules</code>: Installed packages.</li>
  <li><code>deploy.ts</code>: (Optional) Automation script using Pulumi Automation API.</li>
</ul>

<strong>3. Default Configuration:</strong><br/>
Edit <code>Pulumi.yaml</code> to include defaults (e.g., AWS region):
<div class="code-block">
  <code>
    name: puluforge<br/>
    runtime: nodejs<br/>
    config:<br/>
      aws:region: us-east-1
  </code>
</div>
    `,
  },
  {
    title: "AWS Credentials and Pulumi Config",
    content: `
Pulumi stores configuration on a per‑stack basis. To set your AWS credentials, run:

<div class="code-block">
  <code>
    pulumi config set aws:accessKey AKIAVVZPCLMDKMYCYB67<br/>
    pulumi config set --secret aws:secretKey Ra2OlOMlWAJY0+fZiXCHyS++05DMZySQbDbh0jRM<br/>
    pulumi config set aws:region us-east-1
  </code>
</div>

In your code, retrieve them like so:
<div class="code-block">
  <code>
    const config = new pulumi.Config();<br/>
    const awsAccessKey = config.require("aws:accessKey");<br/>
    const awsSecretKey = config.requireSecret("aws:secretKey");<br/>
    const awsRegion = config.require("aws:region");
  </code>
</div>

This ensures each stack (e.g., <code>puluforge-dev</code>, <code>puluforge-prod</code>) gets its own AWS configuration.
    `,
  },
  {
    title: "Infrastructure Code (S3, RDS, EKS)",
    content: 
  `
  The core logic for defining the cloud infrastructure resides in the <code>pulumi/index.ts</code> file. This TypeScript code uses the Pulumi SDK to declare the desired state of resources in AWS.

<strong>Reading Configuration</strong>
<p>The program starts by accessing configuration values passed to it during the deployment (typically via the GitHub Actions workflow). This includes AWS credentials and flags indicating which resources the user chose to create.</p>
<div class="code-block"><pre><code>
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
// ... other imports

const config = new pulumi.Config();

const awsAccessKey = config.require("awsAccessKey");
const awsSecretKey = config.requireSecret("awsSecretKey");
const awsRegion = config.require("awsRegion");

// Create an AWS provider instance to ensure resources use these specific credentials/region
const awsProvider = new aws.Provider("aws-provider", {
  accessKey: awsAccessKey,
  secretKey: awsSecretKey,
  region: awsRegion as aws.Region,
});
</code></pre></div>

<strong>Conditional Resource Creation</strong>
<p>The code uses the configuration values (<code>createS3</code>, <code>createRDS</code>, <code>createEKS</code>) to conditionally define resources. If a flag is set to <code>true</code>, the corresponding block of code executes, creating that resource.</p>

<strong>S3 Bucket Definition</strong>
<p>If <code>createS3</code> is true, an S3 bucket is created. The bucket name is taken from the configuration (<code>s3BucketName</code>) if provided, otherwise, a default name is used.</p>
<div class="code-block"><pre><code>
let s3BucketOutput: pulumi.Output<string> | undefined;
  
if (config.getBoolean("createS3") === true) {
  const s3BucketName = config.get("s3BucketName") || "default-s3-bucket";
  const bucket = new aws.s3.Bucket(
    \`bucket-\${s3BucketName}\`,
    {
      bucket: s3BucketName,
    },
    { provider: awsProvider }
  );
  s3BucketOutput = bucket.bucket;
}
</code></pre></div>

<strong>RDS Aurora MySQL Database Definition</strong>
<p>If <code>createRDS</code> is true, an AWS RDS Aurora MySQL cluster and instance are provisioned. It reads the database details (name, username, password) from the <code>databases</code> configuration key (which is expected to be a JSON string containing an array).</p>
<div class="code-block"><pre><code>
let rdsEndpoint: pulumi.Output<string> | undefined;

if (config.getBoolean("createRDS") === true) {
  const rdsInstanceIdentifier = "database-pulumi";
  const databasesRaw = config.get("databases") || "[]";
  const databases = JSON.parse(databasesRaw);

  if (databases.length > 0) {
    const rdsCluster = new aws.rds.Cluster(
      \`rds-cluster-\${rdsInstanceIdentifier}\`,
      {
        clusterIdentifier: rdsInstanceIdentifier,
        engine: "aurora-mysql",
        engineVersion: "8.0",
        databaseName: databases[0].dbName,
        masterUsername: databases[0].username,
        masterPassword: databases[0].password,
        skipFinalSnapshot: true,
        applyImmediately: true,
      },
      { provider: awsProvider }
    );
    rdsEndpoint = rdsCluster.endpoint;

    // Creates instance(s) within the cluster
    new aws.rds.ClusterInstance(
      \`rds-instance-\${databases[0].dbName}\`, // Simplified example for one instance
      {
        identifier: \`\${rdsInstanceIdentifier}-\${databases[0].dbName}\`,
        clusterIdentifier: rdsCluster.clusterIdentifier,
        instanceClass: "db.t4g.micro",
        engine: "aurora-mysql",
        engineVersion: "8.0",
        publiclyAccessible: false, // Instance is private
        applyImmediately: true,
      },
      { provider: awsProvider }
    );
    // Parameter group setup also occurs here...
  }
}
</code></pre></div>

<strong>EKS Cluster Definition</strong>
<p>If <code>createEKS</code> is true, a Kubernetes cluster is created using the high-level <code>@pulumi/eks</code> component. This simplifies EKS setup significantly. Note that in this specific example, values like the VPC ID, subnet IDs, and instance profile name are hardcoded directly in the Pulumi code. For more flexibility, these could also be driven by configuration.</p>
<div class="code-block"><pre><code>
import * as eks from "@pulumi/eks";
// ... other imports and config reading

let eksClusterOutput: pulumi.Output<string> | undefined;

if (config.getBoolean("createEKS") === true) {
  const eksClusterName = config.get("clusterName") || "default-eks-cluster"; // Reads name from config
  const eksK8sVersion = config.get("eksK8sVersion") || "1.31";

  const nodeInstanceProfile = new aws.iam.InstanceProfile(/* ... configuration ... */);

  const cluster = new eks.Cluster(
    "eksCluster",
    {
      name: eksClusterName,
      version: eksK8sVersion,
      vpcId: "vpc-04a0161c3cefe5035", // Hardcoded VPC
      publicSubnetIds: [ /* Hardcoded Subnet IDs */ ],
      nodeGroupOptions: {
        instanceProfileName: nodeInstanceProfile.name,
        instanceType: "t3.medium", // Hardcoded instance type
        desiredCapacity: 2,
        minSize: 1,
        maxSize: 3,
      },
      // ... other options
    },
    { provider: awsProvider }
  );
  eksClusterOutput = cluster.eksCluster.name;
}
</code></pre></div>

<strong>Exporting Outputs</strong>
<p>Finally, the program exports key pieces of information from the created resources (if any). These outputs, like the S3 bucket name, RDS endpoint, or EKS cluster name, are displayed by Pulumi upon successful completion of the deployment and can be used to connect to or manage the resources.</p>
<div class="code-block"><pre><code>
export { s3BucketOutput, rdsEndpoint, eksClusterOutput };
</code></pre></div>

<p>This <code>index.ts</code> file, combined with the configuration passed by the GitHub Actions workflow, defines precisely what infrastructure Puluforge will manage in AWS based on user requests.</p>

    `,
  },
  {
    title: "Next.js API Integration with Pulumi Automation",
    content: `
    The Puluforge Next.js application provides the user interface for requesting infrastructure and viewing deployment progress. Here's how it connects the user's choices to the automated Pulumi deployment via GitHub Actions:

<strong>1. User Interface: The Multi-Step Form</strong>

<p>When a user navigates to the <code>/dashboard</code> page, they are presented with a multi-step form (implemented in the <code>DeploymentForm</code> component) to specify their infrastructure needs:</p>
<ul>
    <li><strong>Step 1: Basics & Resource Selection:</strong>
        <ul>
            <li>The user enters a unique <code>userId</code>. (Note: In this demo version, full authentication isn't required, so this is entered manually).</li>
            <li>Using visual checkboxes (the <code>ImageCheckbox</code> component), the user selects which AWS resources they want to create: S3, RDS, and/or EKS.
                <div class="code-block"><code>&lt;ImageCheckbox name="createS3" label="S3 Bucket" imageSrc="/icons/s3.png" ... /&gt;
&lt;ImageCheckbox name="createRDS" label="RDS Database" imageSrc="/icons/rds.png" ... /&gt;
&lt;ImageCheckbox name="createEKS" label="EKS Cluster" imageSrc="/icons/eks.png" ... /&gt;
                </code></div>
            </li>
        </ul>
    </li>
    <li><strong>Step 2/3: Resource Details:</strong> Based on the selections in Step 1, the user provides specific details (like S3 bucket name, EKS cluster name, or RDS database name, username, and password).</li>
    <li><strong>Step 4: Confirmation & Submission:</strong> The user reviews their choices and submits the form.</li>
</ul>

<strong>2. Triggering the Deployment (Frontend to API)</strong>

<p>Upon form submission, the <code>handleSubmit</code> function in the <code>DeploymentForm</code> component gathers all the user inputs into a structure like this:</p>
<div class="code-block"><pre><code>
{
  userId: "user123",
  createS3: true,
  createRDS: false,
  createEKS: true,
  s3BucketName: "my-unique-bucket-name",
  clusterName: "my-eks-cluster",
  databases: [...] // Only first DB used if createRDS is true
}
</code></pre></div>

<p>It then sends this data to a Next.js API route (<code>/api/deploy</code>) using a POST request:</p>
<div class="code-block"><pre><code>
// Inside handleSubmit in DeploymentForm.tsx
const res = await fetch("/api/deploy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(finalFormValues), // Contains the form data
});
const responseData = await res.json();
// If successful, responseData contains { message: "...", runId: 12345678 }
currentRunIdRef.current = responseData.runId;
// Start listening for logs using the runId
setupEventSource(responseData.runId, finalFormValues);
</code></pre></div>

<strong>3. The Backend API Route: \`/api/deploy\`</strong>

<p>This API route (defined in <code>pages/api/deploy.ts</code> or <code>app/api/deploy/route.ts</code>) acts as the bridge to GitHub Actions:</p>
<ul>
    <li>It receives the form data from the frontend request.</li>
    <li>It extracts the necessary details (userId, resource flags, names).</li>
    <li>Crucially, it uses the GitHub REST API to programmatically trigger the <code>deploy.yml</code> workflow we discussed earlier. It sends the form data as \`inputs\` to the workflow. This requires a GitHub Personal Access Token (PAT) stored securely as an environment variable (<code>process.env.GITHUB_TOKEN</code>) on the server.</li>
    <div class="code-block"><pre><code>
// Inside /api/deploy route handler
const DISPATCH_URL = "https://api.github.com/repos/.../deploy.yml/dispatches";
const dispatchRes = await fetch(DISPATCH_URL, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.GITHUB_TOKEN}\`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ref: "main", // Target branch
    inputs: { /* Form data mapped here, e.g., userId, createS3: 'true', ... */ }
  }),
});
    </code></pre></div>
    <li>After triggering the workflow, the API route polls the GitHub API to find the unique ID (<code>runId</code>) of the workflow run that just started.</li>
    <li>It returns this <code>runId</code> back to the frontend upon success.</li>
</ul>

<strong>4. Real-time Logging with Server-Sent Events (SSE)</strong>

<p>Once the frontend receives the <code>runId</code>, it needs to show the user the deployment progress. This is achieved using Server-Sent Events (SSE) and another API route (<code>/api/logs</code>):</p>
<ul>
    <li><strong>Frontend Connection:</strong> The frontend's <code>setupEventSource</code> function creates an <code>EventSource</code> connection to <code>/api/logs?runId={runId}</code>.</li>
    <div class="code-block"><pre><code>
// Inside setupEventSource in DeploymentForm.tsx
const es = new EventSource(\`/api/logs?runId=\${runId}\`);
eventSourceRef.current = es;

es.addEventListener("log", (event) => { /* Update log display */ });
es.addEventListener("status", (event) => { /* Update deployment status */ });
es.addEventListener("done", (event) => { /* Handle completion */ });
es.addEventListener("error", (event) => { /* Handle errors */ });
    </code></pre></div>
    <li><strong>Backend Streaming (\`/api/logs\`):</strong> This API route keeps the connection open. It periodically polls the GitHub API for the status of the specific workflow run (using the \`runId\`). It also fetches the latest logs from GitHub Actions, processes them (removes timestamps, cleans formatting), and calculates the *new* log lines since the last check.</li>
    <li>It streams updates back to the frontend using specific SSE event types:
        <ul>
            <li><code>event: status</code>: Sends updates on the workflow status (e.g., 'queued', 'running', 'completed') and conclusion ('success', 'failure').</li>
            <li><code>event: log</code>: Sends only the *new* log lines generated by the workflow.</li>
            <li><code>event: done</code>: Sent when the workflow completes, indicating success or failure.</li>
            <li><code>event: error</code>: Sent if there's an error within the API route itself (e.g., cannot reach GitHub).</li>
        </ul>
    </li>
</ul>

<p>This setup allows the user to see the deployment logs appearing in real-time in their browser, along with status updates and a progress bar, providing immediate feedback on the infrastructure creation process.</p>

<strong>5. Storing Results</strong>
<p>Upon successful completion (indicated by the 'done' SSE event with a success status), the frontend saves key details about the deployment (like the user ID, stack name, run ID, and requested resources) into the browser's local storage for potential future reference.</p>
<div class="code-block"><pre><code>
// Inside the 'done' event listener in setupEventSource
if (doneData.success === true) {
  // ... prepare deployment data ...
  saveDeploymentToLocalStorage(deploymentToStore);
  window.dispatchEvent(new Event("deploymentsUpdated"));
}
</code></pre></div>
  
    `,
  },
  {
    title: "CI/CD Integration Using GitHub Actions",
    content: `
This project uses a GitHub Actions workflow, located at <code>.github/workflows/deploy.yml</code>, to automatically deploy your AWS resources using Pulumi.

<strong>How it's Triggered:</strong>

<p>The workflow is configured using GitHub's <code>workflow_dispatch</code> trigger. This type of trigger allows the workflow to be started in two main ways:</p>
<ul>
    <li>Manually, directly from the "Actions" tab in the GitHub repository interface.</li>
    <li>Programmatically, via a request to the GitHub API.</li>
</ul>
<p>In the Puluforge platform, the standard way to initiate an infrastructure deployment is through the application's interface, which then makes an API call to GitHub to start this specific workflow.</p>

<strong>Workflow Inputs:</strong>

<p>Whether triggered manually for testing or via the application's API call, the workflow requires several pieces of information (inputs) to know what to do:</p>
<ul>
    <li><code>userId</code>: A unique identifier for the deployment, used to keep resources separate (it becomes part of the Pulumi stack name).</li>
    <li><code>createS3</code>, <code>createRDS</code>, <code>createEKS</code>: 'true' or 'false' flags indicating whether to create an S3 bucket, RDS database, or EKS cluster, respectively.</li>
    <li>Optional details: <code>s3BucketName</code>, <code>dbName</code>, <code>dbUsername</code>, <code>dbPassword</code>, <code>clusterName</code>. These are used if you are creating the corresponding resources and want to specify their names or credentials. The API call from the Puluforge app will pass these details based on user selections.</li>
</ul>

<strong>Workflow Steps:</strong>

<p>Once triggered, the workflow performs these main actions:</p>
<ol>
    <li>Checks out the repository code.</li>
    <li>Sets up the required Node.js environment (version 18).</li>
    <li>Installs the Pulumi command-line tool (CLI).</li>
    <li>Goes into the <code>./pulumi</code> directory and installs the necessary Node packages (dependencies) for the Pulumi infrastructure code.</li>
    <li>Configures and runs Pulumi:
        <ul>
            <li>Logs into the Pulumi service using a secure access token.</li>
            <li>Initializes or selects a unique Pulumi stack (like <code>your-userId-resources</code>) based on the provided <code>userId</code>.</li>
            <li>Sets Pulumi configuration values using the inputs passed to the workflow and the secrets stored in GitHub (like AWS credentials).</li>
            <li>Executes the <code>pulumi up</code> command to create or update the infrastructure in AWS, automatically approving the changes (<code>--skip-preview --yes</code>).</li>
        </ul>
    </li>
</ol>

<strong>Required Secrets Setup:</strong>

<p>For the workflow to securely access your AWS account and the Pulumi service, you must configure the following secrets in your GitHub repository settings:</p>
<ul>
    <li><code>AWS_ACCESS_KEY_ID</code>: Your AWS access key.</li>
    <li><code>AWS_SECRET_ACCESS_KEY</code>: Your AWS secret key.</li>
    <li><code>AWS_REGION</code>: The AWS region for deployment (e.g., <code>us-east-1</code>).</li>
    <li><code>PULUMI_ACCESS_TOKEN</code>: Your Pulumi Access Token for authentication with the Pulumi service.</li>
</ul>

<p><strong>How to add secrets in GitHub:</strong></p>
<ol>
    <li>Navigate to your repository on GitHub.</li>
    <li>Go to "Settings" > "Secrets and variables" > "Actions".</li>
    <li>Click "New repository secret" for each required secret.</li>
    <li>Enter the exact name (e.g., <code>AWS_ACCESS_KEY_ID</code>) and paste the value.</li>
    <li>Save each secret. Repeat for all four.</li>
</ol>
    `,
  },
  {
    title: "Security, Authentication, and Multi-Tenancy",
    content: `
For a secure self-service platform:

<ul>
  <li><strong>User Authentication:</strong> Use AWS Cognito or OIDC to authenticate users.</li>
  <li><strong>Multi-Tenancy:</strong> Each user gets a separate Pulumi stack (e.g., <code>userA-dev</code>, <code>userB-staging</code>) to isolate resources.</li>
  <li><strong>Credential Management:</strong> Use temporary AWS credentials via federated identity instead of long‑lived keys.</li>
  <li><strong>API Security:</strong> Secure API endpoints with API keys or JWT so only authorized users can trigger deployments.</li>
  <li><strong>Resource Tagging and Auditing:</strong> Tag resources with user IDs and stack names for cost tracking and auditing.</li>
</ul>
    `,
  },
  {
    title: "Future Enhancements and Conclusion",
    content: `
<strong>Future Enhancements:</strong>
<ul>
  <li>Develop a full-featured Kendo vertical stepper UI for guided infrastructure setup.</li>
  <li>Implement automated rollbacks and advanced state management.</li>
  <li>Expand multi-tenancy support by enabling users to deploy into their own AWS accounts.</li>
  <li>Integrate monitoring and alerting (using AWS CloudWatch or Datadog) for production deployments.</li>
</ul>

<strong>Conclusion:</strong><br/>
Puluforge transforms complex AWS infrastructure management into a guided, self-service experience. By integrating Pulumi, Next.js, and modern CI/CD or Lambda solutions, it empowers users to deploy and manage their infrastructure safely, efficiently, and with minimal overhead. This documentation provides a comprehensive roadmap from initial setup to future enhancements.
    `,
  },
];

interface DocumentationProps {
  showDirectly?: boolean;
}

export default function Documentation({}): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredSteps, setFilteredSteps] = useState<Step[]>(steps);
  const [selectedContent, setSelectedContent] = useState<string>(
    steps[0].content
  );

  const stripHtml = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = steps.filter(
      (step) =>
        step.title.toLowerCase().includes(lowerQuery) ||
        stripHtml(step.content).toLowerCase().includes(lowerQuery)
    );
    setFilteredSteps(filtered);
    setSelectedContent(
      filtered.length > 0 ? filtered[0].content : "No matching content found."
    );
  }, [searchQuery]);

  const handleSelect = (e: any) => {
    const selectedStep = filteredSteps.find(
      (step) => `${step.title}` === e.target.props.title
    );
    if (selectedStep) {
      setSelectedContent(selectedStep.content);
    }
  };

  return (
    <div className={styles.container}>
      {
        <div className={styles.docLayout}>
          <div className={styles.leftPanel}>
            <Input
              placeholder="Search in documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.value)}
              className={styles.searchBar}
              style={{ padding: 8, marginBottom: 24 }}
            />
            <PanelBar onSelect={handleSelect} className={styles.panelBar}>
              {filteredSteps.map((step, index) => (
                <PanelBarItem
                  key={index}
                  title={step.title}
                  expanded={index === 0 && searchQuery === ""}
                ></PanelBarItem>
              ))}
            </PanelBar>
          </div>
          <div
            className={styles.rightContent}
            dangerouslySetInnerHTML={{ __html: selectedContent }}
          />
        </div>
      }
    </div>
  );
}
