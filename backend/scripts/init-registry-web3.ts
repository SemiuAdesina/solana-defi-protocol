// @ts-nocheck
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import * as fs from "fs";
import { createHash } from "crypto";

const PROGRAM_ID = new PublicKey("H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL");
const RPC_URL = process.env.SOLANA_RPC_URL || "http://localhost:8899";

// Instruction discriminator for initialize_registry: [189, 181, 20, 17, 174, 57, 249, 59]
const INITIALIZE_DISCRIMINATOR = Buffer.from([189, 181, 20, 17, 174, 57, 249, 59]);

function encodeU64(value: number): Buffer {
  const buffer = Buffer.allocUnsafe(8);
  buffer.writeBigUInt64LE(BigInt(value), 0);
  return buffer;
}

async function initializeRegistry(authorityAddress?: string, keypairPath?: string) {
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

  // Use provided authority or default to wallet
  const authority = authorityAddress 
    ? new PublicKey(authorityAddress)
    : walletKeypair.publicKey;

  console.log(`\nInitializing registry for authority: ${authority.toBase58()}`);
  console.log(`Using wallet: ${walletKeypair.publicKey.toBase58()}`);

  if (!authority.equals(walletKeypair.publicKey)) {
    console.error("\n❌ Error: Authority must match your wallet address.");
    console.error(`   Authority: ${authority.toBase58()}`);
    console.error(`   Wallet:    ${walletKeypair.publicKey.toBase58()}`);
    console.error("\nTo initialize for a different authority:");
    console.error("1. Provide the keypair path: npx tsx scripts/init-registry-web3.ts <authority> <keypair-path>");
    console.error("2. Or set that authority's keypair as default: solana config set --keypair /path/to/keypair.json");
    process.exit(1);
  }

  // Derive registry PDA
  const [registryPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), authority.toBuffer()],
    PROGRAM_ID
  );

  console.log(`Registry PDA: ${registryPda.toBase58()}`);
  console.log(`Bump: ${bump}`);

  // Check if already exists
  const accountInfo = await connection.getAccountInfo(registryPda);
  if (accountInfo) {
    console.log("\n✅ Registry already exists!");
    // Try to decode basic info
    if (accountInfo.data.length >= 8) {
      const discriminator = accountInfo.data.subarray(0, 8);
      const authorityBytes = accountInfo.data.subarray(8, 40);
      const authorityFromAccount = new PublicKey(authorityBytes).toBase58();
      const version = accountInfo.data.readBigUInt64LE(40);
      console.log(`   Authority: ${authorityFromAccount}`);
      console.log(`   Version: ${version}`);
    }
    return;
  }

  // Build instruction data: discriminator + version (u64)
  const version = 1;
  const instructionData = Buffer.concat([
    INITIALIZE_DISCRIMINATOR,
    encodeU64(version)
  ]);

  // Calculate account space (from Registry::LEN)
  const ACCOUNT_SIZE = 8 + 32 + 8 + 1 + 4 + 200 + 32; // 285 bytes

  // Build transaction
  const transaction = new Transaction().add({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: registryPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = authority;

  try {
    console.log("\nSending transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [walletKeypair],
      { commitment: "confirmed" }
    );

    console.log(`\n✅ Transaction signature: ${signature}`);
    console.log("✅ Registry initialized successfully!");

    // Verify
    const newAccountInfo = await connection.getAccountInfo(registryPda);
    if (newAccountInfo) {
      console.log("\nRegistry account created!");
      console.log(`   Account size: ${newAccountInfo.data.length} bytes`);
      console.log(`   Owner: ${newAccountInfo.owner.toBase58()}`);
    }
  } catch (error: any) {
    console.error("\n❌ Error initializing registry:", error.message);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    process.exit(1);
  }
}

// Get authority and keypair path from command line arguments
const authorityArg = process.argv[2];
const keypairPathArg = process.argv[3];

initializeRegistry(authorityArg, keypairPathArg).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

