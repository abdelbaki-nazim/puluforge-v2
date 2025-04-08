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
<strong>Puluforge</strong> is a self-service platform designed to simplify the deployment of cloud infrastructure on AWS. It allows users to easily request and provision resources like S3 buckets, RDS databases, and EKS clusters through a user-friendly interface, reducing the need for deep cloud expertise.

<p>The complete source code for Puluforge is available in the following GitHub repository:</p>
<p><a href="https://github.com/abdelbaki-nazim/workflows" target="_blank" rel="noopener noreferrer">https://github.com/abdelbaki-nazim/workflows</a></p>

<p>This repository contains three core components working together:</p>
<ol>
    <li><strong>The Puluforge Next.js Application:</strong> Provides the web interface (frontend) for users to make requests and the backend API to handle those requests.</li>
    <li><strong>The Pulumi Project (<code>pulumi/</code> directory):</strong> Contains the Infrastructure as Code (IaC) written in TypeScript, which defines the AWS resources to be created.</li>
    <li><strong>The GitHub Actions Workflow (<code>.github/workflows/</code>):</strong> Automates the deployment process, acting as the bridge between the Next.js application and the Pulumi code execution.</li>
</ol>

<strong>Key Benefits:</strong>
<ul>
    <li>Simplified AWS resource provisioning.</li>
    <li>Self-service experience allowing users to manage their own infrastructure stacks.</li>
    <li>Automation using Pulumi for consistent and repeatable deployments.</li>
    <li>Guided infrastructure setup through a web interface.</li>
</ul>
    `,
  },
  {
    title: "System Architecture",
    content: `
Puluforge’s architecture is designed for modularity and scalability. The key components include:
Puluforge utilizes a modular architecture where different components collaborate to fulfill infrastructure requests. The typical flow involves these key parts:

<ul>
    <li><strong>Puluforge Next.js Application:</strong> This is the user-facing component. It includes:
        <ul>
            <li>A frontend built with Next.js and React, providing the multi-step form for users to specify their desired resources (S3, RDS, EKS) and configuration.</li>
            <li>Backend API routes (e.g., <code>/api/deploy</code>, <code>/api/logs</code>) that handle form submissions, trigger the deployment process, and stream logs back to the user.</li>
        </ul>
    </li>
    <li><strong>GitHub Actions Workflow (<code>.github/workflows/deploy.yml</code>):</strong> This workflow acts as the central orchestrator for deployments.
        <ul>
            <li>It is triggered programmatically by a call from the Next.js application's <code>/api/deploy</code> route.</li>
            <li>It checks out the code, sets up Node.js and Pulumi, reads secrets (like AWS keys), sets Pulumi configuration based on the user's request, and runs the <code>pulumi up</code> command.</li>
        </ul>
    </li>
    <li><strong>Pulumi Project (<code>pulumi/</code> directory):</strong> This contains the Infrastructure as Code (IaC) definitions written in TypeScript.
        <ul>
            <li>The code reads configuration values set by the GitHub Actions workflow.</li>
            <li>It defines the desired state of the AWS resources (S3 buckets, RDS clusters/instances, EKS clusters) based on that configuration.</li>
        </ul>
    </li>
    <li><strong>AWS Infrastructure:</strong> These are the actual cloud resources provisioned in your AWS account by Pulumi as a result of the deployment process. Puluforge manages these resources within distinct Pulumi stacks, typically named using the user ID (e.g., <code>user123-resources</code>) for isolation.</li>
</ul>

<p>This architecture connects a user-friendly web interface to powerful infrastructure automation, using GitHub Actions as the secure link between the application and the cloud environment.</p>
    `,
  },
  {
    title: "Pulumi Project Setup",
    content: `
The infrastructure code for Puluforge resides within the <code>pulumi/</code> directory of the main repository. After cloning the repository, you'll find the standard structure for a Pulumi TypeScript project:

<ul>
    <li><strong><code>index.ts </code>:</strong> This is the heart of the project, containing the TypeScript code that defines your AWS resources (S3, RDS, EKS) using the Pulumi SDK.</li>
    <li><strong><code>Pulumi.yaml</code>:</strong> Defines project metadata like the project name (<code>puluforge</code>) and the runtime (<code>nodejs</code>). While you can set default configuration values here, Puluforge typically relies on configuration set dynamically during deployment.</li>
    <li><strong><code>package.json</code> / <code>package-lock.json</code>:</strong> Standard Node.js files managing project dependencies (like <code>@pulumi/pulumi</code>, <code>@pulumi/aws</code>, <code>@pulumi/eks</code>).</li>
    <li><strong><code>node_modules/</code>:</strong> Contains the installed Node.js packages. This directory is usually generated by running <code>npm install</code> or <code>npm ci</code> within the <code>pulumi/</code> directory.</li>
    <li><strong><code>tsconfig.json</code>:</strong> Configures the TypeScript compiler options for the project.</li>
</ul>

<p>You typically don't need to run <code>pulumi new</code>; the project is already set up. The primary interaction with this code happens automatically during the deployment workflow triggered by the Next.js application.</p>
    `,
  },
  {
    title: "AWS Credentials and Pulumi Config",
    content: `
    <p>Pulumi uses a configuration system to manage settings that can vary between deployments or stacks, including sensitive data like credentials. In Puluforge, this configuration is handled automatically by the GitHub Actions workflow:</p>

    <strong>1. Source of Configuration:</strong>
    <ul>
        <li><strong>GitHub Secrets:</strong> Sensitive values like AWS access keys (<code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code>) and the Pulumi Access Token are stored securely as GitHub Actions Secrets for the repository.</li>
        <li><strong>Workflow Inputs:</strong> Non-sensitive values, such as the <code>userId</code>, choices about which resources to create (<code>createS3</code>, etc.), and resource names (<code>s3BucketName</code>, etc.), are passed as inputs when the workflow is triggered by the Next.js API call.</li>
    </ul>
    
    <strong>2. Setting Configuration During Deployment:</strong>
    <p>The <code>.github/workflows/deploy.yml</code> workflow takes these secrets and inputs and uses the <code>pulumi config set</code> command internally right before deploying. For example, it runs commands like:</p>
    <div class="code-block"><pre><code>
    # Inside the GitHub Actions workflow run:
    pulumi config set awsAccessKey $AWS_ACCESS_KEY_ID
    pulumi config set awsSecretKey $AWS_SECRET_ACCESS_KEY --secret
    pulumi config set awsRegion $AWS_REGION
    pulumi config set createS3 $CREATE_S3 
    # ... and so on for other inputs/secrets
    </code></pre></div>
    <p>This sets the configuration specifically for the stack being deployed (e.g., <code>user123-resources</code>).</p>
    
    <strong>3. Accessing Configuration in Code:</strong>
    <p>The <code>pulumi/index.ts</code> code then reads this configuration using the <code>pulumi.Config</code> class to access AWS keys, determine which resources to create, and get specific names or settings:</p>
    <div class="code-block"><pre><code>
    const config = new pulumi.Config();
    
    // Example: Reading AWS credentials (set by the workflow)
    const awsAccessKey = config.require("awsAccessKey");
    const awsSecretKey = config.requireSecret("awsSecretKey");
    const awsRegion = config.require("awsRegion");
    
    // Example: Checking if S3 creation was requested
    const shouldCreateS3 = config.getBoolean("createS3"); 
    if (shouldCreateS3 === true) {
      // Read S3 specific config or use defaults
      const bucketName = config.get("s3BucketName") || "default-s3-bucket";
      // ... create S3 bucket ...
    }
    </code></pre></div>
    
    <p>This approach ensures that each deployment uses the correct settings provided by the user via the Puluforge UI and keeps sensitive credentials secure, managed by the automated workflow rather than manual user commands.</p>
    `,
  },
  {
    title: "Infrastructure Code (S3, RDS, EKS)",
    content: `
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

</br>
<strong>RDS MySQL Instance Definition</strong>
<p>If <code>createRDS</code> is true, a standard AWS RDS MySQL instance is provisioned. It requires a secret configuration key named <code>databases</code>, which must contain a JSON string representing an array with at least one database object (containing <code>dbName</code>, <code>username</code>, and <code>password</code>). The code creates necessary networking (Subnet Group) and parameter groups before defining the instance itself.</p>
<div class="code-block"><pre><code>
// Note: Outputs like rdsInstanceEndpoint/rdsInstancePort should be declared outside this block

if (config.getBoolean("createRDS") === true) {
  console.log("RDS creation requested. Proceeding...");

  // Read DB details from a required secret config key expected to be JSON
  const databasesSecretJson = config.requireSecret("databases");

  // Process the secret JSON securely using .apply()
  const dbDetails = databasesSecretJson.apply((jsonString) => {
    try {
        const databases = JSON.parse(jsonString);
        if (databases.length > 0 && databases[0].dbName && databases[0].username && databases[0].password) {
            return {
                dbName: databases[0].dbName as string,
                dbUsername: databases[0].username as string,
                dbPassword: pulumi.secret(databases[0].password), // Ensure password remains a secret Output
                isValid: true,
            };
        }
    } catch (e) { console.error("Failed to parse 'databases' secret JSON:", e); }
    // Return dummy structure on failure to avoid runtime errors downstream
    return { dbName: "", dbUsername: "", dbPassword: pulumi.secret(""), isValid: false };
  });

  dbDetails.apply(details => {
      if (details.isValid) {
          const stackName = pulumi.getStack();
          const dbInstanceIdentifier = \`\${stackName}-db-instance\`;

          // Networking: Create a Subnet Group using specific subnet IDs
          const dbSubnetGroup = new aws.rds.SubnetGroup(\`\${stackName}-dbsubnetgroup\`, {
              // Using hardcoded example subnet IDs from the provided code
              subnetIds: ["subnet-0607d56e3d621b404", "subnet-02f60cf6daf7187d9"],
              tags: { Name: \`\${stackName}-dbsubnetgroup\` },
          }, { provider: awsProvider });

          // Parameters: Create a Parameter Group for MySQL 8.0
          const dbParameterGroup = new aws.rds.ParameterGroup(\`\${stackName}-dbparamgroup\`, {
              family: "mysql8.0", // Parameter family for MySQL 8.0
              parameters: [
                  { name: "character_set_server", value: "utf8mb4" },
                  { name: "character_set_client", value: "utf8mb4" },
              ],
              tags: { Name: \`\${stackName}-dbparamgroup\` },
          }, { provider: awsProvider });

          // Create the RDS Instance
          const rdsInstance = new aws.rds.Instance(dbInstanceIdentifier, {
              identifier: dbInstanceIdentifier,
              engine: "mysql",
              engineVersion: "8.0",
              instanceClass: "db.t3.micro",
              allocatedStorage: 20,
              dbName: details.dbName,          // Use processed name
              username: details.dbUsername,    // Use processed user
              password: details.dbPassword,    // Pass the secret Output directly
              dbSubnetGroupName: dbSubnetGroup.name,
              parameterGroupName: dbParameterGroup.name,
              // Using hardcoded example security group ID from the provided code
              vpcSecurityGroupIds: ["sg-032569d223f9915df"],
              multiAz: false,                 
              publiclyAccessible: true,       
              skipFinalSnapshot: true,        
              applyImmediately: true,      
              tags: { Name: dbInstanceIdentifier, Environment: stackName },
          }, {
              provider: awsProvider,
              dependsOn: [dbSubnetGroup, dbParameterGroup] 
          });

          // Assign outputs (inside .apply ensures rdsInstance is created)
          // These assume rdsInstanceEndpoint/rdsInstancePort are declared elsewhere (e.g., top level)
          // Endpoint is split to get only the hostname
          rdsInstanceEndpoint = rdsInstance.endpoint.apply(endpoint => endpoint.split(":")[0]);
          rdsInstancePort = rdsInstance.port; // Port is a direct number Output

          console.log(\`RDS Instance \${dbInstanceIdentifier} creation initiated.\`);
      } else {
         console.log("Skipping RDS creation due to invalid/missing 'databases' config.");
      }
  }); // End of dbDetails.apply

} else {
  console.log("RDS creation not requested.");
}
</code></pre></div>

</br>

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
      publicSubnetIds: [ /* Subnet IDs */ ],
      nodeGroupOptions: {
        instanceProfileName: nodeInstanceProfile.name,
        instanceType: "t3.medium",
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
Security and resource isolation are handled in Puluforge through several mechanisms:

<ul>
    <li><strong>User Identification:</strong> While the application is set up with NextAuth.js for potential user authentication, the current demo version allows manual entry of a <code>userId</code>. This ID is crucial for separating resources.</li>
    <li><strong>Multi-Tenancy via Stacks:</strong> Resource isolation is achieved by creating a dedicated Pulumi stack for each deployment, named using the provided user ID (e.g., <code>user123-resources</code>). This ensures that one user's deployment doesn't interfere with another's.</li>
    <li><strong>Credential Management:</strong> The system currently relies on long-lived AWS access keys (<code>AWS_ACCESS_KEY_ID</code> and <code>AWS_SECRET_ACCESS_KEY</code>). These are stored securely as GitHub Actions secrets and passed to Pulumi during deployment via configuration. The Pulumi program uses these keys to authenticate with AWS.</li>
    <li><strong>API Security:</strong> The backend API route (<code>/api/deploy</code>) securely interacts with the GitHub API using a server-side environment variable (<code>process.env.GITHUB_TOKEN</code>) to trigger the workflow. Direct access control to the API endpoint itself could be further enhanced using session validation from NextAuth.js if strict user login were enforced.</li>
    <li><strong>Network Isolation:</strong> Resources like the RDS database instances are configured to be private within the VPC (<code>publiclyAccessible: false</code>), reducing their exposure.</li>
</ul>
    `,
  },
  {
    title: "Future Enhancements and Conclusion",
    content: `
<strong>Future Enhancements:</strong>

<p>While Puluforge provides a functional self-service platform, several areas can be enhanced:</p>
<ul>
    <li><strong>Enforce Authentication:</strong> Fully integrate and enforce user login using NextAuth.js to replace manual <code>userId</code> entry and secure API access based on user sessions.</li>
    <li><strong>Temporary Credentials:</strong> Transition from long-lived AWS keys to temporary credentials using IAM Roles, potentially integrating with GitHub Actions OIDC or AWS Cognito for enhanced security.</li>
    <li><strong>Configuration Flexibility:</strong> Replace hardcoded values in the Pulumi code (like EKS VPC/subnet IDs or instance types) with configurable options passed through the UI and API.</li>
    <li><strong>Refined UI/UX:</strong> Enhance the multi-step form with more robust validation, feedback, and potentially specific UI component libraries.</li>
    <li><strong>Resource Management:</strong> Add features to view the status of ongoing and past deployments (leveraging the data saved in local storage) and potentially add functionality to update or destroy previously created infrastructure stacks.</li>
    <li><strong>Error Handling & Rollbacks:</strong> Improve error reporting during deployment and explore implementing automated rollback procedures if a Pulumi deployment fails.</li>
    <li><strong>Resource Tagging:</strong> Implement consistent tagging of all created AWS resources with user IDs, stack names, or other relevant metadata for better cost tracking and auditing.</li>
    <li><strong>Monitoring & Alerting:</strong> Integrate monitoring for deployed resources (e.g., using AWS CloudWatch) and set up alerts for critical issues.</li>
    <li><strong>Multi-Account Deployments:</strong> Explore options to allow authenticated users to deploy resources into their own designated AWS accounts.</li>
</ul>

<strong>Conclusion:</strong><br/>
Puluforge demonstrates a practical approach to building a self-service infrastructure platform. By combining a Next.js frontend and API with the power of Pulumi for infrastructure definition and GitHub Actions for orchestration, it enables users to request and manage AWS resources like S3, RDS, and EKS through a simplified interface. This documentation outlines the current setup and provides a clear path for future improvements and scaling.
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
