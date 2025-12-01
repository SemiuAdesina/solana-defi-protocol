import { Connection, PublicKey } from "@solana/web3.js";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRegistryService } from "./registry.service.js";
import { createHash } from "crypto";

const PROGRAM_ID = new PublicKey("H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL");

const DISCRIMINATOR = createHash("sha256")
  .update("account:Registry")
  .digest()
  .subarray(0, 8);

describe("RegistryService", () => {
  let mockConnection: Connection;
  let getAccountInfoMock: ReturnType<typeof vi.fn>;
  let service: ReturnType<typeof createRegistryService>;

  beforeEach(() => {
    getAccountInfoMock = vi.fn();
    mockConnection = {
      getAccountInfo: getAccountInfoMock
    } as unknown as Connection;
    service = createRegistryService({ connection: mockConnection });
  });

  describe("getRegistryByAuthority", () => {
    const authority = "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA";
    const authorityKey = new PublicKey(authority);
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry"), authorityKey.toBuffer()],
      PROGRAM_ID
    );

    it("returns null when account does not exist", async () => {
      getAccountInfoMock.mockResolvedValue(null);

      const result = await service.getRegistryByAuthority(authority);

      expect(result).toBeNull();
      expect(getAccountInfoMock).toHaveBeenCalledWith(registryPda);
    });

    it("returns null when account exists but is not owned by program", async () => {
      const otherProgramId = PublicKey.unique();
      getAccountInfoMock.mockResolvedValue({
        data: Buffer.alloc(285),
        owner: otherProgramId,
        executable: false,
        lamports: 0,
        rentEpoch: 0
      });

      const result = await service.getRegistryByAuthority(authority);

      expect(result).toBeNull();
    });

    it("returns null when account data is too short", async () => {
      const shortData = Buffer.alloc(52); // Less than minimum 53 bytes
      getAccountInfoMock.mockResolvedValue({
        data: shortData,
        owner: PROGRAM_ID,
        executable: false,
        lamports: 0,
        rentEpoch: 0
      });

      const result = await service.getRegistryByAuthority(authority);

      expect(result).toBeNull();
    });

    it("returns null when discriminator does not match", async () => {
      const data = Buffer.alloc(285);
      // Set wrong discriminator
      data.fill(0, 0, 8);
      getAccountInfoMock.mockResolvedValue({
        data,
        owner: PROGRAM_ID,
        executable: false,
        lamports: 0,
        rentEpoch: 0
      });

      const result = await service.getRegistryByAuthority(authority);

      expect(result).toBeNull();
    });

    it("successfully decodes valid registry account with empty URI", async () => {
      const data = Buffer.alloc(285);
      // Set discriminator
      DISCRIMINATOR.copy(data, 0);
      // Set authority (bytes 8-39)
      authorityKey.toBuffer().copy(data, 8);
      // Set version = 1 (bytes 40-47, little-endian u64)
      data.writeBigUInt64LE(BigInt(1), 40);
      // Set bump = 255 (byte 48)
      data.writeUInt8(255, 48);
      // Set URI length = 0 (bytes 49-52, little-endian u32)
      data.writeUInt32LE(0, 49);
      // Checksum is already zeros (bytes 53-84)

      getAccountInfoMock.mockResolvedValue({
        data,
        owner: PROGRAM_ID,
        executable: false,
        lamports: 0,
        rentEpoch: 0
      });

      const result = await service.getRegistryByAuthority(authority);

      expect(result).not.toBeNull();
      expect(result?.authority).toBe(authority);
      expect(result?.version).toBe(1);
      expect(result?.bump).toBe(255);
      expect(result?.metadataUri).toBe("");
      expect(result?.metadataChecksum).toEqual(Array(32).fill(0));
    });

    it("successfully decodes valid registry account with URI and checksum", async () => {
      const uri = "https://example.com/metadata.json";
      const uriBytes = Buffer.from(uri, "utf8");
      const checksum = Array.from(Buffer.alloc(32, 42)); // Fill with value 42

      const data = Buffer.alloc(285);
      // Set discriminator
      DISCRIMINATOR.copy(data, 0);
      // Set authority
      authorityKey.toBuffer().copy(data, 8);
      // Set version = 1
      data.writeBigUInt64LE(BigInt(1), 40);
      // Set bump = 255
      data.writeUInt8(255, 48);
      // Set URI length
      data.writeUInt32LE(uriBytes.length, 49);
      // Set URI (bytes 53 onwards)
      uriBytes.copy(data, 53);
      // Set checksum (after URI)
      Buffer.from(checksum).copy(data, 53 + uriBytes.length);

      getAccountInfoMock.mockResolvedValue({
        data,
        owner: PROGRAM_ID,
        executable: false,
        lamports: 0,
        rentEpoch: 0
      });

      const result = await service.getRegistryByAuthority(authority);

      expect(result).not.toBeNull();
      expect(result?.authority).toBe(authority);
      expect(result?.version).toBe(1);
      expect(result?.bump).toBe(255);
      expect(result?.metadataUri).toBe(uri);
      expect(result?.metadataChecksum).toEqual(checksum);
    });

    it("returns null when URI length exceeds limit", async () => {
      const data = Buffer.alloc(285);
      DISCRIMINATOR.copy(data, 0);
      authorityKey.toBuffer().copy(data, 8);
      data.writeBigUInt64LE(BigInt(1), 40);
      data.writeUInt8(255, 48);
      // Set URI length to 201 (exceeds limit of 200)
      data.writeUInt32LE(201, 49);

      getAccountInfoMock.mockResolvedValue({
        data,
        owner: PROGRAM_ID,
        executable: false,
        lamports: 0,
        rentEpoch: 0
      });

      const result = await service.getRegistryByAuthority(authority);

      expect(result).toBeNull();
    });

    it("returns null when account is too short for URI and checksum", async () => {
      const uri = "https://example.com/metadata.json";
      const uriBytes = Buffer.from(uri, "utf8");
      
      // Create data that's too short (missing checksum)
      const requiredSize = 53 + uriBytes.length + 32;
      const data = Buffer.alloc(requiredSize - 1); // One byte short
      
      DISCRIMINATOR.copy(data, 0);
      authorityKey.toBuffer().copy(data, 8);
      data.writeBigUInt64LE(BigInt(1), 40);
      data.writeUInt8(255, 48);
      data.writeUInt32LE(uriBytes.length, 49);
      uriBytes.copy(data, 53);

      getAccountInfoMock.mockResolvedValue({
        data,
        owner: PROGRAM_ID,
        executable: false,
        lamports: 0,
        rentEpoch: 0
      });

      const result = await service.getRegistryByAuthority(authority);

      expect(result).toBeNull();
    });

    it("returns null for invalid authority address", async () => {
      const result = await service.getRegistryByAuthority("invalid-address");

      expect(result).toBeNull();
      expect(getAccountInfoMock).not.toHaveBeenCalled();
    });

    it("handles RPC connection errors gracefully", async () => {
      getAccountInfoMock.mockRejectedValue(
        new Error("RPC connection failed")
      );

      const result = await service.getRegistryByAuthority(authority);

      expect(result).toBeNull();
    });
  });
});
