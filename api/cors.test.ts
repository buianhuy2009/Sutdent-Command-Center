import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAllowedOrigin, setCorsHeaders } from "./cors.js";

describe("CORS Origin Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getAllowedOrigin", () => {
    it("allows standard localhost origins", () => {
      expect(getAllowedOrigin("http://localhost:5173")).toBe("http://localhost:5173");
      expect(getAllowedOrigin("http://localhost:3000")).toBe("http://localhost:3000");
      expect(getAllowedOrigin("http://127.0.0.1:5173")).toBe("http://127.0.0.1:5173");
    });

    it("allows vercel.app preview and production domains", () => {
      expect(getAllowedOrigin("https://student-command-center.vercel.app")).toBe("https://student-command-center.vercel.app");
      expect(getAllowedOrigin("https://preview-123.vercel.app")).toBe("https://preview-123.vercel.app");
    });

    it("allows origins configured in environment variables", () => {
      process.env.APP_URL = "https://custom-domain.com";
      expect(getAllowedOrigin("https://custom-domain.com")).toBe("https://custom-domain.com");
    });

    it("rejects untrusted/malicious origins", () => {
      expect(getAllowedOrigin("https://evil.com")).toBeNull();
      expect(getAllowedOrigin("https://attacker-vercel.app.evil.com")).toBeNull();
      expect(getAllowedOrigin("http://localhost:8080")).toBeNull();
    });

    it("returns null when no origin header is provided", () => {
      expect(getAllowedOrigin(undefined)).toBeNull();
    });
  });

  describe("setCorsHeaders", () => {
    it("sets Access-Control-Allow-Origin and Vary headers for trusted origin", () => {
      const headers: Record<string, string> = {};
      const req = { headers: { origin: "http://localhost:5173" } };
      const res = {
        setHeader: (key: string, value: string) => {
          headers[key] = value;
        },
      };

      setCorsHeaders(req as any, res as any);

      expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:5173");
      expect(headers["Vary"]).toBe("Origin");
      expect(headers["Access-Control-Allow-Methods"]).toContain("GET, POST");
    });

    it("does NOT set Access-Control-Allow-Origin for untrusted origin", () => {
      const headers: Record<string, string> = {};
      const req = { headers: { origin: "https://evil.com" } };
      const res = {
        setHeader: (key: string, value: string) => {
          headers[key] = value;
        },
      };

      setCorsHeaders(req as any, res as any);

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
      expect(headers["Vary"]).toBeUndefined();
    });
  });
});
