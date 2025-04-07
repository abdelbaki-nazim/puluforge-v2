"use client";

import React from "react";
import { Button } from "@progress/kendo-react-buttons";
import "./FeatureComparisonCard.css";

interface Feature {
  id: number;
  feature: string;
  aws: string;
  puluforge: string;
}

const features: Feature[] = [
  {
    id: 1,
    feature: "Self-Service Portal",
    aws: "Requires configuration",
    puluforge: "Instant access",
  },
  {
    id: 2,
    feature: "Safe Experimentation per User",
    aws: "Requires careful setup",
    puluforge: "Advanced per-user isolation",
  },
  {
    id: 3,
    feature: "Credential Management",
    aws: "Requires configuration",
    puluforge: "Automated and secure",
  },
  {
    id: 4,
    feature: "Multi-User Isolation",
    aws: "Can involve detailed configuration",
    puluforge: "Seamless and built-in",
  },
  {
    id: 5,
    feature: "Custom Workflows/Templates",
    aws: "Requires defining templates",
    puluforge: "Effortless customization",
  },
  {
    id: 6,
    feature: "CI/CD Integration",
    aws: "Requires pipeline configuration",
    puluforge: "Native support",
  },
];

const FeatureComparisonCard: React.FC = () => {
  return (
    <div className="k-card comparison-card">
      <div className="k-card-header">
        <h4 className="comparison-header">
          Why Choose Puluforge Over Direct AWS Console Management?
        </h4>
      </div>

      <div className="k-card-body">
        <p className="comparison-intro">
          Puluforge simplifies cloud infrastructure management compared to
          configuring AWS services directly. Here’s a comparison:
        </p>
        <div className="grid-container">
          <div className="custom-grid">
            <div className="custom-grid-row header-row">
              <div className="custom-grid-cell header-cell">Feature</div>
              <div className="custom-grid-cell header-cell">
                AWS Native Approach
              </div>
              <div className="custom-grid-cell header-cell">Puluforge</div>
            </div>
            {features.map((item, index) => (
              <div
                key={item.id}
                className={`custom-grid-row ${
                  index % 2 === 0 ? "even" : "odd"
                }`}
              >
                <div className="custom-grid-cell feature-cell">
                  {item.feature}
                </div>
                <div className="custom-grid-cell aws-cell">{item.aws}</div>
                <div className="custom-grid-cell puluforge-cell">
                  <i className="fas fa-check-circle"></i>
                  {item.puluforge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="k-card-actions">
        <Button
          themeColor={"primary"}
          className="full-radius-button"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          Discover Puluforge Now
        </Button>
      </div>
    </div>
  );
};

export default FeatureComparisonCard;
