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
Your Next.js API route triggers deployments using the Pulumi Automation API. For example, your <code>deploy.ts</code> may contain:

<div class="code-block">
  <code>
    import * as automation from "@pulumi/pulumi/automation";<br/>
    import * as path from "path";<br/><br/>

    export async function runDeployment(configOptions: {<br/>
      userId: string;<br/>
      createS3: boolean;<br/>
      createRDS: boolean;<br/>
      createEKS: boolean;<br/>
      s3BucketName?: string;<br/>
      databases: { dbName: string; username: string; password: string }[];<br/>
    }): Promise&lt;any&gt; {<br/>
      const workDir = path.resolve("C:/Your/Project/Path/pulumi");<br/>
      const stackName = \`\${configOptions.userId}-losangeDev\`;<br/>
      const stack = await automation.LocalWorkspace.createOrSelectStack({ stackName, workDir });<br/><br/>

      await stack.setConfig("createS3", { value: configOptions.createS3.toString() });<br/>
      await stack.setConfig("createRDS", { value: configOptions.createRDS.toString() });<br/>
      await stack.setConfig("createEKS", { value: configOptions.createEKS.toString() });<br/>
      await stack.setConfig("s3BucketName", { value: configOptions.s3BucketName || "default-s3-bucket" });<br/>
      await stack.setConfig("databases", { value: JSON.stringify(configOptions.databases) });<br/><br/>

      const upResult = await stack.up({ onOutput: console.info });<br/>
      return upResult.outputs;<br/>
    }
  </code>
</div>

Your Next.js API route (for example, at <code>/api/deploy</code>) calls this function to trigger deployments dynamically.
    `,
  },
  {
    title: "AWS Lambda Integration for Pulumi Deployments",
    content: `
Running long Pulumi deployments directly from serverless functions (like Vercel) can be challenging. Instead, you can offload these to AWS Lambda:

<ul>
  <li><strong>Bundle Your Pulumi Folder:</strong> Package your Pulumi project (compiled code + <code>node_modules</code>) into a ZIP file.</li>
  <li><strong>Create a Lambda Function:</strong> In the AWS Console, create a function (e.g., <code>PulumiDeploymentFunction</code>) using Node.js 16.x.</li>
  <li><strong>Upload Your ZIP Package:</strong> Under Function Code, upload your deployment ZIP.</li>
  <li><strong>Set Environment Variables:</strong> Configure AWS credentials and Pulumi tokens in Lambda’s environment variables.</li>
  <li><strong>Configure API Gateway (Optional):</strong> Trigger the Lambda via API Gateway, then have your Next.js API call that endpoint.</li>
</ul>
    `,
  },
  {
    title: "CI/CD Integration Using GitHub Actions",
    content: `
You can automate Puluforge deployments with GitHub Actions. A typical workflow file (<code>.github/workflows/deploy.yml</code>):

<div class="code-block">
  <code>
    name: Deploy Pulumi Stack<br/>
    on: [workflow_dispatch]<br/><br/>

    jobs:<br/>
      deploy:<br/>
        runs-on: ubuntu-latest<br/>
        steps:<br/>
          - uses: actions/checkout@v3<br/>
          - uses: actions/setup-node@v3<br/>
            with:<br/>
              node-version: "18"<br/>
          - name: Install Pulumi CLI<br/>
            run: npm install -g @pulumi/pulumi<br/>
          - name: Install dependencies<br/>
            working-directory: ./pulumi<br/>
            run: npm ci<br/>
          - name: Build Pulumi program<br/>
            working-directory: ./pulumi<br/>
            run: npm run build<br/>
          - name: Deploy Pulumi stack<br/>
            working-directory: ./pulumi<br/>
            env:<br/>
              AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}<br/>
              AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}<br/>
              AWS_REGION: \${{ secrets.AWS_REGION }}<br/>
              PULUMI_ACCESS_TOKEN: \${{ secrets.PULUMI_ACCESS_TOKEN }}<br/>
            run: |<br/>
              pulumi login<br/>
              npm run start
  </code>
</div>
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

export default function Documentation({
  showDirectly = true,
}: DocumentationProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredSteps, setFilteredSteps] = useState<Step[]>(steps);
  const [isPanelBarVisible, setIsPanelBarVisible] =
    useState<boolean>(showDirectly);
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
      {!showDirectly && (
        <>
          <hr className={styles.divider} />
          <Button
            type="button"
            fillMode={"link"}
            themeColor={"tertiary"}
            onClick={() => setIsPanelBarVisible(!isPanelBarVisible)}
            style={{ textAlign: "center", marginBottom: 30 }}
          >
            {isPanelBarVisible ? "Hide Documentation" : "See Documentation"}
          </Button>
        </>
      )}

      {(isPanelBarVisible || showDirectly) && (
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
      )}
    </div>
  );
}
