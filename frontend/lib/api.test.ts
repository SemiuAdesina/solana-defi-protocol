import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after setting up mocks
import { fetchMetadata, fetchCiStatuses, type RegistryMetadata, type CiStatus } from "./api.js";

describe("API functions", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("fetchMetadata", () => {
    const mockAuthority = "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA";
    const mockMetadata: RegistryMetadata = {
      authority: mockAuthority,
      version: 1,
      metadataUri: "https://example.com/metadata.json",
      metadataChecksum: [1, 2, 3]
    };

    it("fetches metadata successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      const result = await fetchMetadata(mockAuthority);

      expect(result).toEqual(mockMetadata);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/metadata/${mockAuthority}`)
      );
    });

    it("returns null when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await fetchMetadata(mockAuthority);

      expect(result).toBeNull();
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchMetadata(mockAuthority)).rejects.toThrow("Network error");
    });

    it("handles metadata with null URI and checksum", async () => {
      const metadataWithNulls: RegistryMetadata = {
        authority: mockAuthority,
        version: 1,
        metadataUri: null,
        metadataChecksum: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => metadataWithNulls
      });

      const result = await fetchMetadata(mockAuthority);

      expect(result).toEqual(metadataWithNulls);
    });
  });

  describe("fetchCiStatuses", () => {
    const mockStatuses: CiStatus[] = [
      {
        pipeline: "test-pipeline",
        status: "success",
        commit: "abc123",
        runId: "run-1",
        triggeredBy: "user",
        timestamp: "2025-11-30T12:00:00.000Z"
      }
    ];

    it("fetches CI statuses successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatuses
      });

      const result = await fetchCiStatuses();

      expect(result).toEqual(mockStatuses);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/ci/status"));
    });

    it("returns empty array when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await fetchCiStatuses();

      expect(result).toEqual([]);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchCiStatuses()).rejects.toThrow("Network error");
    });

    it("returns empty array when response is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const result = await fetchCiStatuses();

      expect(result).toEqual([]);
    });
  });
});
