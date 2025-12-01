import { Connection, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";

import type { RegistryService, RegistryState } from "./types.js";

// Using the deployed program ID - update if you redeploy with the declared ID
const PROGRAM_ID = new PublicKey("H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL");
// Original declared program ID: DZejfnpxWTyfX6XziQoCHUJgvksMhVPzDRnY9Gj3FTgt

const DISCRIMINATOR = createHash("sha256")
  .update("account:Registry")
  .digest()
  .subarray(0, 8);

// Minimum account size: discriminator (8) + authority (32) + version (8) + bump (1) + uri_len (4) = 53 bytes
// Actual size varies based on URI length
const MIN_ACCOUNT_SIZE = 53;

export type RegistryServiceDeps = {
  connection: Connection;
};

export const createRegistryService = ({ connection }: RegistryServiceDeps): RegistryService => {
  const decodeAccount = (data: Buffer): RegistryState | null => {
    // Minimum size: discriminator (8) + authority (32) + version (8) + bump (1) + uri_len (4) = 53 bytes
    if (data.length < 53) {
      return null;
    }
    
    try {
      const discriminator = data.subarray(0, 8);
      if (!discriminator.equals(DISCRIMINATOR)) {
        console.error(`Discriminator mismatch. Expected: ${Array.from(DISCRIMINATOR).map(b => b.toString(16).padStart(2, '0')).join(' ')}, Got: ${Array.from(discriminator).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        return null;
      }
      
      const authorityBytes = data.subarray(8, 40);
      const authority = new PublicKey(authorityBytes).toBase58();
      const version = Number(data.readBigUInt64LE(40));
      const bump = data.readUInt8(48);
      
      // Read URI length (at offset 49, 4 bytes)
      const uriLength = data.readUInt32LE(49);
      if (uriLength > 200) {
        console.error(`URI length too long: ${uriLength} bytes (max 200)`);
        return null;
      }
      
      // Check we have enough bytes for URI + checksum (32 bytes)
      const uriStart = 53;
      const uriEnd = uriStart + uriLength;
      const checksumStart = uriEnd;
      const checksumEnd = checksumStart + 32;
      const requiredSize = checksumEnd;
      
      if (data.length < requiredSize) {
        console.error(`Account too short. Required: ${requiredSize} bytes (53 + ${uriLength} URI + 32 checksum), Got: ${data.length} bytes`);
        return null;
      }
      
      // Extract URI (can be empty string, which is valid)
      const metadataUri = uriLength > 0 ? data.toString("utf8", uriStart, uriEnd) : "";
      const metadataChecksum = Array.from(data.subarray(checksumStart, checksumEnd));
      
      return { authority, version, bump, metadataUri, metadataChecksum };
    } catch (error) {
      console.error(`Error decoding registry account:`, error);
      return null;
    }
  };

  return {
    async getRegistryByAuthority(authority: string): Promise<RegistryState | null> {
      try {
        // Validate and create PublicKey
        let authorityKey: PublicKey;
        try {
          authorityKey = new PublicKey(authority);
        } catch (error) {
          console.error(`Invalid authority address: ${authority}`, error);
          return null;
        }

        const [registryPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("registry"), authorityKey.toBuffer()],
          PROGRAM_ID
        );
        
        // Get account info with error handling
        const accountInfo = await connection.getAccountInfo(registryPda);
        if (!accountInfo?.data) {
          return null;
        }
        
        // Verify account is owned by the program
        if (!accountInfo.owner.equals(PROGRAM_ID)) {
          console.error(`Account exists but not owned by program. Owner: ${accountInfo.owner.toBase58()}`);
          return null;
        }
        
        const decoded = decodeAccount(Buffer.from(accountInfo.data));
        if (!decoded) {
          console.error(`Failed to decode registry account for ${authority}. Account size: ${accountInfo.data.length} bytes`);
          // Log the first 100 bytes to help debug
          const preview = Array.from(accountInfo.data.slice(0, 100)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          console.error(`Account data preview (first 100 bytes): ${preview}`);
        } else {
          console.log(`Successfully decoded registry for ${authority}:`, {
            authority: decoded.authority,
            version: decoded.version,
            uriLength: decoded.metadataUri?.length || 0,
            checksum: decoded.metadataChecksum?.slice(0, 4) || []
          });
        }
        return decoded;
      } catch (error) {
        console.error(`Error fetching registry for authority ${authority}:`, error);
        // Return null instead of throwing to allow graceful handling
        return null;
      }
    }
  };
};

