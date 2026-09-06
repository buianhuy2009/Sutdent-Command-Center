import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "../../api/canvas/proxy.js";
import { handleCanvasProxy } from "./handlers";

describe("Canvas Proxy SSRF Protection Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.CANVAS_ALLOWED_HOSTS;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const createMockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.headers = {};
    res.setHeader = (k: string, v: string) => {
      res.headers[k] = v;
    };
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body: any) => {
      res.body = body;
      return res;
    };
    res.send = (text: string) => {
      res.body = text;
      return res;
    };
    res.end = () => res;
    return res;
  };

  describe("Vercel Serverless Endpoint (api/canvas/proxy.js)", () => {
    it("allows standard Canvas domain (instructure.com subdomains)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => ({ courses: [] }),
      } as any);

      const req: any = {
        method: "GET",
        query: { url: "https://4015.instructure.com/api/v1/courses" },
        headers: { "x-canvas-token": "test-token" },
      };
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ courses: [] });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://4015.instructure.com/api/v1/courses",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("blocks disallowed domain (SSRF attempt)", async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const req: any = {
        method: "GET",
        query: { url: "http://169.254.169.254/latest/meta-data/" },
        headers: {},
      };
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Host not allowlisted");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("blocks localhost domain (SSRF attempt)", async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const req: any = {
        method: "GET",
        query: { url: "http://localhost:3000/api/health" },
        headers: {},
      };
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Host not allowlisted");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("reads canvasToken from req.body if present", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => ({ success: true }),
      } as any);

      const req: any = {
        method: "POST",
        query: { url: "https://canvaslms.com/api/v1/user" },
        body: { canvasToken: "body-token" },
        headers: {},
      };
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://canvaslms.com/api/v1/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer body-token",
          }),
        })
      );
    });
  });

  describe("Express Server Endpoint (src/server/handlers.ts)", () => {
    it("allows allowed host and blocks disallowed host", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => ({ ok: true }),
      } as any);

      // Allowed host
      const reqAllowed: any = {
        query: { url: "https://school.instructure.com/api/v1/courses" },
        headers: {},
      };
      const resAllowed = createMockRes();
      await handleCanvasProxy(reqAllowed, resAllowed);
      expect(resAllowed.statusCode).toBe(200);

      // Disallowed host
      const reqDisallowed: any = {
        query: { url: "https://evil.com/steal" },
        headers: {},
      };
      const resDisallowed = createMockRes();
      await handleCanvasProxy(reqDisallowed, resDisallowed);
      expect(resDisallowed.statusCode).toBe(400);
      expect(resDisallowed.body.error).toContain("Host not allowlisted");
    });
  });
});
