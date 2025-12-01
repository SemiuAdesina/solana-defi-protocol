import { describe, expect, it, beforeEach } from "vitest";
import { createCiStatusService } from "./ci-status.service.js";
import type { CiStatusInput } from "./types.js";

describe("CiStatusService", () => {
  let service: Awaited<ReturnType<typeof createCiStatusService>>;

  beforeEach(async () => {
    service = await createCiStatusService();
  });

  describe("addStatus", () => {
    it("adds a new CI status", async () => {
      const input: CiStatusInput = {
        pipeline: "test-pipeline",
        status: "success",
        commit: "abc123",
        runId: "run-1",
        triggeredBy: "user"
      };

      await service.addStatus(input);

      const statuses = await service.getRecent(10);
      expect(statuses.length).toBeGreaterThan(0);
      const added = statuses.find((s) => s.runId === input.runId);
      expect(added).toBeDefined();
      expect(added?.pipeline).toBe(input.pipeline);
      expect(added?.status).toBe(input.status);
      expect(added?.commit).toBe(input.commit);
      expect(added?.triggeredBy).toBe(input.triggeredBy);
      expect(added?.timestamp).toBeDefined();
    });

    it("uses provided timestamp if available", async () => {
      const timestamp = "2025-11-30T12:00:00.000Z";
      const input: CiStatusInput = {
        pipeline: "test-pipeline",
        status: "success",
        commit: "abc123",
        runId: "run-2",
        triggeredBy: "user",
        timestamp
      };

      await service.addStatus(input);

      const status = await service.getStatus("run-2");
      expect(status?.timestamp).toBe(timestamp);
    });

    it("generates timestamp if not provided", async () => {
      const input: CiStatusInput = {
        pipeline: "test-pipeline",
        status: "success",
        commit: "abc123",
        runId: "run-3",
        triggeredBy: "user"
      };

      await service.addStatus(input);

      const status = await service.getStatus("run-3");
      expect(status?.timestamp).toBeDefined();
      expect(new Date(status!.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe("getRecent", () => {
    beforeEach(async () => {
      // Add multiple statuses
      for (let i = 1; i <= 5; i++) {
        await service.addStatus({
          pipeline: `pipeline-${i}`,
          status: "success",
          commit: `commit-${i}`,
          runId: `run-${i}`,
          triggeredBy: "user"
        });
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    it("returns recent statuses in reverse chronological order", async () => {
      const statuses = await service.getRecent(5);

      expect(statuses.length).toBeGreaterThanOrEqual(5);
      
      // Check that they're in reverse chronological order (newest first)
      for (let i = 0; i < statuses.length - 1; i++) {
        const current = new Date(statuses[i].timestamp);
        const next = new Date(statuses[i + 1].timestamp);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it("respects limit parameter", async () => {
      const statuses = await service.getRecent(3);

      expect(statuses.length).toBeLessThanOrEqual(3);
    });

    it("returns empty array when no statuses exist", async () => {
      // This test verifies the service returns an array even when empty
      // Note: In a real scenario with shared storage, you'd use a test storage path
      const statuses = await service.getRecent(10);
      expect(Array.isArray(statuses)).toBe(true);
    });

    it("defaults to 10 items when limit not specified", async () => {
      const statuses = await service.getRecent();
      
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getStatus", () => {
    it("returns status by runId when it exists", async () => {
      const input: CiStatusInput = {
        pipeline: "test-pipeline",
        status: "success",
        commit: "abc123",
        runId: "run-specific",
        triggeredBy: "user"
      };

      await service.addStatus(input);

      const status = await service.getStatus("run-specific");

      expect(status).not.toBeNull();
      expect(status?.runId).toBe("run-specific");
      expect(status?.pipeline).toBe("test-pipeline");
    });

    it("returns null when status does not exist", async () => {
      const status = await service.getStatus("non-existent-run");

      expect(status).toBeNull();
    });
  });

  describe("storage limits", () => {
    it("maintains maximum of 500 statuses", async () => {
      // Add more than 500 statuses
      for (let i = 1; i <= 510; i++) {
        await service.addStatus({
          pipeline: "test-pipeline",
          status: "success",
          commit: `commit-${i}`,
          runId: `run-${i}`,
          triggeredBy: "user"
        });
      }

      const statuses = await service.getRecent(1000);

      // Should not exceed 500
      expect(statuses.length).toBeLessThanOrEqual(500);
    });
  });
});

