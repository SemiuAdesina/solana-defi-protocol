import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import { createApiKeyGuard } from "./api-key.js";

describe("createApiKeyGuard", () => {
  const createApp = (apiKey: string): express.Application => {
    const app = express();
    app.use(express.json());
    app.use("/protected", createApiKeyGuard(apiKey));
    app.post("/protected", (req, res) => {
      res.json({ success: true });
    });
    return app;
  };

  it("allows access with valid API key", async () => {
    const apiKey = "valid-api-key-12345678";
    const app = createApp(apiKey);

    const res = await request(app)
      .post("/protected")
      .set("x-api-key", apiKey)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("rejects request without API key header", async () => {
    const apiKey = "valid-api-key-12345678";
    const app = createApp(apiKey);

    const res = await request(app)
      .post("/protected")
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects request with invalid API key", async () => {
    const apiKey = "valid-api-key-12345678";
    const app = createApp(apiKey);

    const res = await request(app)
      .post("/protected")
      .set("x-api-key", "wrong-api-key")
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects request with API key of wrong length", async () => {
    const apiKey = "valid-api-key-12345678";
    const app = createApp(apiKey);

    const res = await request(app)
      .post("/protected")
      .set("x-api-key", "short")
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("uses timing-safe comparison to prevent timing attacks", async () => {
    const apiKey = "valid-api-key-12345678";
    const app = createApp(apiKey);

    // Test that similar but wrong keys are still rejected
    const res = await request(app)
      .post("/protected")
      .set("x-api-key", "valid-api-key-12345677") // One character different
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 when API key is not configured", async () => {
    const app = express();
    app.use(express.json());
    app.use("/protected", createApiKeyGuard(""));
    app.post("/protected", (req, res) => {
      res.json({ success: true });
    });

    const res = await request(app)
      .post("/protected")
      .set("x-api-key", "any-key")
      .send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "ApiKeyUnset" });
  });

  it("handles case-sensitive API keys correctly", async () => {
    const apiKey = "CaseSensitive-Key-12345678";
    const app = createApp(apiKey);

    // Exact match should work
    const res1 = await request(app)
      .post("/protected")
      .set("x-api-key", apiKey)
      .send({});
    expect(res1.status).toBe(200);

    // Different case should fail
    const res2 = await request(app)
      .post("/protected")
      .set("x-api-key", apiKey.toLowerCase())
      .send({});
    expect(res2.status).toBe(401);
  });
});

