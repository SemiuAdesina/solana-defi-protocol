"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import "graphiql/graphiql.css";
import type { GraphiQLProps } from "graphiql";
import { useMediaQuery } from "../lib/useMediaQuery";
import { FaPlay } from "react-icons/fa";

const GraphiQL = dynamic<GraphiQLProps>(() => import("graphiql"), { ssr: false });

const defaultQuery = `query GetCiStatuses {
  ciStatuses(limit: 5) {
    pipeline
    status
    commit
    runId
    triggeredBy
    timestamp
  }
}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcher = async (params: any): Promise<unknown> => {
  try {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("GraphQL fetch error:", error);
    throw error;
  }
};

const GraphExplorer = () => {
  const [query, setQuery] = useState(defaultQuery);
  const [mobileQuery, setMobileQuery] = useState(defaultQuery);
  const [mobileResult, setMobileResult] = useState<string | null>(null);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [showMobileInput, setShowMobileInput] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmallMobile = useMediaQuery("(max-width: 480px)");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleQueryEdit = (nextQuery?: string) => {
    setQuery(nextQuery ?? "");
  };
  
  const handleMobileExecute = async () => {
    if (!mobileQuery.trim()) {
      setMobileError("Please enter a GraphQL query");
      return;
    }
    
    setMobileLoading(true);
    setMobileError(null);
    setMobileResult(null);
    
    try {
      const response = await fetcher({
        query: mobileQuery,
        variables: {},
        operationName: null
      });
      
      setMobileResult(JSON.stringify(response, null, 2));
      setShowMobileInput(false);
      setMobileError(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMobileError(errorMessage || "Failed to execute query");
      setMobileResult(null);
      setShowMobileInput(false);
    } finally {
      setMobileLoading(false);
    }
  };
  
  const handleNewQuery = () => {
    setShowMobileInput(true);
    setMobileResult(null);
    setMobileError(null);
  };
  
  // Wait for GraphiQL to load and ensure execute button is accessible
  useEffect(() => {
    if (!isMobile) return;
    
    const checkAndEnsureButton = () => {
      const executeButton = containerRef.current?.querySelector('.graphiql-execute-button') as HTMLButtonElement;
      if (executeButton) {
        // Ensure button is visible and accessible
        executeButton.style.display = 'flex';
        executeButton.style.visibility = 'visible';
        executeButton.style.opacity = '1';
        executeButton.style.pointerEvents = 'auto';
        executeButton.setAttribute('tabindex', '0');
      }
    };
    
    // Check immediately
    checkAndEnsureButton();
    
    // Check after a short delay to ensure GraphiQL has rendered
    const timeout1 = setTimeout(checkAndEnsureButton, 500);
    const timeout2 = setTimeout(checkAndEnsureButton, 1000);
    const timeout3 = setTimeout(checkAndEnsureButton, 2000);
    
    // Also use MutationObserver to watch for DOM changes
    const observer = new MutationObserver(checkAndEnsureButton);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      observer.disconnect();
    };
  }, [isMobile, query]);
  
  const handleExecute = async () => {
    // Try multiple methods to execute the query
    // Method 1: Find and click the execute button
    let executeButton = containerRef.current?.querySelector('.graphiql-execute-button') as HTMLButtonElement;
    
    // If not found, wait a bit and try again
    if (!executeButton) {
      await new Promise(resolve => setTimeout(resolve, 100));
      executeButton = containerRef.current?.querySelector('.graphiql-execute-button') as HTMLButtonElement;
    }
    
    if (executeButton) {
      executeButton.focus();
      executeButton.click();
      // Also trigger mouse events to ensure it works
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      executeButton.dispatchEvent(clickEvent);
      
      // Also try touch event for mobile
      // TouchEvent cannot be constructed directly, but we try for mobile compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
      try {
        const TouchEventConstructor = (window as any).TouchEvent;
        if (TouchEventConstructor) {
          const touchEvent = new TouchEventConstructor('touchend', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          executeButton.dispatchEvent(touchEvent);
        }
      } catch {
        // TouchEvent not supported, ignore
      }
      return;
    }
    
    // Method 2: Try to find the button by aria-label or title
    const buttons = containerRef.current?.querySelectorAll('button');
    if (buttons) {
      for (const btn of Array.from(buttons)) {
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase();
        const title = btn.getAttribute('title')?.toLowerCase();
        const className = btn.className?.toLowerCase();
        if (ariaLabel?.includes('execute') || ariaLabel?.includes('run') || 
            title?.includes('execute') || title?.includes('run') ||
            className?.includes('execute')) {
          btn.focus();
          btn.click();
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return;
        }
      }
    }
    
    // Method 3: Try keyboard shortcut (Ctrl+Enter or Cmd+Enter)
    const queryEditor = containerRef.current?.querySelector('.graphiql-query-editor, .cm-editor, [role="textbox"]');
    if (queryEditor) {
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      queryEditor.dispatchEvent(keyboardEvent);
    }
  };
  
  const height = isSmallMobile ? '400px' : isMobile ? '500px' : '650px';
  
  // Mobile-optimized interface
  if (isMobile && showMobileInput) {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: isSmallMobile ? '12px' : '16px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isSmallMobile ? '8px' : '12px'
        }}>
          <label style={{
            fontSize: isSmallMobile ? '12px' : '14px',
            color: 'rgba(196, 181, 253, 0.9)',
            fontWeight: 600
          }}>
            GraphQL Query
          </label>
          <textarea
            value={mobileQuery}
            onChange={(e) => setMobileQuery(e.target.value)}
            placeholder="Enter your GraphQL query here..."
            style={{
              width: '100%',
              minHeight: isSmallMobile ? '200px' : '250px',
              padding: isSmallMobile ? '12px' : '16px',
              fontSize: isSmallMobile ? '13px' : '14px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: isSmallMobile ? '8px' : '12px',
              outline: 'none',
              resize: 'vertical',
              lineHeight: '1.6'
            }}
          />
        </div>
        
        {mobileError && (
          <div style={{
            padding: isSmallMobile ? '10px' : '12px',
            borderRadius: isSmallMobile ? '8px' : '10px',
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            color: '#fca5a5',
            fontSize: isSmallMobile ? '12px' : '13px'
          }}>
            <strong>Error:</strong> {mobileError}
          </div>
        )}
        
        <button
          onClick={() => {
            void handleMobileExecute();
          }}
          disabled={mobileLoading || !mobileQuery.trim()}
          style={{
            width: '100%',
            padding: isSmallMobile ? '14px' : '16px',
            fontSize: isSmallMobile ? '14px' : '16px',
            fontWeight: 'bold',
            color: '#ffffff',
            background: mobileLoading || !mobileQuery.trim()
              ? 'rgba(147, 51, 234, 0.3)'
              : 'linear-gradient(135deg, rgba(147, 51, 234, 0.95), rgba(59, 130, 246, 0.95))',
            border: '2px solid rgba(196, 181, 253, 0.6)',
            borderRadius: isSmallMobile ? '10px' : '12px',
            cursor: mobileLoading || !mobileQuery.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: mobileLoading || !mobileQuery.trim()
              ? 'none'
              : '0 4px 16px rgba(147, 51, 234, 0.4)',
            transition: 'all 0.3s ease',
            opacity: mobileLoading || !mobileQuery.trim() ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!mobileLoading && mobileQuery.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(147, 51, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!mobileLoading && mobileQuery.trim()) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(147, 51, 234, 0.4)';
            }
          }}
        >
          {mobileLoading ? (
            <>
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
              Running...
            </>
          ) : (
            <>
              <FaPlay style={{ fontSize: isSmallMobile ? '14px' : '16px' }} />
              Run Query
            </>
          )}
        </button>
      </div>
    );
  }
  
  // Mobile result view
  if (isMobile && !showMobileInput) {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: isSmallMobile ? '12px' : '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isSmallMobile ? '8px' : '12px'
        }}>
          <h3 style={{
            fontSize: isSmallMobile ? '16px' : '18px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: 0
          }}>
            Query Result
          </h3>
          <button
            onClick={handleNewQuery}
            style={{
              padding: isSmallMobile ? '8px 12px' : '10px 16px',
              fontSize: isSmallMobile ? '12px' : '14px',
              fontWeight: 600,
              color: '#c084fc',
              background: 'rgba(147, 51, 234, 0.2)',
              border: '1px solid rgba(147, 51, 234, 0.4)',
              borderRadius: isSmallMobile ? '8px' : '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(196, 181, 253, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
            }}
          >
            New Query
          </button>
        </div>
        
        {mobileError && (
          <div style={{
            padding: isSmallMobile ? '12px' : '16px',
            borderRadius: isSmallMobile ? '8px' : '12px',
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            color: '#fca5a5',
            fontSize: isSmallMobile ? '12px' : '13px',
            lineHeight: '1.6'
          }}>
            <strong>Error:</strong> {mobileError}
          </div>
        )}
        
        {mobileResult && (
          <div style={{
            position: 'relative',
            width: '100%',
            maxHeight: isSmallMobile ? '400px' : '500px',
            overflow: 'auto',
            padding: isSmallMobile ? '12px' : '16px',
            borderRadius: isSmallMobile ? '8px' : '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <pre style={{
              margin: 0,
              padding: 0,
              fontSize: isSmallMobile ? '11px' : '12px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: '1.6'
            }}>
              {mobileResult}
            </pre>
          </div>
        )}
      </div>
    );
  }
  
  // Desktop: Show full GraphiQL interface
  return (
    <>
      <style jsx global>{`
        @media (max-width: 768px) {
          .graphiql-container {
            display: none !important;
          }
        }
        .graphiql-container {
          position: relative !important;
          z-index: 1 !important;
        }
        .graphiql-container * {
          pointer-events: auto !important;
        }
        .graphiql-container .graphiql-toolbar {
          pointer-events: auto !important;
          z-index: 10 !important;
        }
        .graphiql-container .graphiql-execute-button {
          pointer-events: auto !important;
          cursor: pointer !important;
          z-index: 10 !important;
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .graphiql-container .CodeMirror {
          font-size: 16px !important;
          line-height: 1.8 !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
        }
        .graphiql-container .CodeMirror-lines {
          padding: 20px !important;
        }
        .graphiql-container .CodeMirror-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .graphiql-container .CodeMirror-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .graphiql-container .cm-editor {
          font-size: 16px !important;
          line-height: 1.8 !important;
        }
        .graphiql-container .cm-line {
          padding: 4px 0 !important;
          min-height: 1.8em !important;
        }
        .graphiql-container .cm-content {
          padding: 20px !important;
        }
        .graphiql-container * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .graphiql-container *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .graphiql-container .graphiql-query-editor {
          font-size: 16px !important;
        }
        @media (max-width: 480px) {
          .graphiql-container .CodeMirror,
          .graphiql-container .cm-editor,
          .graphiql-container .graphiql-query-editor,
          .graphiql-container .graphiql-response {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }
          .graphiql-container .CodeMirror-lines,
          .graphiql-container .cm-content {
            padding: 12px !important;
          }
          .graphiql-container .cm-line {
            padding: 2px 0 !important;
            min-height: 1.5em !important;
          }
          .graphiql-container .graphiql-toolbar {
            padding: 8px !important;
          }
          .graphiql-container .graphiql-execute-button {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
          .graphiql-container .graphiql-toolbar button {
            font-size: 11px !important;
            padding: 4px 8px !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div 
        ref={containerRef}
        className="graphiql-container" 
        style={{ 
          position: 'relative', 
          zIndex: 1,
          height: height,
          borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {/* @ts-expect-error - GraphiQL fetcher type mismatch, but function works correctly */}
        <GraphiQL fetcher={fetcher} query={query} onEditQuery={handleQueryEdit} />
        
        {/* Floating Execute Button for Mobile - Always visible and prominent */}
        {isMobile && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleExecute();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleExecute();
            }}
            style={{
              position: 'fixed',
              bottom: isSmallMobile ? '20px' : '24px',
              right: isSmallMobile ? '20px' : '24px',
              width: isSmallMobile ? '64px' : '72px',
              height: isSmallMobile ? '64px' : '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.95), rgba(59, 130, 246, 0.95))',
              border: '3px solid rgba(196, 181, 253, 0.7)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000,
              boxShadow: '0 8px 32px rgba(147, 51, 234, 0.5), 0 0 0 4px rgba(147, 51, 234, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontSize: isSmallMobile ? '24px' : '28px',
              fontWeight: 'bold',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(147, 51, 234, 0.6), 0 0 0 6px rgba(147, 51, 234, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(147, 51, 234, 0.5), 0 0 0 4px rgba(147, 51, 234, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.3)';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 36px rgba(147, 51, 234, 0.55), 0 0 0 5px rgba(147, 51, 234, 0.18)';
            }}
            title="Execute Query (Tap to run)"
            aria-label="Execute GraphQL Query"
          >
            <FaPlay style={{ marginLeft: '3px', fontSize: isSmallMobile ? '20px' : '24px' }} />
            <span style={{ 
              fontSize: isSmallMobile ? '8px' : '9px', 
              marginTop: '2px',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              RUN
            </span>
          </button>
        )}
      </div>
    </>
  );
};

export default GraphExplorer;

