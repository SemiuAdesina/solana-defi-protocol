// @ts-nocheck
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import * as fs from "fs";
import { createHash } from "crypto";

const PROGRAM_ID = new PublicKey("H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL");
const RPC_URL = process.env.SOLANA_RPC_URL || "http://localhost:8899";

// Instruction discriminator for update_metadata: [170, 182, 43, 239, 97, 78, 225, 186]
const UPDATE_METADATA_DISCRIMINATOR = Buffer.from([170, 182, 43, 239, 97, 78, 225, 186]);

function encodeString(value: string): Buffer {
  const strBytes = Buffer.from(value, "utf-8");
  const lengthBuffer = Buffer.allocUnsafe(4);
  lengthBuffer.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lengthBuffer, strBytes]);
}

function encodeChecksum(checksum: number[]): Buffer {
  if (checksum.length !== 32) {
    throw new Error("Checksum must be 32 bytes");
  }
  return Buffer.from(checksum);
}

async function updateMetadata(metadataUri: string, checksum?: number[], keypairPath?: string) {
  const connection = new Connection(RPC_URL, "confirmed");
  
  // Load wallet keypair - use provided path or default to Solana CLI wallet
  let walletKeypair: Keypair;
  if (keypairPath) {
    console.log(`\nLoading keypair from: ${keypairPath}`);
    walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
    );
  } else {
    const walletPath = process.env.HOME + "/.config/solana/id.json";
    walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
    );
  }

  const authority = walletKeypair.publicKey;
  console.log(`\nUpdating metadata for authority: ${authority.toBase58()}`);

  // Derive registry PDA
  const [registryPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), authority.toBuffer()],
    PROGRAM_ID
  );

  console.log(`Registry PDA: ${registryPda.toBase58()}`);
  console.log(`Bump: ${bump}`);

  // Check if registry exists
  const accountInfo = await connection.getAccountInfo(registryPda);
  if (!accountInfo) {
    console.error("\n❌ Error: Registry does not exist for this authority.");
    console.error("   Please initialize the registry first using init-registry-web3.ts");
    process.exit(1);
  }

  // Generate checksum from URI if not provided
  let finalChecksum: number[];
  if (checksum) {
    finalChecksum = checksum;
  } else {
    const hash = createHash("sha256").update(metadataUri).digest();
    finalChecksum = Array.from(hash);
    console.log(`\nGenerated checksum from URI: ${finalChecksum.slice(0, 4).join(", ")}...`);
  }

  // Build instruction data: discriminator + uri (String) + checksum ([u8; 32])
  const instructionData = Buffer.concat([
    UPDATE_METADATA_DISCRIMINATOR,
    encodeString(metadataUri),
    encodeChecksum(finalChecksum)
  ]);

  // Build transaction
  const transaction = new Transaction().add({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: registryPda, isSigner: false, isWritable: true },
    ],
    data: instructionData,
  });

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = authority;

  try {
    console.log(`\nSending transaction with metadata URI: ${metadataUri}`);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [walletKeypair],
      { commitment: "confirmed" }
    );

    console.log(`\n✅ Transaction signature: ${signature}`);
    console.log("✅ Metadata updated successfully!");

    // Verify
    const updatedAccountInfo = await connection.getAccountInfo(registryPda);
    if (updatedAccountInfo) {
      // Decode to show updated values
      const data = updatedAccountInfo.data;
      const uriLength = data.readUInt32LE(49);
      const metadataUriFromAccount = data.toString("utf8", 53, 53 + uriLength);
      // Anchor serializes String fields with actual length, not fixed buffer
      // So checksum starts right after the URI, not after the 200-byte buffer
      const checksumStart = 53 + uriLength;
      const checksumFromAccount = Array.from(data.subarray(checksumStart, checksumStart + 32));
      
      console.log("\nUpdated registry account:");
      console.log(`   Metadata URI: ${metadataUriFromAccount}`);
      console.log(`   Checksum: ${checksumFromAccount.slice(0, 4).join(", ")}...`);
    }
  } catch (error: any) {
    console.error("\n❌ Error updating metadata:", error.message);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    process.exit(1);
  }
}

// Get metadata URI from command line argument
const metadataUriArg = process.argv[2];
if (!metadataUriArg) {
  console.error("Usage: npx tsx update-metadata.ts <metadata-uri> [checksum-hex] [keypair-path]");
  console.error("Example: npx tsx update-metadata.ts https://example.com/metadata.json");
  console.error("Example: npx tsx update-metadata.ts https://example.com/metadata.json 010203...");
  console.error("Example: npx tsx update-metadata.ts https://example.com/metadata.json '' /path/to/keypair.json");
  process.exit(1);
}

// Parse optional checksum (32 bytes as hex string)
let checksum: number[] | undefined;
if (process.argv[3] && process.argv[3].length === 64) {
  const checksumHex = process.argv[3];
  checksum = Array.from(Buffer.from(checksumHex, "hex"));
}

// Parse optional keypair path
const keypairPath = process.argv[3] && process.argv[3].length !== 64 ? process.argv[3] : process.argv[4];

updateMetadata(metadataUriArg, checksum, keypairPath).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

