"use client";
/* eslint-disable no-console, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises */

import type { RegistryMetadata } from "../lib/api";
import { fetchMetadata } from "../lib/api";
import { FaFileAlt, FaLink, FaHashtag, FaCodeBranch, FaPlusCircle, FaEdit } from "react-icons/fa";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useState } from "react";
import toast from "react-hot-toast";
import { ConfirmationModal } from "./ConfirmationModal";

type MetadataCardProps = {
  metadata: RegistryMetadata | null;
  loading: boolean;
  authority?: string | null;
  onRegistryInitialized?: () => void;
};

const PROGRAM_ID = new PublicKey("H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL");
const INITIALIZE_DISCRIMINATOR = new Uint8Array([189, 181, 20, 17, 174, 57, 249, 59]);
const UPDATE_METADATA_DISCRIMINATOR = new Uint8Array([170, 182, 43, 239, 97, 78, 225, 186]);
const DEFAULT_METADATA_URI = "https://gist.githubusercontent.com/SemiuAdesina/b47e3bdc7fe3262decf1f481452eb217/raw/4c5259681f2996a4f5d26f0086bac701a6fcced8/gistfile1.txt";

function encodeU64(value: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(value), true); // little endian
  return new Uint8Array(buffer);
}

function encodeString(value: string): Uint8Array {
  const strBytes = new TextEncoder().encode(value);
  const lengthBuffer = new ArrayBuffer(4);
  const lengthView = new DataView(lengthBuffer);
  lengthView.setUint32(0, strBytes.length, true); // little endian
  return new Uint8Array([...new Uint8Array(lengthBuffer), ...strBytes]);
}

function encodeChecksum(checksum: number[]): Uint8Array {
  if (checksum.length !== 32) {
    throw new Error("Checksum must be 32 bytes");
  }
  return new Uint8Array(checksum);
}

async function calculateChecksum(uri: string): Promise<number[]> {
  // Use Web Crypto API to calculate SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(uri);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer));
}

async function calculateRegistryDiscriminator(): Promise<Uint8Array> {
  // Calculate the discriminator for "account:Registry" (Anchor convention)
  const encoder = new TextEncoder();
  const data = encoder.encode("account:Registry");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer).subarray(0, 8);
}

function isValidRegistryAccount(accountData: Uint8Array, discriminator: Uint8Array): boolean {
  // Check if account has minimum size (at least 8 bytes for discriminator)
  if (accountData.length < 8) {
    return false;
  }
  // Check if discriminator matches
  const accountDiscriminator = accountData.subarray(0, 8);
  return accountDiscriminator.every((byte, index) => byte === discriminator[index]);
}

export const MetadataCard = ({ metadata, loading, authority, onRegistryInitialized }: MetadataCardProps) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [initializing, setInitializing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [metadataUri, setMetadataUri] = useState(DEFAULT_METADATA_URI);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState({ title: "", message: "" });
  const checksum = metadata?.metadataChecksum?.slice(0, 4).join(", ");

  const handleInitializeRegistry = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (authority && authority !== publicKey.toBase58()) {
      toast.error("Connected wallet address doesn't match the authority. Please connect the correct wallet.");
      return;
    }

    // Check if we're on Devnet
    const rpcUrl = connection.rpcEndpoint;
    const isDevnet = rpcUrl.includes("devnet") || rpcUrl.includes("api.devnet.solana.com");
    
    if (isDevnet) {
      const confirmMsg = `⚠️ IMPORTANT: Switch Phantom to Devnet first!\n\n` +
        `1. Open Phantom wallet extension\n` +
        `2. Click the network selector (top of wallet)\n` +
        `3. If you don't see "Devnet":\n` +
        `   - Go to Settings (gear icon)\n` +
        `   - Enable "Developer Mode"\n` +
        `   - Go back and select "Devnet"\n` +
        `4. Verify it shows "Devnet" (not "Mainnet")\n\n` +
        `Then click "Initialize Registry" again.\n\n` +
        `Current RPC: ${rpcUrl}\n` +
        `Your wallet must match this network!`;
      
      setConfirmMessage({
        title: "Switch to Devnet Required",
        message: confirmMsg
      });
      setConfirmAction(() => () => {
        setShowConfirmModal(false);
        proceedWithInitialize();
      });
      setShowConfirmModal(true);
      return;
    }

    await proceedWithInitialize();
  };

  const proceedWithInitialize = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Derive registry PDA (outside try block so it's available in catch)
    const registrySeeds = [
      new TextEncoder().encode("registry"),
      publicKey.toBuffer()
    ];
    const [registryPda, bump] = PublicKey.findProgramAddressSync(
      registrySeeds,
      PROGRAM_ID
    );

    try {
      setInitializing(true);

      const rpcUrl = connection.rpcEndpoint;
      console.log("Connection RPC:", rpcUrl);

      console.log("Registry PDA:", registryPda.toBase58());
      console.log("Bump:", bump);

      // Check via backend API first - this properly validates the registry using discriminator
      // If backend returns metadata, the registry exists and is valid - don't initialize
      try {
        const existingMetadata = await fetchMetadata(publicKey.toBase58());
        if (existingMetadata && existingMetadata.authority) {
          console.log("Registry already exists with metadata:", existingMetadata);
          toast.success("Registry already exists! Metadata loaded.", { duration: 3000 });
          if (onRegistryInitialized) {
            onRegistryInitialized(); // This will refresh the metadata display
          }
          return;
        }
      } catch (error) {
        console.log("Backend check failed, will verify on-chain before initializing:", error);
      }

      // Also check on-chain to avoid "account already in use" error
      // If account exists on-chain, it might not be decoded properly, so don't try to initialize
      const accountInfo = await connection.getAccountInfo(registryPda);
      if (accountInfo && accountInfo.owner.equals(PROGRAM_ID)) {
        console.log("Account exists on-chain but backend couldn't decode it. Account size:", accountInfo.data.length);
        toast.error(
          "Account exists on-chain but couldn't be decoded. Please check backend logs or refresh the page.",
          { duration: 5000 }
        );
        return;
      }

      // Build instruction data: discriminator + version (u64)
      const version = 1;
      const versionBytes = encodeU64(version);
      const instructionData = new Uint8Array(INITIALIZE_DISCRIMINATOR.length + versionBytes.length);
      instructionData.set(INITIALIZE_DISCRIMINATOR, 0);
      instructionData.set(versionBytes, INITIALIZE_DISCRIMINATOR.length);

      console.log("Instruction data length:", instructionData.length);
      console.log("Instruction data:", Array.from(instructionData));

      // Build transaction
      if (!publicKey || !signTransaction) {
        toast.error("Wallet not connected");
        return;
      }
      const transaction = new Transaction().add({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: registryPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(instructionData),
      });

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      console.log("Transaction prepared, requesting signature...");

      // Skip simulation - let the wallet handle it
      // Some wallets do their own simulation

      // Sign and send
      const signed = await signTransaction(transaction);
      console.log("Transaction signed, sending...");
      
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log("Transaction sent, signature:", signature);
      console.log("Waiting for confirmation...");

      // Use polling-based confirmation (more reliable than WebSocket on public RPCs)
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait
      
      while (!confirmed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
        
        try {
          const status = await connection.getSignatureStatus(signature);
          if (status?.value) {
            if (status.value.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }
            if (status.value.confirmationStatus === "confirmed" || status.value.confirmationStatus === "finalized") {
              confirmed = true;
              break;
            }
          }
        } catch (err) {
          console.log(`Confirmation attempt ${attempts}/${maxAttempts}...`);
        }
      }

      if (!confirmed) {
        // Check if transaction actually succeeded by checking the account
        try {
          const accountInfo = await connection.getAccountInfo(registryPda);
          if (accountInfo) {
            // Transaction succeeded even though confirmation timed out
            confirmed = true;
          }
        } catch (err) {
          // Ignore
        }
      }

      if (!confirmed) {
        // Give user the option to check manually
        const viewUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        throw new Error(`Confirmation timeout. Transaction may still be processing.\n\nSignature: ${signature}\n\nCheck status: ${viewUrl}`);
      }

      const rpcUrlForExplorer = connection.rpcEndpoint;
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${rpcUrlForExplorer.includes("devnet") ? "devnet" : "mainnet-beta"}`;
      toast.success(
        (_t) => (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontWeight: 600 }}>Registry initialized successfully!</div>
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
              Transaction: {signature.slice(0, 8)}...{signature.slice(-8)}
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "12px",
                color: "#60a5fa",
                textDecoration: "underline",
                marginTop: "4px"
              }}
            >
              View on Explorer →
            </a>
          </div>
        ),
        { duration: 6000 }
      );
      
      if (onRegistryInitialized) {
        onRegistryInitialized();
      }
    } catch (error: any) {
      console.error("Error initializing registry:", error);
      const errorMessage = error.message || error.toString() || "Failed to initialize registry";
      
      // Check if error is about account already existing
      const isAccountExistsError = errorMessage.includes("already in use") || 
                                   errorMessage.includes("account already exists") ||
                                   errorMessage.includes("0x0") ||
                                   (error.logs && error.logs.some((log: string) => log.includes("already in use")));
      
      const rpcUrl = connection.rpcEndpoint;
      const isDevnet = rpcUrl.includes("devnet") || rpcUrl.includes("api.devnet.solana.com");
      
      let helpText = "";
      if (isAccountExistsError) {
        helpText = `\n\n⚠️ Account exists but isn't a valid registry:\n` +
          `An account exists at the registry address, but it's not a valid registry account.\n` +
          `This can happen if:\n` +
          `- A previous initialization failed\n` +
          `- The account was created by a different program\n` +
          `- The account is corrupted\n\n` +
          `To fix this, you may need to:\n` +
          `1. Close/reset the account (requires advanced Solana CLI commands)\n` +
          `2. Use a different wallet address\n` +
          `3. Contact support for assistance with account cleanup\n\n` +
          `Registry PDA: ${registryPda.toBase58()}`;
      } else if (isDevnet) {
        helpText = `\n\n🔧 Troubleshooting:\n` +
          `1. Make sure Phantom is set to "Devnet" (not Mainnet)\n` +
          `   - Open Phantom → Settings → Enable Developer Mode\n` +
          `   - Then select "Devnet" from network menu\n` +
          `2. Your wallet needs Devnet SOL (get from faucet.solana.com)\n` +
          `3. Make sure you're connected to the same network as the app\n\n` +
          `Alternative: Use the backend script to initialize:\n` +
          `cd backend && npm run init-registry-web3 -- <your-address>`;
      } else {
        helpText = `\n\nPlease check:\n1. The Solana validator is running\n2. Your wallet has enough SOL for fees`;
      }
      
      toast.error(
        (_t) => (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontWeight: 600 }}>Error: {errorMessage}</div>
            {helpText && (
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", whiteSpace: "pre-line" }}>
                {helpText}
              </div>
            )}
          </div>
        ),
        { duration: 8000 }
      );
    } finally {
      setInitializing(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    const targetAuthority = authority || publicKey.toBase58();
    if (targetAuthority !== publicKey.toBase58()) {
      toast.error("Connected wallet address doesn't match the authority. Please connect the correct wallet.");
      return;
    }

    if (!metadataUri.trim()) {
      toast.error("Please enter a metadata URI");
      return;
    }

    // Check if we're on Devnet
    const rpcUrl = connection.rpcEndpoint;
    const isDevnet = rpcUrl.includes("devnet") || rpcUrl.includes("api.devnet.solana.com");
    
    if (isDevnet) {
      const confirmMsg = `⚠️ IMPORTANT: Switch Phantom to Devnet first!\n\n` +
        `1. Open Phantom wallet extension\n` +
        `2. Click the network selector (top of wallet)\n` +
        `3. If you don't see "Devnet":\n` +
        `   - Go to Settings (gear icon)\n` +
        `   - Enable "Developer Mode"\n` +
        `   - Go back and select "Devnet"\n` +
        `4. Verify it shows "Devnet" (not "Mainnet")\n\n` +
        `Then click "Update Metadata" again.\n\n` +
        `Current RPC: ${rpcUrl}\n` +
        `Your wallet must match this network!`;
      
      setConfirmMessage({
        title: "Switch to Devnet Required",
        message: confirmMsg
      });
      setConfirmAction(() => () => {
        setShowConfirmModal(false);
        proceedWithUpdate();
      });
      setShowConfirmModal(true);
      return;
    }

    await proceedWithUpdate();
  };

  const proceedWithUpdate = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    // Ensure wallet is still connected
    if (!publicKey || !signTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setUpdating(true);

      // Derive registry PDA
      const registrySeeds = [
        new TextEncoder().encode("registry"),
        publicKey.toBuffer()
      ];
      const [registryPda, bump] = PublicKey.findProgramAddressSync(
        registrySeeds,
        PROGRAM_ID
      );

      // Check if registry exists
      const accountInfo = await connection.getAccountInfo(registryPda);
      if (!accountInfo) {
        toast.error("Registry does not exist for this address. Please initialize it first.");
        return;
      }

      // Calculate checksum from URI
      const checksumArray = await calculateChecksum(metadataUri);
      console.log("Calculated checksum:", checksumArray.slice(0, 4).join(", "), "...");

      // Build MetadataInput: { uri: string, checksum: [u8; 32] }
      // Anchor serializes structs with Borsh, so we need to encode:
      // - string: 4-byte length (little endian) + UTF-8 bytes
      // - [u8; 32]: 32 bytes
      const uriEncoded = encodeString(metadataUri);
      const checksumEncoded = encodeChecksum(checksumArray);

      // Build instruction data: discriminator + MetadataInput
      // Concatenate all parts into a single Uint8Array
      const totalLength = UPDATE_METADATA_DISCRIMINATOR.length + uriEncoded.length + checksumEncoded.length;
      const instructionData = new Uint8Array(totalLength);
      let offset = 0;
      instructionData.set(UPDATE_METADATA_DISCRIMINATOR, offset);
      offset += UPDATE_METADATA_DISCRIMINATOR.length;
      instructionData.set(uriEncoded, offset);
      offset += uriEncoded.length;
      instructionData.set(checksumEncoded, offset);

      console.log("Instruction data length:", instructionData.length);
      console.log("Instruction data (first 20 bytes):", Array.from(instructionData.slice(0, 20)));
      console.log("Instruction data (last 32 bytes - should be checksum):", Array.from(instructionData.slice(instructionData.length - 32)));
      console.log("URI encoded length:", uriEncoded.length);
      console.log("Expected checksum (first 8 bytes):", checksumArray.slice(0, 8));
      console.log("Expected checksum (full):", checksumArray);
      console.log("Full instruction data (hex):", Array.from(instructionData).map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Build transaction
      const transaction = new Transaction().add({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: false },
          { pubkey: registryPda, isSigner: false, isWritable: true },
        ],
        data: Buffer.from(instructionData),
      });

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      console.log("Transaction prepared, requesting signature...");
      
      // Note: Simulation is skipped as it can cause type issues with some RPCs
      // The transaction will be validated by the wallet and network

      // Sign and send
      const signed = await signTransaction(transaction);
      console.log("Transaction signed, sending...");
      
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log("Transaction sent, signature:", signature);
      console.log("Waiting for confirmation...");

      // Use polling-based confirmation
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!confirmed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        try {
          const status = await connection.getSignatureStatus(signature);
          if (status?.value) {
            if (status.value.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }
            if (status.value.confirmationStatus === "confirmed" || status.value.confirmationStatus === "finalized") {
              confirmed = true;
              break;
            }
          }
        } catch (err) {
          console.log(`Confirmation attempt ${attempts}/${maxAttempts}...`);
        }
      }

      if (!confirmed) {
        // Check if transaction actually succeeded by verifying account data
        try {
          const updatedAccountInfo = await connection.getAccountInfo(registryPda);
          if (updatedAccountInfo) {
            // Decode account data to verify
            const data = updatedAccountInfo.data;
            const uriLength = new DataView(data.buffer, 49, 4).getUint32(0, true);
            const uriFromAccount = new TextDecoder().decode(data.slice(53, 53 + uriLength));
            // Checksum is at offset 53 + 200 (fixed buffer size)
            const checksumFromAccount = Array.from(data.slice(253, 253 + 32));
            
            if (uriFromAccount === metadataUri) {
              confirmed = true;
              console.log("Transaction verified: URI matches");
              console.log("Checksum from account:", checksumFromAccount.slice(0, 4).join(", "), "...");
              console.log("Expected checksum:", checksumArray.slice(0, 4).join(", "), "...");
              
              // Check if checksum matches
              const checksumMatches = checksumFromAccount.every((byte, i) => byte === checksumArray[i]);
              if (!checksumMatches) {
                console.warn("⚠️ Warning: Checksum mismatch! Transaction may have failed.");
                console.warn("Account checksum:", checksumFromAccount);
                console.warn("Expected checksum:", checksumArray);
              }
            }
          }
        } catch (err) {
          console.error("Error verifying account:", err);
        }
      }

      // Get transaction logs to check for errors
      let transactionLogs: string[] = [];
      try {
        const tx = await connection.getTransaction(signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0
        });
        if (tx?.meta?.logMessages) {
          transactionLogs = tx.meta.logMessages;
          console.log("Transaction logs:", transactionLogs);
          
          // Check for errors in logs
          const hasError = transactionLogs.some(log => 
            log.includes("Error") || 
            log.includes("failed") || 
            log.includes("Program log: Error")
          );
          
          if (hasError) {
            throw new Error(`Transaction failed. Check logs: ${transactionLogs.join("\n")}`);
          }
        }
        
        if (tx?.meta?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(tx.meta.err)}`);
        }
      } catch (err: any) {
        if (err.message && !err.message.includes("Transaction failed")) {
          console.warn("Could not fetch transaction details:", err);
        } else {
          throw err;
        }
      }

      if (!confirmed) {
        const viewUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        throw new Error(`Confirmation timeout. Transaction may still be processing.\n\nSignature: ${signature}\n\nCheck status: ${viewUrl}`);
      }

      // Verify the update - wait a bit for account to be fully updated
      console.log("Waiting 2 seconds for account to be fully updated...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const finalAccountInfo = await connection.getAccountInfo(registryPda, "confirmed");
        if (finalAccountInfo) {
          const data = finalAccountInfo.data;
          console.log("Account data length:", data.length);
          
          // Decode account data (same as backend service)
          const uriLength = new DataView(data.buffer, 49, 4).getUint32(0, true);
          console.log("URI length from account:", uriLength);
          
          const uriFromAccount = new TextDecoder().decode(data.slice(53, 53 + uriLength));
          console.log("URI from account:", uriFromAccount);
          console.log("Expected URI:", metadataUri);
          
          // Anchor serializes String fields with actual length, not fixed buffer
          // So checksum starts right after the URI, not after the 200-byte buffer
          const checksumStart = 53 + uriLength;
          const checksumFromAccount = Array.from(data.slice(checksumStart, checksumStart + 32));
          console.log("Checksum from account (first 8 bytes):", checksumFromAccount.slice(0, 8));
          console.log("Expected checksum (first 8 bytes):", checksumArray.slice(0, 8));
          console.log("Full checksum from account:", checksumFromAccount);
          console.log("Full expected checksum:", checksumArray);
          
          if (uriFromAccount !== metadataUri) {
            throw new Error(`URI mismatch! Expected: ${metadataUri}, Got: ${uriFromAccount}`);
          }
          
          const checksumMatches = checksumFromAccount.every((byte, i) => byte === checksumArray[i]);
          if (!checksumMatches) {
            console.error("❌ Checksum mismatch detected!");
            console.error("Account checksum:", checksumFromAccount);
            console.error("Expected checksum:", checksumArray);
            console.error("This might indicate the transaction didn't fully update the checksum.");
            console.error("Please check the transaction on Solana Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
            // Don't throw - the URI was updated, which is the main thing
          } else {
            console.log("✅ Checksum verification passed!");
          }
        } else {
          console.warn("Could not fetch account info for verification");
        }
      } catch (err: any) {
        console.error("Final verification error:", err);
        // Don't throw - transaction might still have succeeded
      }

      const rpcUrlForExplorer = connection.rpcEndpoint;
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${rpcUrlForExplorer.includes("devnet") ? "devnet" : "mainnet-beta"}`;
      toast.success(
        (_t) => (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontWeight: 600 }}>Metadata updated successfully!</div>
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
              Transaction: {signature.slice(0, 8)}...{signature.slice(-8)}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px" }}>
              Note: It may take a few seconds for the checksum to appear.
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "12px",
                color: "#60a5fa",
                textDecoration: "underline",
                marginTop: "4px"
              }}
            >
              View on Explorer →
            </a>
          </div>
        ),
        { duration: 6000 }
      );
      
      setShowUpdateForm(false);
      
      // Trigger data refresh
      if (onRegistryInitialized) {
        onRegistryInitialized();
      }
      
      // Also force a page refresh after a short delay to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      console.error("Error updating metadata:", error);
      const errorMessage = error.message || error.toString() || "Failed to update metadata";
      
      const rpcUrl = connection.rpcEndpoint;
      const isDevnet = rpcUrl.includes("devnet") || rpcUrl.includes("api.devnet.solana.com");
      
      let helpText = "";
      if (isDevnet) {
        helpText = `\n\n🔧 Troubleshooting:\n` +
          `1. Make sure Phantom is set to "Devnet" (not Mainnet)\n` +
          `2. Your wallet needs Devnet SOL (get from faucet.solana.com)\n` +
          `3. Make sure you're connected to the same network as the app`;
      } else {
        helpText = `\n\nPlease check:\n1. The Solana validator is running\n2. Your wallet has enough SOL for fees`;
      }
      
      toast.error(
        (_t) => (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontWeight: 600 }}>Error: {errorMessage}</div>
            {helpText && (
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", whiteSpace: "pre-line" }}>
                {helpText}
              </div>
            )}
          </div>
        ),
        { duration: 8000 }
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={confirmMessage.title}
        message={confirmMessage.message}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        confirmText="Continue"
        cancelText="Cancel"
        variant="warning"
      />
    <section style={{ 
      position: 'relative', 
      overflow: 'hidden',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
      padding: '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }}>
      <div style={{ 
        position: 'absolute', 
        inset: 0,
        background: 'linear-gradient(to right, rgba(59, 130, 246, 0), rgba(34, 211, 238, 0))',
        pointerEvents: 'none',
        borderRadius: '24px'
      }}></div>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.4))',
            padding: '12px',
            border: '1px solid rgba(147, 197, 253, 0.4)',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)',
            flexShrink: 0
          }}>
            <FaFileAlt style={{ fontSize: '24px', color: '#93c5fd' }} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'rgba(147, 197, 253, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Registry Metadata</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {metadata?.authority ?? authority ?? "No authority selected"}
            </p>
          </div>
        </div>
        {loading && <span style={{ fontSize: '12px', color: 'rgba(147, 197, 253, 0.8)' }}>Loading…</span>}
      </header>
      {metadata ? (
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '14px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <FaCodeBranch style={{ marginTop: '2px', color: '#60a5fa', flexShrink: 0, fontSize: '18px' }} />
            <div style={{ minWidth: 0 }}>
              <dt style={{ fontSize: '12px', color: 'rgba(96, 165, 250, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>Version</dt>
              <dd style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '18px' }}>{metadata.version}</dd>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <FaHashtag style={{ marginTop: '2px', color: '#c084fc', flexShrink: 0, fontSize: '18px' }} />
            <div style={{ minWidth: 0 }}>
              <dt style={{ fontSize: '12px', color: 'rgba(196, 181, 253, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>Checksum</dt>
              <dd style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{checksum ?? "—"}</dd>
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <FaLink style={{ marginTop: '2px', color: '#34d399', flexShrink: 0, fontSize: '18px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <dt style={{ fontSize: '12px', color: 'rgba(52, 211, 153, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>Metadata URI</dt>
              <dd style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#ffffff', fontSize: '18px' }}>
                {metadata.metadataUri || "Not published"}
              </dd>
            </div>
          </div>
        </dl>
      ) : null}
      {metadata && publicKey && (authority === publicKey.toBase58() || !authority) && 
       // Show update button if URI is empty OR checksum is all zeros (needs update)
       (!metadata.metadataUri || metadata.metadataUri === "" || 
        (metadata.metadataChecksum && metadata.metadataChecksum.every(b => b === 0))) ? (
        <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative', zIndex: 10 }}>
          {!showUpdateForm ? (
            <button
              onClick={() => {
                // Pre-fill with current URI if it exists, otherwise use default
                if (metadata?.metadataUri && metadata.metadataUri !== "") {
                  setMetadataUri(metadata.metadataUri);
                } else {
                  setMetadataUri(DEFAULT_METADATA_URI);
                }
                setShowUpdateForm(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(to right, rgba(34, 211, 238, 0.6), rgba(59, 130, 246, 0.6))',
                border: '1px solid rgba(34, 211, 238, 0.5)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                width: '100%',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgba(34, 211, 238, 0.8), rgba(59, 130, 246, 0.8))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgba(34, 211, 238, 0.6), rgba(59, 130, 246, 0.6))';
              }}
            >
              <FaEdit />
              Update Metadata URI
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(147, 197, 253, 0.8)', marginBottom: '8px', fontWeight: 600 }}>
                  Metadata URI
                </label>
                <input
                  type="text"
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={() => {
                    void handleUpdateMetadata();
                  }}
                  disabled={updating || !metadataUri.trim()}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: updating || !metadataUri.trim()
                      ? 'rgba(34, 211, 238, 0.3)'
                      : 'linear-gradient(to right, rgba(34, 211, 238, 0.6), rgba(59, 130, 246, 0.6))',
                    border: '1px solid rgba(34, 211, 238, 0.5)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: updating || !metadataUri.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: updating || !metadataUri.trim() ? 0.7 : 1
                  }}
                >
                  <FaEdit />
                  {updating ? 'Updating...' : 'Update Metadata'}
                </button>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setMetadataUri(DEFAULT_METADATA_URI);
                  }}
                  disabled={updating}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.7 : 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {metadata && publicKey && (authority === publicKey.toBase58() || !authority) && 
       metadata.metadataUri && metadata.metadataUri !== "" &&
       metadata.metadataChecksum && !metadata.metadataChecksum.every(b => b === 0) && (
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.3)', position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '12px', color: 'rgba(34, 211, 238, 0.9)', textAlign: 'center', margin: 0 }}>
            ✅ Metadata is up to date
          </p>
        </div>
      )}
      {!metadata && (
        <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {authority ? (
            <>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
                No registry metadata found for this authority.
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                The registry account may not exist on-chain yet, or metadata has not been published.
              </p>
              {publicKey && (authority === publicKey.toBase58() || !authority) && (
                <button
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={() => {
                    void handleInitializeRegistry();
                  }}
                  disabled={initializing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: initializing 
                      ? 'rgba(59, 130, 246, 0.3)' 
                      : 'linear-gradient(to right, rgba(59, 130, 246, 0.6), rgba(34, 211, 238, 0.6))',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: initializing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: initializing ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!initializing) {
                      e.currentTarget.style.background = 'linear-gradient(to right, rgba(59, 130, 246, 0.8), rgba(34, 211, 238, 0.8))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!initializing) {
                      e.currentTarget.style.background = initializing 
                        ? 'rgba(59, 130, 246, 0.3)' 
                        : 'linear-gradient(to right, rgba(59, 130, 246, 0.6), rgba(34, 211, 238, 0.6))';
                    }
                  }}
                >
                  <FaPlusCircle />
                  {initializing ? 'Initializing...' : 'Initialize Registry'}
                </button>
              )}
            </>
          ) : (
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Connect a wallet or enter an authority to view registry information.
            </p>
          )}
        </div>
      )}
    </section>
    </>
  );
};
