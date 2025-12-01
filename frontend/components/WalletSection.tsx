"use client";
/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unused-vars */

import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { FaPaste, FaCopy, FaSignOutAlt, FaExchangeAlt } from "react-icons/fa";
import { SiSolana } from "react-icons/si";
import { useMediaQuery } from "../lib/useMediaQuery";

type WalletSectionProps = {
  onAuthorityChange: (authority: string) => void;
};

export const WalletSection = ({ onAuthorityChange }: WalletSectionProps) => {
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [manualAuthority, setManualAuthority] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const lastPublicKeyRef = useRef<string | null>(null);
  const onAuthorityChangeRef = useRef(onAuthorityChange);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmallMobile = useMediaQuery("(max-width: 480px)");

  // Keep the callback ref up to date
  useEffect(() => {
    onAuthorityChangeRef.current = onAuthorityChange;
  }, [onAuthorityChange]);

  // Update authority when wallet connects/disconnects or changes
  useLayoutEffect(() => {
    if (publicKey) {
      const address = publicKey.toBase58();
      if (lastPublicKeyRef.current !== address) {
        lastPublicKeyRef.current = address;
        onAuthorityChangeRef.current(address);
        setManualAuthority("");
      }
    } else {
      if (lastPublicKeyRef.current !== null) {
        lastPublicKeyRef.current = null;
      }
    }
  }, [publicKey]);

  // Close dropdown when clicking outside and prevent default wallet adapter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    // Prevent default wallet adapter dropdown menu from showing
    const preventDefaultDropdown = (event: MouseEvent) => {
      if (publicKey && buttonRef.current?.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Find and hide any default dropdown menus
        const defaultDropdowns = document.querySelectorAll('[role="menu"]');
        defaultDropdowns.forEach((menu) => {
          if (menu instanceof HTMLElement) {
            menu.style.display = 'none';
          }
        });
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', preventDefaultDropdown, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('click', preventDefaultDropdown, true);
      };
    } else {
      document.addEventListener('click', preventDefaultDropdown, true);
      return () => {
        document.removeEventListener('click', preventDefaultDropdown, true);
      };
    }
  }, [showDropdown, publicKey]);

  const toggleDropdown = () => {
    if (publicKey) {
      setShowDropdown(!showDropdown);
    }
  };

  const authorityDisplay = publicKey?.toBase58() ?? (manualAuthority || "Connect wallet");

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowDropdown(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowDropdown(false);
  };

  const handleChangeAddress = () => {
    setVisible(true);
    setShowDropdown(false);
  };

  return (
    <section style={{ 
      position: 'relative', 
      overflow: 'visible',
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
        background: 'linear-gradient(to right, rgba(147, 51, 234, 0), rgba(59, 130, 246, 0))',
        pointerEvents: 'none',
        borderRadius: isSmallMobile ? '16px' : '24px'
      }}></div>
      <header style={{ 
        position: 'relative', 
        zIndex: 10, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isSmallMobile ? '12px' : isMobile ? '14px' : '16px' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: isSmallMobile ? 'wrap' : 'nowrap',
          gap: isSmallMobile ? '8px' : '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isSmallMobile ? '10px' : isMobile ? '12px' : '16px',
            flex: 1,
            minWidth: 0
          }}>
            <div style={{ 
              borderRadius: isSmallMobile ? '8px' : '12px',
              background: 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.3), rgba(147, 51, 234, 0.4))',
              padding: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
              border: '1px solid rgba(196, 181, 253, 0.4)',
              boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.2)',
              flexShrink: 0
            }}>
              <SiSolana style={{ 
                fontSize: isSmallMobile ? '20px' : isMobile ? '24px' : '32px', 
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
                Authority
              </p>
              <p style={{ 
                fontSize: isSmallMobile ? '14px' : isMobile ? '16px' : '18px', 
                fontWeight: 'bold', 
                color: '#ffffff', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: isMobile ? 'normal' : 'nowrap', 
                maxWidth: isMobile ? '100%' : '200px', 
                wordBreak: 'break-all' 
              }}>
                {authorityDisplay}
              </p>
            </div>
          </div>
          <div 
            ref={buttonRef}
            style={{ position: 'relative' }}
            onMouseEnter={() => publicKey && setShowDropdown(true)}
            onMouseLeave={() => {
              // Don't auto-close on mouse leave if user clicked (let click handler manage it)
              // Only close if dropdown wasn't opened by click
            }}
            onClick={(e) => {
              // Toggle dropdown on click when connected
              if (publicKey) {
                e.preventDefault();
                e.stopPropagation();
                toggleDropdown();
              }
            }}
          >
            <div onClick={(e) => {
              // Prevent default wallet adapter dropdown when connected
              if (publicKey) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}>
              <WalletMultiButton className="wallet-adapter-button-trigger" />
            </div>
            
            {/* Dropdown Menu */}
            {showDropdown && publicKey && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: isSmallMobile ? '6px' : '8px',
                  background: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: isSmallMobile ? '8px' : '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(147, 51, 234, 0.1)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  padding: isSmallMobile ? '6px' : '8px',
                  minWidth: isSmallMobile ? '160px' : isMobile ? '170px' : '180px',
                  zIndex: 10001,
                  overflow: 'visible'
                }}
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => {
                  // Close when mouse leaves dropdown area
                  setShowDropdown(false);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Triangle pointer pointing up */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '20px',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid rgba(30, 41, 59, 0.9)',
                    filter: 'drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '20px',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid rgba(255, 255, 255, 0.2)',
                  }}
                />

                {/* Menu Items */}
                <button
                  onClick={handleCopy}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: isSmallMobile ? '6px' : '8px',
                    padding: isSmallMobile ? '10px 12px' : isMobile ? '11px 14px' : '12px 16px',
                    color: '#ffffff',
                    fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                    textAlign: 'left',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <FaCopy style={{ fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', flexShrink: 0 }} />
                  <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                </button>

                <button
                  onClick={handleChangeAddress}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: isSmallMobile ? '6px' : '8px',
                    padding: isSmallMobile ? '10px 12px' : isMobile ? '11px 14px' : '12px 16px',
                    color: '#ffffff',
                    fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                    textAlign: 'left',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <FaExchangeAlt style={{ fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', flexShrink: 0 }} />
                  <span>Change Address</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: isSmallMobile ? '6px' : '8px',
                    padding: isSmallMobile ? '10px 12px' : isMobile ? '11px 14px' : '12px 16px',
                    color: '#ffffff',
                    fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <FaSignOutAlt style={{ fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', flexShrink: 0 }} />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <FaPaste style={{ 
            position: 'absolute', 
            left: isSmallMobile ? '12px' : isMobile ? '14px' : '16px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'rgba(196, 181, 253, 0.6)', 
            fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', 
            zIndex: 10 
          }} />
          <input
            type="text"
            placeholder="Or paste authority here"
            style={{ 
              width: '100%', 
              paddingLeft: isSmallMobile ? '40px' : isMobile ? '44px' : '48px', 
              paddingRight: isSmallMobile ? '12px' : '16px', 
              paddingTop: isSmallMobile ? '10px' : isMobile ? '11px' : '12px', 
              paddingBottom: isSmallMobile ? '10px' : isMobile ? '11px' : '12px', 
              fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px', 
              color: '#ffffff', 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              borderRadius: isSmallMobile ? '8px' : '12px', 
              outline: 'none' 
            }}
            value={manualAuthority}
            onChange={(event) => {
              setManualAuthority(event.target.value);
              if (event.target.value.length >= 32) {
                onAuthorityChange(event.target.value);
              }
            }}
          />
        </div>
      </header>
    </section>
  );
};
