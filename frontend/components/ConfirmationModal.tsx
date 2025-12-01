"use client";

import { FaExclamationTriangle, FaCheck } from "react-icons/fa";

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "warning" | "danger" | "info";
};

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning"
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const variantStyles = {
    warning: {
      icon: FaExclamationTriangle,
      iconColor: "#fbbf24",
      borderColor: "rgba(251, 191, 36, 0.3)",
      bgGradient: "linear-gradient(to right, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))",
      buttonBg: "linear-gradient(to right, rgba(251, 191, 36, 0.6), rgba(245, 158, 11, 0.6))",
      buttonBorder: "rgba(251, 191, 36, 0.5)"
    },
    danger: {
      icon: FaExclamationTriangle,
      iconColor: "#f87171",
      borderColor: "rgba(248, 113, 113, 0.3)",
      bgGradient: "linear-gradient(to right, rgba(248, 113, 113, 0.1), rgba(239, 68, 68, 0.1))",
      buttonBg: "linear-gradient(to right, rgba(248, 113, 113, 0.6), rgba(239, 68, 68, 0.6))",
      buttonBorder: "rgba(248, 113, 113, 0.5)"
    },
    info: {
      icon: FaExclamationTriangle,
      iconColor: "#60a5fa",
      borderColor: "rgba(96, 165, 250, 0.3)",
      bgGradient: "linear-gradient(to right, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.1))",
      buttonBg: "linear-gradient(to right, rgba(96, 165, 250, 0.6), rgba(59, 130, 246, 0.6))",
      buttonBorder: "rgba(96, 165, 250, 0.5)"
    }
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
      onClick={onCancel}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))",
          borderRadius: "24px",
          border: `1px solid ${styles.borderColor}`,
          padding: "32px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(16px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              borderRadius: "12px",
              background: styles.bgGradient,
              padding: "12px",
              border: `1px solid ${styles.borderColor}`,
              flexShrink: 0
            }}>
              <Icon style={{ fontSize: "24px", color: styles.iconColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#ffffff",
                marginBottom: "8px"
              }}>
                {title}
              </h3>
              <div style={{
                fontSize: "14px",
                color: "#94a3b8",
                lineHeight: "1.75",
                whiteSpace: "pre-line"
              }}>
                {message}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "12px 24px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "12px 24px",
                borderRadius: "8px",
                background: styles.buttonBg,
                border: `1px solid ${styles.buttonBorder}`,
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FaCheck />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


