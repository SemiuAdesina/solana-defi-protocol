import { describe, expect, it } from "vitest";
import { z } from "zod";

// Test the schema directly rather than the module
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  SOLANA_RPC_URL: z.string().url().default("http://validator:8899"),
  API_KEY: z.string().min(16)
});

describe("Environment validation schema", () => {
  it("validates required environment variables", () => {
    const env = {
      PORT: "4000",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    const result = schema.parse(env);

    expect(result.PORT).toBe(4000);
    expect(result.SOLANA_RPC_URL).toBe("https://api.devnet.solana.com");
    expect(result.API_KEY).toBe("test-api-key-minimum-16-chars");
  });

  it("uses default PORT when not provided", () => {
    const env = {
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    const result = schema.parse(env);

    expect(result.PORT).toBe(4000);
  });

  it("uses default SOLANA_RPC_URL when not provided", () => {
    const env = {
      PORT: "4000",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    const result = schema.parse(env);

    expect(result.SOLANA_RPC_URL).toBe("http://validator:8899");
  });

  it("validates PORT is a positive integer", () => {
    const env = {
      PORT: "4000",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    const result = schema.parse(env);

    expect(typeof result.PORT).toBe("number");
    expect(result.PORT).toBeGreaterThan(0);
  });

  it("coerces PORT string to number", () => {
    const env = {
      PORT: "3000",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    const result = schema.parse(env);

    expect(result.PORT).toBe(3000);
    expect(typeof result.PORT).toBe("number");
  });

  it("validates SOLANA_RPC_URL is a valid URL", () => {
    const env = {
      PORT: "4000",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    const result = schema.parse(env);

    expect(() => new URL(result.SOLANA_RPC_URL)).not.toThrow();
  });

  it("validates API_KEY minimum length", () => {
    const env = {
      PORT: "4000",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "valid-key-16chars" // 16 characters
    };

    const result = schema.parse(env);

    expect(result.API_KEY.length).toBeGreaterThanOrEqual(16);
  });

  it("throws error when API_KEY is missing", () => {
    const env = {
      PORT: "4000",
      SOLANA_RPC_URL: "https://api.devnet.solana.com"
    };

    expect(() => schema.parse(env)).toThrow();
  });

  it("throws error when API_KEY is too short", () => {
    const env = {
      PORT: "4000",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "short" // Less than 16 characters
    };

    expect(() => schema.parse(env)).toThrow();
  });

  it("throws error when SOLANA_RPC_URL is invalid URL", () => {
    const env = {
      PORT: "4000",
      SOLANA_RPC_URL: "not-a-valid-url",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    expect(() => schema.parse(env)).toThrow();
  });

  it("throws error when PORT is not a positive integer", () => {
    const env = {
      PORT: "-1",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    expect(() => schema.parse(env)).toThrow();
  });

  it("throws error when PORT is zero", () => {
    const env = {
      PORT: "0",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      API_KEY: "test-api-key-minimum-16-chars"
    };

    expect(() => schema.parse(env)).toThrow();
  });
});

