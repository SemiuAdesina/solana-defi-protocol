import { describe, expect, it, vi } from "vitest";

import { createResolvers, type GraphContext } from "./resolvers.js";

const resolvers = createResolvers();

type CreateContextResult = {
  ctx: GraphContext;
  mocks: {
    getRegistryByAuthority: ReturnType<typeof vi.fn>;
    getRecent: ReturnType<typeof vi.fn>;
    getStatus: ReturnType<typeof vi.fn>;
  };
};

const createContext = (): CreateContextResult => {
  const getRegistryByAuthority = vi.fn();
  const getRecent = vi.fn();
  const getStatus = vi.fn();

  const ctx: GraphContext = {
    registryService: {
      getRegistryByAuthority
    },
    ciStatusService: {
      getRecent,
      getStatus,
      addStatus: vi.fn()
    }
  };

  return {
    ctx,
    mocks: {
      getRegistryByAuthority: getRegistryByAuthority as ReturnType<typeof vi.fn>,
      getRecent: getRecent as ReturnType<typeof vi.fn>,
      getStatus: getStatus as ReturnType<typeof vi.fn>
    }
  };
};

describe("Graph resolvers", () => {
  describe("registry query", () => {
    it("fetches registry metadata for valid authority", async () => {
      const { ctx, mocks } = createContext();
      const mockRegistry = {
        authority: "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA",
        version: 1,
        bump: 255,
        metadataUri: "https://example.com/metadata.json",
        metadataChecksum: Array(32).fill(1)
      };
      mocks.getRegistryByAuthority.mockResolvedValue(mockRegistry);
      
      const result = await resolvers.Query.registry(
        {},
        { authority: mockRegistry.authority },
        ctx
      );
      
      expect(result).toEqual(mockRegistry);
      expect(mocks.getRegistryByAuthority).toHaveBeenCalledWith(mockRegistry.authority);
    });

    it("returns null when registry does not exist", async () => {
      const { ctx, mocks } = createContext();
      const authority = "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA";
      mocks.getRegistryByAuthority.mockResolvedValue(null);
      
      const result = await resolvers.Query.registry({}, { authority }, ctx);
      
      expect(result).toBeNull();
      expect(mocks.getRegistryByAuthority).toHaveBeenCalledWith(authority);
    });

    it("throws error for invalid authority address", async () => {
      const { ctx } = createContext();
      const invalidAuthority = "not-a-valid-address";
      
      await expect(
        resolvers.Query.registry({}, { authority: invalidAuthority }, ctx)
      ).rejects.toThrow("Invalid authority address");
    });

    it("throws error with helpful message for invalid address", async () => {
      const { ctx } = createContext();
      const invalidAuthority = "invalid";
      
      await expect(
        resolvers.Query.registry({}, { authority: invalidAuthority }, ctx)
      ).rejects.toThrow(/Invalid authority address.*valid Solana address/);
    });

    it("handles service errors gracefully", async () => {
      const { ctx, mocks } = createContext();
      const authority = "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA";
      mocks.getRegistryByAuthority.mockRejectedValue(new Error("Service error"));
      
      await expect(
        resolvers.Query.registry({}, { authority }, ctx)
      ).rejects.toThrow("Service error");
    });
  });

  describe("ciStatuses query", () => {
    it("returns CI statuses list", async () => {
      const { ctx, mocks } = createContext();
      const mockStatuses = [
        {
          pipeline: "test-pipeline",
          status: "success" as const,
          commit: "abc123",
          runId: "run-1",
          triggeredBy: "user",
          timestamp: "2025-11-30T12:00:00.000Z"
        }
      ];
      mocks.getRecent.mockResolvedValue(mockStatuses);
      
      const result = await resolvers.Query.ciStatuses({}, { limit: 5 }, ctx);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockStatuses);
      expect(mocks.getRecent).toHaveBeenCalledWith(5);
    });

    it("uses default limit when not provided", async () => {
      const { ctx, mocks } = createContext();
      mocks.getRecent.mockResolvedValue([]);
      
      const result = await resolvers.Query.ciStatuses({}, {}, ctx);
      
      expect(Array.isArray(result)).toBe(true);
      expect(mocks.getRecent).toHaveBeenCalledWith(undefined);
    });

    it("returns empty array when no statuses exist", async () => {
      const { ctx, mocks } = createContext();
      mocks.getRecent.mockResolvedValue([]);
      
      const result = await resolvers.Query.ciStatuses({}, { limit: 10 }, ctx);
      
      expect(result).toEqual([]);
    });

    it("handles service errors", async () => {
      const { ctx, mocks } = createContext();
      mocks.getRecent.mockRejectedValue(new Error("Service error"));
      
      await expect(
        resolvers.Query.ciStatuses({}, { limit: 10 }, ctx)
      ).rejects.toThrow("Service error");
    });
  });

  describe("ciStatus query", () => {
    it("returns CI status by runId when it exists", async () => {
      const { ctx, mocks } = createContext();
      const mockStatus = {
        pipeline: "test-pipeline",
        status: "success" as const,
        commit: "abc123",
        runId: "run-1",
        triggeredBy: "user",
        timestamp: "2025-11-30T12:00:00.000Z"
      };
      mocks.getStatus.mockResolvedValue(mockStatus);
      
      const result = await resolvers.Query.ciStatus({}, { runId: "run-1" }, ctx);
      
      expect(result).toEqual(mockStatus);
      expect(mocks.getStatus).toHaveBeenCalledWith("run-1");
    });

    it("returns null when status does not exist", async () => {
      const { ctx, mocks } = createContext();
      mocks.getStatus.mockResolvedValue(null);
      
      const result = await resolvers.Query.ciStatus({}, { runId: "non-existent" }, ctx);
      
      expect(result).toBeNull();
      expect(mocks.getStatus).toHaveBeenCalledWith("non-existent");
    });

    it("handles service errors", async () => {
      const { ctx, mocks } = createContext();
      mocks.getStatus.mockRejectedValue(new Error("Service error"));
      
      await expect(
        resolvers.Query.ciStatus({}, { runId: "run-1" }, ctx)
      ).rejects.toThrow("Service error");
    });
  });
});
