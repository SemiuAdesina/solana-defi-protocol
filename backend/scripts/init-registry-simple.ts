import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL");
const RPC_URL = process.env.SOLANA_RPC_URL || "http://localhost:8899";

async function initializeRegistry(authorityAddress?: string) {
  const connection = new Connection(RPC_URL, "confirmed");
  
  // Load wallet keypair
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

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
    console.error("1. Set that authority's keypair as default: solana config set --keypair /path/to/keypair.json");
    console.error("2. Run this script again");
    process.exit(1);
  }

  // Load IDL
  const idlPath = path.resolve(__dirname, "../../blockchain/target/idl/audit_registry.json");
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL file not found at ${idlPath}. Please build the program first: cd blockchain && anchor build`);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // Create provider and program
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);

  // Derive registry PDA
  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), authority.toBuffer()],
    PROGRAM_ID
  );

  console.log(`Registry PDA: ${registryPda.toBase58()}`);

  // Check if already exists
  try {
    const existing = await (program.account as any).registry.fetch(registryPda);
    console.log("\n✅ Registry already exists!");
    console.log(`   Authority: ${existing.authority.toBase58()}`);
    console.log(`   Version: ${existing.version.toString()}`);
    console.log(`   Metadata URI: ${existing.metadataUri || "(empty)"}`);
    return;
  } catch (e) {
    // Doesn't exist, proceed
  }

  // Initialize
  try {
    console.log("\nInitializing registry...");
    const tx = await (program.methods as any)
      .initializeRegistry(new anchor.BN(1))
      .accounts({
        authority: authority,
        registry: registryPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`\n✅ Transaction signature: ${tx}`);
    console.log("✅ Registry initialized successfully!");

    // Verify
    const registry = await (program.account as any).registry.fetch(registryPda);
    console.log("\nRegistry details:");
    console.log(`   Authority: ${registry.authority.toBase58()}`);
    console.log(`   Version: ${registry.version.toString()}`);
    console.log(`   Bump: ${registry.bump}`);
    console.log(`   Metadata URI: ${registry.metadataUri || "(empty)"}`);
  } catch (error: any) {
    console.error("\n❌ Error initializing registry:", error.message);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    process.exit(1);
  }
}

// Get authority from command line argument
const authorityArg = process.argv[2];
initializeRegistry(authorityArg).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

