#!/usr/bin/env tsx

import { Connection, PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import { createHash } from "crypto";

dotenv.config();

const PROGRAM_ID = new PublicKey("H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL");
const DISCRIMINATOR = createHash("sha256")
  .update("account:Registry")
  .digest()
  .subarray(0, 8);

async function debugAccount(authority: string) {
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  
  const authorityKey = new PublicKey(authority);
  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), authorityKey.toBuffer()],
    PROGRAM_ID
  );
  
  console.log("Authority:", authority);
  console.log("Registry PDA:", registryPda.toBase58());
  console.log("RPC:", rpcUrl);
  
  const accountInfo = await connection.getAccountInfo(registryPda);
  if (!accountInfo) {
    console.error("Account not found!");
    return;
  }
  
  console.log("\nAccount Info:");
  console.log("- Owner:", accountInfo.owner.toBase58());
  console.log("- Is owned by program?", accountInfo.owner.equals(PROGRAM_ID));
  console.log("- Account size:", accountInfo.data.length, "bytes");
  console.log("- Is executable:", accountInfo.executable);
  console.log("- Rent epoch:", accountInfo.rentEpoch);
  
  if (!accountInfo.owner.equals(PROGRAM_ID)) {
    console.error("\n❌ Account is not owned by the program!");
    return;
  }
  
  const data = Buffer.from(accountInfo.data);
  
  console.log("\n=== Raw Data ===");
  console.log("First 100 bytes (hex):");
  console.log(Array.from(data.slice(0, 100)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  console.log("\n=== Decoding Attempt ===");
  
  // Check discriminator
  const discriminator = data.subarray(0, 8);
  console.log("Discriminator (got):", Array.from(discriminator).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log("Discriminator (expected):", Array.from(DISCRIMINATOR).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log("Matches?", discriminator.equals(DISCRIMINATOR));
  
  if (!discriminator.equals(DISCRIMINATOR)) {
    console.error("\n❌ Discriminator mismatch!");
    return;
  }
  
  // Decode fields
  const authorityBytes = data.subarray(8, 40);
  const decodedAuthority = new PublicKey(authorityBytes).toBase58();
  console.log("\nAuthority (decoded):", decodedAuthority);
  console.log("Matches input?", decodedAuthority === authority);
  
  const version = data.readBigUInt64LE(40);
  console.log("Version:", version.toString());
  
  const bump = data.readUInt8(48);
  console.log("Bump:", bump);
  
  const uriLength = data.readUInt32LE(49);
  console.log("\nURI Length:", uriLength, "bytes");
  
  if (uriLength > 200) {
    console.error("❌ URI length exceeds limit!");
    return;
  }
  
  const uriStart = 53;
  const uriEnd = uriStart + uriLength;
  const checksumStart = uriEnd;
  const checksumEnd = checksumStart + 32;
  
  console.log("\nOffsets:");
  console.log("- URI start:", uriStart);
  console.log("- URI end:", uriEnd);
  console.log("- Checksum start:", checksumStart);
  console.log("- Checksum end:", checksumEnd);
  console.log("- Required size:", checksumEnd);
  console.log("- Actual size:", data.length);
  
  if (data.length < checksumEnd) {
    console.error(`\n❌ Account too short! Need ${checksumEnd} bytes, got ${data.length}`);
    console.log("\nAccount bytes from URI start to end:");
    console.log(Array.from(data.slice(uriStart)).map(b => b.toString(16).padStart(2, '0')).join(' '));
    return;
  }
  
  const metadataUri = uriLength > 0 ? data.toString("utf8", uriStart, uriEnd) : "";
  console.log("\nMetadata URI:", metadataUri || "(empty)");
  
  const metadataChecksum = Array.from(data.subarray(checksumStart, checksumEnd));
  console.log("Checksum (first 8 bytes):", metadataChecksum.slice(0, 8).join(', '));
  console.log("Checksum (all zeros?):", metadataChecksum.every(b => b === 0));
  
  console.log("\n✅ Successfully decoded!");
  console.log("\nDecoded Registry:");
  console.log(JSON.stringify({
    authority: decodedAuthority,
    version: version.toString(),
    bump,
    metadataUri: metadataUri || null,
    metadataChecksum: metadataChecksum
  }, null, 2));
}

const authority = process.argv[2];
if (!authority) {
  console.error("Usage: tsx debug-account.ts <authority-address>");
  process.exit(1);
}

debugAccount(authority).catch(console.error);

