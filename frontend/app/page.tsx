"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { useCallback, useState } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { FaCodeBranch, FaChevronDown, FaChevronUp, FaExclamationTriangle } from "react-icons/fa";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMediaQuery } from "../lib/useMediaQuery";

import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Footer } from "../components/Footer";
import { SectionDivider } from "../components/SectionDivider";
import { MetadataCard } from "../components/MetadataCard";
import { CiStatusBoard } from "../components/CiStatusBoard";
import { fetchMetadata, fetchCiStatuses, type RegistryMetadata, type CiStatus } from "../lib/api";
import { SubsidyChecklist } from "../components/SubsidyChecklist";

const GraphExplorer = dynamic(() => import("../components/GraphExplorer"), {
  ssr: false,
  loading: () => <div>Loading GraphQL explorer…</div>
});

const WalletSection = dynamic(() => import("../components/WalletSection").then(mod => ({ default: mod.WalletSection })), {
  ssr: false,
  loading: () => <div>Loading wallet section…</div>
});

export default function HomePage() {
  const [authority, setAuthority] = useState<string | null>(null);
  const [isGraphQLExpanded, setIsGraphQLExpanded] = useState(true);
  const [isDevnetWarningDismissed, setIsDevnetWarningDismissed] = useState(false);
  const { connection } = useConnection();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmallMobile = useMediaQuery("(max-width: 480px)");
  
  // Check if we're on Devnet
  const rpcUrl = connection && connection.rpcEndpoint ? String(connection.rpcEndpoint) : "";
  const isDevnet = rpcUrl.includes("devnet") || rpcUrl.includes("api.devnet.solana.com");

  type MetadataKey = ["metadata", string];
  const metadataKey = authority ? (["metadata", authority] as MetadataKey) : null;
  const { data: metadata, isLoading: metadataLoading, mutate: mutateMetadata } = useSWR<
    RegistryMetadata | null,
    Error,
    MetadataKey | null
  >(metadataKey, async (key: MetadataKey) => {
    const currentAuthority = key[1];
    return fetchMetadata(currentAuthority);
  });
  const swrResult = useSWR<CiStatus[], Error>(
    "ci",
    fetchCiStatuses,
    {
      refreshInterval: 60_000
    }
  );
  const { data: statuses, isLoading: statusesLoading } = swrResult;
  const statusesError = swrResult.error instanceof Error ? swrResult.error : undefined;

  const handleAuthorityChange = useCallback((nextAuthority: string) => {
    setAuthority(nextAuthority);
  }, []);

  return (
    <div style={{ width: '100%', margin: 0, padding: 0, minHeight: '100vh', backgroundColor: '#000000', position: 'relative' }}>
      <Header />
      
      <div style={{ width: '100%', paddingTop: '80px' }}>
        <Hero />
        
        {/* Devnet Network Warning */}
        {isDevnet && !isDevnetWarningDismissed && (
          <div style={{ 
            width: '100%', 
            maxWidth: '1280px', 
            margin: '32px auto 0', 
            padding: '0 16px' 
          }}>
            <div style={{
              padding: (isSmallMobile ? '12px' : isMobile ? '16px' : '20px 24px'),
              borderRadius: '12px',
              background: 'linear-gradient(to right, rgba(251, 191, 36, 0.2), rgba(251, 146, 60, 0.2))',
              border: '2px solid rgba(251, 191, 36, 0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: isSmallMobile ? '8px' : isMobile ? '12px' : '16px',
              position: 'relative',
              width: '100%'
            }}>
              <button
                onClick={() => setIsDevnetWarningDismissed(true)}
                style={{
                  position: 'absolute',
                  top: isSmallMobile ? '8px' : '12px',
                  right: isSmallMobile ? '8px' : '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '6px',
                  color: '#fde68a',
                  fontSize: isSmallMobile ? '16px' : '18px',
                  width: isSmallMobile ? '24px' : '28px',
                  height: isSmallMobile ? '24px' : '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                }}
                title="Dismiss"
              >
                ×
              </button>
              <FaExclamationTriangle style={{ 
                fontSize: isSmallMobile ? '20px' : isMobile ? '22px' : '24px', 
                color: '#fbbf24', 
                flexShrink: 0,
                marginTop: '2px'
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '16px', 
                  fontWeight: 'bold', 
                  color: '#fef3c7', 
                  marginBottom: isSmallMobile ? '6px' : '8px' 
                }}>
                  ⚠️ Switch Phantom to Devnet
                </h3>
                <p style={{ 
                  fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', 
                  color: '#fde68a', 
                  lineHeight: '1.6',
                  marginBottom: isSmallMobile ? '10px' : '12px'
                }}>
                  This app is connected to <strong>Devnet</strong>. Your Phantom wallet must also be on Devnet to initialize the registry.
                </p>
                <ol style={{ 
                  fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '13px', 
                  color: '#fde68a', 
                  lineHeight: '1.8',
                  marginLeft: isSmallMobile ? '16px' : '20px',
                  marginBottom: isSmallMobile ? '10px' : '12px'
                }}>
                  <li>Open Phantom wallet extension</li>
                  <li>If you don't see "Devnet" in the network selector:
                    <ul style={{ marginLeft: isSmallMobile ? '12px' : '20px', marginTop: '4px' }}>
                      <li>Click the <strong>gear icon</strong> (Settings)</li>
                      <li>Scroll down and enable <strong>"Developer Mode"</strong></li>
                      <li><strong>Close Settings</strong> and go back to the main wallet view</li>
                    </ul>
                  </li>
                  <li><strong>Click the network selector</strong> at the top of the wallet (it probably still shows "Mainnet")</li>
                  <li>From the dropdown, select <strong>"Devnet"</strong> (NOT "Testnet Mode" - that's a different setting)</li>
                  <li>Verify the network selector now shows <strong>"Devnet"</strong> (not "Mainnet")</li>
                </ol>
                <p style={{ 
                  fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '12px', 
                  color: '#fbbf24', 
                  fontStyle: 'italic',
                  marginTop: isSmallMobile ? '6px' : '8px',
                  wordBreak: 'break-word'
                }}>
                  💡 Alternative: Use the backend script: <code style={{ 
                    background: 'rgba(0, 0, 0, 0.3)', 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    fontSize: isSmallMobile ? '9px' : '10px',
                    wordBreak: 'break-all',
                    display: 'block',
                    marginTop: '4px'
                  }}>cd backend && npm run init-registry-web3 -- &lt;your-address&gt;</code>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <SectionDivider />

        {/* Main Content */}
        <main style={{ 
          width: '100%', 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: isSmallMobile ? '0 8px 24px' : isMobile ? '0 12px 32px' : '0 16px 48px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? '24px' : isMobile ? '32px' : '48px' 
        }}>
          {/* First Row: Wallet & Checklist */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', 
            gap: isSmallMobile ? '12px' : isMobile ? '16px' : '24px', 
            width: '100%' 
          }}>
            <div style={{ width: '100%' }}>
              <WalletSection onAuthorityChange={handleAuthorityChange} />
            </div>
            <div style={{ width: '100%' }}>
              <SubsidyChecklist metadata={metadata ?? null} statuses={statuses ?? []} />
            </div>
          </div>

          <SectionDivider />

          {/* Second Row: Metadata & CI Status */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', 
            gap: isSmallMobile ? '12px' : isMobile ? '16px' : '24px', 
            width: '100%' 
          }}>
            <div style={{ width: '100%' }}>
              <MetadataCard 
                metadata={metadata ?? null} 
                loading={metadataLoading} 
                authority={authority}
                onRegistryInitialized={() => {
                  // Refresh metadata after initialization
                  if (authority) {
                    void mutateMetadata();
                  }
                }}
              />
            </div>
            <div style={{ width: '100%' }}>
              <CiStatusBoard statuses={statuses ?? []} loading={statusesLoading} error={statusesError} />
            </div>
          </div>

          <SectionDivider />

          {/* GraphQL Explorer */}
          <section style={{ 
            position: 'relative', 
            overflow: 'hidden',
            borderRadius: isSmallMobile ? '16px' : isMobile ? '20px' : '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
            padding: isSmallMobile ? '12px' : isMobile ? '16px' : '24px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(to right, rgba(147, 51, 234, 0), rgba(59, 130, 246, 0))',
              pointerEvents: 'none',
              borderRadius: isSmallMobile ? '16px' : isMobile ? '20px' : '24px'
            }}></div>
            <header style={{ 
              marginBottom: isSmallMobile ? '16px' : isMobile ? '20px' : '24px', 
              position: 'relative', 
              zIndex: 10 
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isSmallMobile ? '12px' : isMobile ? '14px' : '16px', 
                marginBottom: isSmallMobile ? '12px' : '16px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: isSmallMobile ? '8px' : isMobile ? '12px' : '16px', 
                  flexWrap: 'wrap' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isSmallMobile ? '10px' : isMobile ? '12px' : '16px', 
                    flex: 1, 
                    minWidth: 0 
                  }}>
                    <div style={{ 
                      borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                      background: 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.3), rgba(147, 51, 234, 0.4))',
                      padding: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                      border: '1px solid rgba(196, 181, 253, 0.4)',
                      boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.2)',
                      flexShrink: 0
                    }}>
                      <FaCodeBranch style={{ 
                        fontSize: isSmallMobile ? '18px' : isMobile ? '20px' : '24px', 
                        color: '#c084fc' 
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        fontSize: isSmallMobile ? '10px' : isMobile ? '11px' : '12px', 
                        color: 'rgba(196, 181, 253, 0.8)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        fontWeight: 600, 
                        marginBottom: '4px' 
                      }}>
                        GraphQL Explorer
                      </p>
                      <p style={{ 
                        fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px', 
                        fontWeight: 'bold', 
                        color: '#ffffff',
                        wordBreak: 'break-word'
                      }}>
                        Query registry metadata & CI status
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsGraphQLExpanded(!isGraphQLExpanded)}
                    style={{ 
                      position: 'relative', 
                      zIndex: 20,
                      display: 'flex',
                      alignItems: 'center',
                      gap: isSmallMobile ? '6px' : '8px',
                      padding: isSmallMobile ? '6px 12px' : isMobile ? '7px 14px' : '8px 16px',
                      borderRadius: isSmallMobile ? '6px' : '8px',
                      background: 'rgba(147, 51, 234, 0.2)',
                      border: '1px solid rgba(147, 51, 234, 0.3)',
                      color: '#c084fc',
                      fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(196, 181, 253, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                    }}
                  >
                    {isGraphQLExpanded ? (
                      <>
                        <FaChevronUp style={{ fontSize: isSmallMobile ? '10px' : '12px' }} />
                        <span className="hidden-mobile">Hide</span>
                      </>
                    ) : (
                      <>
                        <FaChevronDown style={{ fontSize: isSmallMobile ? '10px' : '12px' }} />
                        <span className="hidden-mobile">Show</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {isGraphQLExpanded && (
                <div style={{ 
                  padding: isSmallMobile ? '12px' : isMobile ? '14px' : '16px',
                  borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  backdropFilter: 'blur(4px)'
                }}>
                  <p style={{ 
                    fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', 
                    color: 'rgba(221, 214, 254, 0.9)', 
                    lineHeight: '1.75',
                    wordBreak: 'break-word'
                  }}>
                    <strong style={{ color: '#c084fc' }}>What is this?</strong> This GraphQL explorer allows auditors and reviewers to directly query your registry metadata and CI status data. 
                    It's useful for programmatic access, testing, and integration with external tools. Click the play button (▶) to execute queries and explore the API.
                  </p>
                </div>
              )}
            </header>
            {isGraphQLExpanded && (
              <div style={{ 
                position: 'relative', 
                zIndex: 20, 
                width: '100%', 
                pointerEvents: 'auto',
                overflow: 'hidden'
              }}>
                <GraphExplorer />
              </div>
            )}
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
