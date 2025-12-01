// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";

type AuditRegistry = {
  address: string;
};

const deriveRegistryPda = (
  authority: PublicKey,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), authority.toBuffer()],
    programId
  );
};

// Use the deployed program ID (update Anchor.toml if you redeploy with declared ID)
const DEPLOYED_PROGRAM_ID = new PublicKey(
  "H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL"
);

describe("initialize registry for authority", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load IDL and create program with deployed program ID
  const idlPath = path.resolve(__dirname, "../target/idl/audit_registry.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new anchor.Program(
    idl,
    DEPLOYED_PROGRAM_ID,
    provider
  ) as Program<AuditRegistry>;

  const defaultAuthority = provider.wallet.publicKey;

  // Get authority from environment variable or use default wallet
  const authorityAddress = process.env.AUTHORITY_ADDRESS
    ? new PublicKey(process.env.AUTHORITY_ADDRESS)
    : defaultAuthority;

  it("initializes registry state for specified authority", async () => {
    console.log(
      `\nInitializing registry for authority: ${authorityAddress.toBase58()}`
    );

    const [registryPda] = deriveRegistryPda(
      authorityAddress,
      DEPLOYED_PROGRAM_ID
    );

    console.log(`Registry PDA: ${registryPda.toBase58()}`);

    // Check if already exists
    try {
      const existing = await program.account.registry.fetch(registryPda);
      console.log("Registry already exists!");
      console.log("Authority:", existing.authority.toBase58());
      console.log("Version:", existing.version.toString());
      console.log("Metadata URI:", existing.metadataUri || "(empty)");
      expect(existing.authority.toBase58()).to.equal(
        authorityAddress.toBase58()
      );
      return;
    } catch (e) {
      // Doesn't exist, proceed
    }

    // Check if authority matches wallet
    if (!authorityAddress.equals(defaultAuthority)) {
      console.warn(
        `\nWarning: Authority ${authorityAddress.toBase58()} differs from wallet ${defaultAuthority.toBase58()}`
      );
      console.warn(
        "You need the private key for the authority to initialize its registry."
      );
      throw new Error("Authority must match the wallet");
    }

    const targetVersion = new BN(1);

    // Initialize
    const tx = await program.methods
      .initializeRegistry(targetVersion)
      .accounts({
        authority: authorityAddress,
        registry: registryPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`Transaction signature: ${tx}`);

    // Verify
    const registry = await program.account.registry.fetch(registryPda);
    console.log("\nRegistry initialized successfully!");
    console.log("Authority:", registry.authority.toBase58());
    console.log("Version:", registry.version.toString());
    console.log("Bump:", registry.bump);
    console.log("Metadata URI:", registry.metadataUri || "(empty)");

    expect(registry.authority.toBase58()).to.equal(
      authorityAddress.toBase58()
    );
    expect(registry.version.toNumber()).to.equal(1);
  });
});

