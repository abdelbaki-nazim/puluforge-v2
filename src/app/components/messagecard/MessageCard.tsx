"use client";

import React, { memo, useState, useCallback } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  CardActions,
} from "@progress/kendo-react-layout";
import { Button } from "@progress/kendo-react-buttons";

interface MessageCardProps {
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
  type?: "default" | "primary" | "info" | "success" | "warning" | "error";
}

const MessageCardComponent: React.FC<MessageCardProps> = ({
  title,
  message,
  buttonText,
  onButtonClick,
  type = "default",
}) => {
  const [visible, setVisible] = useState(true);

  const handleButtonClick = useCallback(() => {
    onButtonClick();
  }, [onButtonClick]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <Card style={{ width: 300, position: "relative" }} type={type}>
      <Button
        type="button"
        themeColor="light"
        onClick={handleClose}
        style={{
          position: "absolute",
          top: 5,
          right: 5,
          minWidth: "unset",
          padding: "0 6px",
        }}
      >
        X
      </Button>
      <CardBody>
        <CardTitle>{title}</CardTitle>
        <p>{message}</p>
      </CardBody>
      <CardActions>
        <Button
          type="button"
          themeColor={type === "default" ? "primary" : type}
          onClick={handleButtonClick}
        >
          {buttonText}
        </Button>
      </CardActions>
    </Card>
  );
};

export const MessageCard = memo(MessageCardComponent);
