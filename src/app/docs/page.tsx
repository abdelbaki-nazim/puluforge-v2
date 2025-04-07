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
    content: `
Your <code>index.ts</code> conditionally creates AWS resources. For example:

<strong>S3 Bucket:</strong>
<div class="code-block">
  <code>
    if (config.getBoolean("createS3") === true) {<br/>
      &nbsp;&nbsp;const s3BucketName = config.get("s3BucketName") || "default-s3-bucket";<br/>
      &nbsp;&nbsp;const bucket = new aws.s3.Bucket(\`bucket-\${s3BucketName}\`, {<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;bucket: s3BucketName,<br/>
      &nbsp;&nbsp;}, { provider: awsProvider });<br/>
      &nbsp;&nbsp;s3BucketOutput = bucket.bucket;<br/>
    }
  </code>
</div>

<strong>RDS (Aurora MySQL) Deployment:</strong>
<div class="code-block">
  <code>
    if (config.getBoolean("createRDS") === true) {<br/>
      &nbsp;&nbsp;const rdsInstanceIdentifier = "database-pulumi";<br/>
      &nbsp;&nbsp;const databases = JSON.parse(config.require("databases"));<br/>
      &nbsp;&nbsp;databases.forEach((db: any) =&gt; {<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;new aws.rds.ClusterInstance(\`rds-instance-\${db.dbName}\`, {<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;identifier: \`\${rdsInstanceIdentifier}-\${db.dbName}\`,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;clusterIdentifier: rdsInstanceIdentifier,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;instanceClass: "db.t4g.micro",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;engine: "aurora-mysql",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;engineVersion: "8.0",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;publiclyAccessible: false,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;applyImmediately: true,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;});<br/>
      &nbsp;&nbsp;});<br/>
    }
  </code>
</div>

<strong>EKS Cluster:</strong>
<div class="code-block">
  <code>
    if (config.getBoolean("createEKS") === true) {<br/>
      &nbsp;&nbsp;const eksClusterName = "fabulous-electro-gopher";<br/>
      &nbsp;&nbsp;const cluster = new eks.Cluster("eksCluster", {<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;name: eksClusterName,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;instanceType: "t3.medium",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;version: config.get("eksK8sVersion") || "1.31",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;vpcId: "vpc-04a0161c3cefe5035",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;publicSubnetIds: [<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"subnet-0a6f0e8d65f1fd095",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"subnet-03309b9ea4ced012b",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"subnet-0607d56e3d621b404",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"subnet-0e6e3f6c7ee38aa7b",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"subnet-02f60cf6daf7187d9",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"subnet-0416b66f4749be8ba",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;],<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;nodeGroupOptions: {<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;instanceProfileName: nodeInstanceProfile.name,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;desiredCapacity: 2,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;minSize: 1,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;maxSize: 3,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;},<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;providerCredentialOpts: {<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;profileName: config.get("awsProfile") || "default",<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;},<br/>
      &nbsp;&nbsp;});<br/>
      &nbsp;&nbsp;eksClusterOutput = cluster.eksCluster.name;<br/>
    }
  </code>
</div>
    `,
  },
  {
    title: "Next.js API Integration with Pulumi Automation",
    content: `
  Puluforge leverages the Pulumi Automation API to manage infrastructure deployments, orchestrated through a GitHub Actions workflow. While deployments are not directly triggered by a Next.js API route in this setup, you can integrate a Next.js application to initiate the process programmatically by invoking the GitHub Actions workflow. Below is an overview of how this works and how you can adapt it for your use case.
  
  <h3>Deployment Workflow</h3>
  Puluforge uses a GitHub Actions workflow (<code>.github/workflows/deploy.yml</code>) to deploy infrastructure. The workflow accepts user inputs (e.g., <code>userId</code>, resource creation flags) and executes the Pulumi Automation script. Here’s a simplified version of the workflow:
  
  <div class="code-block">
    <pre>
  name: Deploy Pulumi Stack
  on:
    workflow_dispatch:
      inputs:
        userId:
          description: "User ID"
          required: true
        createS3:
          description: "Create S3 Bucket"
          required: true
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Set up Node.js
          uses: actions/setup-node@v3
          with:
            node-version: "18"
        - name: Install Pulumi CLI
          run: npm install -g @pulumi/pulumi
        - name: Install dependencies
          working-directory: ./pulumi
          run: npm ci
        - name: Deploy Pulumi stack
          working-directory: ./pulumi
          env:
            PULUMI_ACCESS_TOKEN: \${{ secrets.PULUMI_ACCESS_TOKEN }}
            STACK_NAME: \${{ github.event.inputs.userId }}-resources
            AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
            AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
            AWS_REGION: \${{ secrets.AWS_REGION }}
            USER_ID: \${{ github.event.inputs.userId }}
            CREATE_S3: \${{ github.event.inputs.createS3 }}
          run: |
            pulumi stack init $STACK_NAME || echo "Stack already exists"
            pulumi up --skip-preview --yes
    </pre>
  </div>
  
  <h3>Pulumi Automation Script</h3>
  The workflow runs a TypeScript script (<code>runDeployment.ts</code>) that uses the Pulumi Automation API to configure and deploy the stack. Here’s an example of the script:
  
  <div class="code-block">
    <pre>
  import * as automation from "@pulumi/pulumi/automation";
  import * as path from "path";
  
  export async function runDeployment() {
    const workDir = path.resolve("../p2");
    const stackName = process.env.STACK_NAME as string;
    const stack = await automation.LocalWorkspace.createOrSelectStack({
      stackName,
      workDir,
    });
  
    await stack.setConfig("awsAccessKey", { value: process.env.AWS_ACCESS_KEY_ID || "" });
    await stack.setConfig("awsSecretKey", { value: process.env.AWS_SECRET_ACCESS_KEY || "", secret: true });
    await stack.setConfig("awsRegion", { value: process.env.AWS_REGION || "us-east-1" });
    await stack.setConfig("createS3", { value: process.env.CREATE_S3 || "" });
  
    console.log("Deploying...");
    const upResult = await stack.up({ onOutput: console.info });
    console.log("Done:", upResult.outputs);
    return upResult.outputs;
  }
    </pre>
  </div>
  
  <h3>Integrating with a Next.js API</h3>
  To trigger this deployment from a Next.js application, you can create an API route (e.g., <code>/api/deploy</code>) that uses the GitHub API to dispatch the workflow. Here’s how:
  
  1. **Set Up the API Route**: Create a file at <code>pages/api/deploy.ts</code> in your Next.js project.
  2. **Invoke the Workflow**: Use a GitHub Personal Access Token (PAT) to dispatch the <code>Deploy Pulumi Stack</code> workflow with user inputs.
  
  Example API route:
  
  <div class="code-block">
    <pre>
  import type { NextApiRequest, NextApiResponse } from 'next';
  import axios from 'axios';
  
  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  
    const { userId, createS3 } = req.body;
    const githubToken = process.env.GITHUB_TOKEN; // Store in .env.local
    const repoOwner = 'your-username'; // Replace with your GitHub username
    const repoName = 'your-repo'; // Replace with your repository name
  
    try {
      await axios.post(
        \`https://api.github.com/repos/\${repoOwner}/\${repoName}/actions/workflows/deploy.yml/dispatches\`,
        {
          ref: 'main', // Branch to trigger the workflow from
          inputs: {
            userId,
            createS3: createS3.toString(),
            createRDS: 'false', // Example default values
            createEKS: 'false',
            s3BucketName: '',
          },
        },
        {
          headers: {
            Authorization: \`Bearer \${githubToken}\`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      res.status(200).json({ message: 'Deployment triggered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to trigger deployment', error });
    }
  }
    </pre>
  </div>
  
  <h3>How It Works</h3>
  - A user sends a POST request to <code>/api/deploy</code> with parameters (e.g., <code>{ "userId": "user123", "createS3": true }</code>).
  - The API route dispatches the GitHub Actions workflow, passing the inputs.
  - The workflow runs <code>runDeployment.ts</code>, which deploys the infrastructure using the Pulumi Automation API.
  
  <h3>Monitor Progress</h3>
  - Use GitHub’s API to check workflow status and relay it back to the user.
      `,
  },
  {
    title: "Security, Authentication, and Multi-Tenancy",
    content: `
  Puluforge ensures a secure and isolated self-service platform tailored for multi-user environments:
  
  <ul>
    <li><strong>User Authentication:</strong> Currently, authentication is managed externally, with user-specific inputs (e.g., <code>userId</code>) provided during workflow dispatch to identify users initiating deployments.</li>
    <li><strong>Multi-Tenancy:</strong> Each user receives a dedicated Pulumi stack (e.g., <code>{userId}-resources</code>), ensuring resource isolation by provisioning separate instances of S3 buckets, RDS clusters, and EKS clusters per user.</li>
    <li><strong>Credential Management:</strong> Leverages Pulumi’s built-in secret management to encrypt and manage AWS credentials (e
  
  .g., <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code>) securely within the stack configuration, sourced from GitHub Secrets for automated deployment.</li>
    <li><strong>Network Isolation:</strong> Enforces resource isolation through private RDS instances (<code>publiclyAccessible: false</code>) and EKS clusters deployed within a specific VPC and subnet configuration, minimizing exposure to external access.</li>
    <li><strong>Deployment Security:</strong> Deployment workflows are triggered manually via GitHub Actions, with access controlled by repository permissions and secured by a Pulumi access token stored as a GitHub Secret.</li>
  </ul>
  
  <p><strong>Note:</strong> Features like federated identity with temporary AWS credentials, API endpoint security with JWT or API keys, and comprehensive resource tagging for auditing are not yet implemented in the provided configuration. These enhancements can be integrated to further strengthen security and traceability.</p>
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
