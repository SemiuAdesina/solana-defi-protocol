"use client";

import type { CiStatus, RegistryMetadata } from "../lib/api";
import { FaCheckCircle, FaCircle, FaFileAlt, FaCheck, FaProjectDiagram } from "react-icons/fa";
import { useMediaQuery } from "../lib/useMediaQuery";

const readinessItems = [
  {
    title: "Registry Metadata Published",
    description: "Ensure registry metadata URI and checksum are set on-chain.",
    icon: <FaFileAlt />
  },
  {
    title: "CI Passing",
    description: "Latest pipeline must succeed with lint + tests + coverage.",
    icon: <FaCheck />
  },
  {
    title: "GraphQL Integration",
    description: "Expose metadata & CI status via /graphql for reviewers.",
    icon: <FaProjectDiagram />
  }
] as const;

type SubsidyChecklistProps = {
  metadata: RegistryMetadata | null;
  statuses: CiStatus[];
};

export const SubsidyChecklist = ({ metadata, statuses }: SubsidyChecklistProps) => {
  const latestStatus = statuses[0];
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmallMobile = useMediaQuery("(max-width: 480px)");

  const completed = {
    metadata: Boolean(metadata?.metadataUri),
    ci: latestStatus?.status === "success",
    graphql: true
  };

  return (
    <section style={{ 
      position: 'relative', 
      overflow: 'hidden',
      borderRadius: isSmallMobile ? '16px' : '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
      padding: isSmallMobile ? '12px' : isMobile ? '16px' : '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }}>
      <div style={{ 
        position: 'absolute', 
        inset: 0,
        background: 'linear-gradient(to right, rgba(52, 211, 153, 0), rgba(20, 184, 166, 0))',
        pointerEvents: 'none',
        borderRadius: isSmallMobile ? '16px' : '24px'
      }}></div>
      <header style={{ 
        marginBottom: isSmallMobile ? '16px' : isMobile ? '20px' : '24px', 
        position: 'relative', 
        zIndex: 10 
      }}>
        <p style={{ 
          fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '12px', 
          color: 'rgba(52, 211, 153, 0.8)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          fontWeight: 600, 
          marginBottom: '4px' 
        }}>
          Subsidy Checklist
        </p>
        <p style={{ 
          fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px', 
          fontWeight: 'bold', 
          color: '#ffffff' 
        }}>
          Audit-Ready Requirements
        </p>
      </header>
      <ul style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isSmallMobile ? '8px' : isMobile ? '10px' : '12px', 
        position: 'relative', 
        zIndex: 10, 
        listStyle: 'none', 
        padding: 0, 
        margin: 0 
      }}>
        {readinessItems.map((item) => {
          const key = item.title.split(" ")[0].toLowerCase() as keyof typeof completed;
          const done = completed[key];
          return (
            <li 
              key={item.title} 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: isSmallMobile ? '10px' : isMobile ? '12px' : '16px', 
                padding: isSmallMobile ? '12px' : isMobile ? '14px' : '16px', 
                borderRadius: isSmallMobile ? '8px' : '12px', 
                border: done ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)', 
                backgroundColor: done ? 'rgba(52, 211, 153, 0.2)' : 'rgba(0, 0, 0, 0.4)' 
              }}
            >
              {done ? (
                <FaCheckCircle style={{ 
                  marginTop: '2px', 
                  color: '#6ee7b7', 
                  flexShrink: 0, 
                  fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px' 
                }} />
              ) : (
                <FaCircle style={{ 
                  marginTop: '2px', 
                  color: '#64748b', 
                  flexShrink: 0, 
                  fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px' 
                }} />
              )}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: isSmallMobile ? '8px' : isMobile ? '10px' : '12px', 
                flex: 1,
                minWidth: 0
              }}>
                <span style={{ 
                  marginTop: '2px', 
                  fontSize: isSmallMobile ? '14px' : isMobile ? '16px' : '18px', 
                  color: done ? '#6ee7b7' : '#64748b',
                  flexShrink: 0
                }}>
                  {item.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', 
                    fontWeight: 'bold', 
                    color: '#ffffff', 
                    marginBottom: isSmallMobile ? '2px' : '4px',
                    wordBreak: 'break-word'
                  }}>
                    {item.title}
                  </p>
                  <p style={{ 
                    fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '12px', 
                    color: '#94a3b8', 
                    lineHeight: '1.75',
                    wordBreak: 'break-word'
                  }}>
                    {item.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
