// src/components/DeployedResourcesList/DeployedResourcesList.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardTitle, CardSubtitle } from "@progress/kendo-react-layout"; // Corrected CardSubtitle import
import { Button } from '@progress/kendo-react-buttons';
import { Typography } from "@progress/kendo-react-common"; // Import Typography if needed
import styles from './DeployedResourcesList.module.css'; // Assuming you create this CSS module

// --- Interfaces (Redefine or import from a shared types file) ---
// It's best practice to define these in a shared types file and import them
// in both DeploymentForm.tsx and DeployedResourcesList.tsx
interface StoredDeploymentOutput {
    s3?: { bucketName: string; bucketUrl?: string; region?: string; };
    rds?: { instanceEndpoint: string; dbName: string; username: string; region?: string; };
    eks?: { clusterName: string; clusterEndpoint?: string; region?: string; };
}

interface StoredDeployment {
    runId: string;
    userId: string;
    timestamp: string;
    status: 'success';
    outputs: StoredDeploymentOutput;
    requested: { createS3: boolean; createRDS: boolean; createEKS: boolean; };
}

const LOCAL_STORAGE_KEY = 'cloudDeployments'; // Must match the key used in DeploymentForm

const DeployedResourcesList = () => {
    const [deployments, setDeployments] = useState<StoredDeployment[]>([]);

    // Function to load deployments from localStorage
    const loadDeployments = () => {
        try {
            const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                if (Array.isArray(parsedData)) {
                    // Optional: Sort by timestamp descending (most recent first)
                    parsedData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    setDeployments(parsedData);
                } else {
                     console.warn("Stored deployment data is not an array.");
                     setDeployments([]); // Reset if data is malformed
                }
            } else {
                 setDeployments([]); // No data found
            }
        } catch (error) {
            console.error("Failed to load or parse deployments from localStorage:", error);
            setDeployments([]); // Reset on error
        }
    };

    // Load deployments when the component mounts
    useEffect(() => {
        loadDeployments();
         // If you implement a refresh mechanism (e.g., custom event), listen here:
         // const handleRefresh = () => loadDeployments();
         // window.addEventListener('deploymentsUpdated', handleRefresh);
         // return () => window.removeEventListener('deploymentsUpdated', handleRefresh);
    }, []); // Empty dependency array ensures this runs only on mount

    // Function to clear all stored records
    const clearAllDeployments = () => {
        // Add confirmation dialog for safety
        if (window.confirm("Are you sure you want to clear all stored deployment records? This cannot be undone.")) {
            try {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                setDeployments([]); // Update state immediately
            } catch (error) {
                 console.error("Failed to clear deployments from localStorage:", error);
            }
        }
    };

    // Helper to format timestamp
     const formatTimestamp = (isoString: string) => {
        try {
            // Adjust options for desired format
            return new Date(isoString).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
        } catch {
            return isoString; // Fallback if parsing fails
        }
    };

    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                 <Typography.h4>Deployment History (Successful)</Typography.h4>
                 {/* Add a button to clear the history */}
                 <Button
                    themeColor="warning"
                    fillMode="outline" // Use outline for less prominence
                    size="small"
                    onClick={clearAllDeployments}
                    disabled={deployments.length === 0} // Disable if nothing to clear
                 >
                     Clear History
                 </Button>
            </div>

            {deployments.length === 0 ? (
                <Typography.p>No successful deployments recorded in local storage.</Typography.p>
            ) : (
                // Use a grid layout for the cards
                <div className={styles.cardGrid}>
                    {deployments.map((dep) => (
                        <Card key={dep.runId} className={styles.deploymentCard}>
                            <CardHeader className="k-hbox">
                                {/* Card Header Content */}
                                <div>
                                     <CardTitle className={styles.cardTitle}>Run: {dep.runId.substring(0, 8)}...</CardTitle>
                                     <CardSubtitle className={styles.cardSubtitle}> {/* Use CardSubtitle */}
                                         <Typography.p> {/* Wrap text in Typography */}
                                            By: {dep.userId} <br/>
                                            On: {formatTimestamp(dep.timestamp)}
                                         </Typography.p>
                                     </CardSubtitle>
                                </div>
                            </CardHeader>
                            <CardBody>
                                {/* Display S3 details if requested and available */}
                                {dep.requested.createS3 && dep.outputs.s3 && (
                                    <div className={styles.resourceSection}>
                                        <strong>S3 Bucket</strong>
                                        <p>Name: <code>{dep.outputs.s3.bucketName}</code></p>
                                        {/* Make URL clickable */}
                                        {dep.outputs.s3.bucketUrl && <p>URL: <a href={dep.outputs.s3.bucketUrl} target="_blank" rel="noopener noreferrer">{dep.outputs.s3.bucketUrl}</a></p>}
                                        {dep.outputs.s3.region && <p>Region: {dep.outputs.s3.region}</p>}
                                    </div>
                                )}
                                {/* Display RDS details if requested and available */}
                                {dep.requested.createRDS && dep.outputs.rds && (
                                     <div className={styles.resourceSection}>
                                        <strong>RDS Instance</strong>
                                        <p>Endpoint: <code>{dep.outputs.rds.instanceEndpoint}</code></p>
                                        <p>DB Name: {dep.outputs.rds.dbName}</p>
                                        <p>Username: {dep.outputs.rds.username}</p>
                                         {dep.outputs.rds.region && <p>Region: {dep.outputs.rds.region}</p>}
                                    </div>
                                )}
                                {/* Display EKS details if requested and available */}
                                 {dep.requested.createEKS && dep.outputs.eks && (
                                     <div className={styles.resourceSection}>
                                        <strong>EKS Cluster</strong>
                                        <p>Name: <code>{dep.outputs.eks.clusterName}</code></p>
                                         {dep.outputs.eks.clusterEndpoint && <p>Endpoint: <code>{dep.outputs.eks.clusterEndpoint}</code></p>}
                                         {dep.outputs.eks.region && <p>Region: {dep.outputs.eks.region}</p>}
                                    </div>
                                )}
                                {/* Fallback message if no specific outputs are stored */}
                                {!dep.outputs.s3 && !dep.outputs.rds && !dep.outputs.eks && Object.keys(dep.outputs).length === 0 && (
                                    <Typography.p>No specific output details were stored for this deployment.</Typography.p>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeployedResourcesList;