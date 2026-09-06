import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAllowedOrigin, getAllowedOriginsList, setCorsHeaders } from './handlers';

describe('CORS policy and origin validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows exact matches for configured localhost or APP_URL origins', () => {
    process.env.APP_URL = 'https://student-center.example.com';

    const reqLocal = { headers: { origin: 'http://localhost:5173' } };
    expect(getAllowedOrigin(reqLocal)).toBe('http://localhost:5173');

    const reqApp = { headers: { origin: 'https://student-center.example.com' } };
    expect(getAllowedOrigin(reqApp)).toBe('https://student-center.example.com');
  });

  it('rejects arbitrary untrusted Vercel subdomains', () => {
    process.env.APP_URL = 'https://my-legit-app.vercel.app';
    process.env.VERCEL_URL = 'my-legit-app.vercel.app';

    const reqMalicious = { headers: { origin: 'https://attacker.vercel.app' } };
    expect(getAllowedOrigin(reqMalicious)).toBeNull();

    const reqSubdomain = { headers: { origin: 'https://malicious-site.vercel.app' } };
    expect(getAllowedOrigin(reqSubdomain)).toBeNull();
  });

  it('allows explicit VERCEL_URL and VERCEL_PROJECT_PRODUCTION_URL when configured', () => {
    process.env.VERCEL_URL = 'my-deployment.vercel.app';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'https://prod-deployment.vercel.app';

    const reqVercelUrl = { headers: { origin: 'https://my-deployment.vercel.app' } };
    expect(getAllowedOrigin(reqVercelUrl)).toBe('https://my-deployment.vercel.app');

    const reqProdUrl = { headers: { origin: 'https://prod-deployment.vercel.app' } };
    expect(getAllowedOrigin(reqProdUrl)).toBe('https://prod-deployment.vercel.app');
  });

  it('allows additional origins specified in ALLOWED_ORIGINS comma-separated env variable', () => {
    process.env.ALLOWED_ORIGINS = 'https://custom1.com, https://custom2.org';

    const reqCustom1 = { headers: { origin: 'https://custom1.com' } };
    expect(getAllowedOrigin(reqCustom1)).toBe('https://custom1.com');

    const reqCustom2 = { headers: { origin: 'https://custom2.org' } };
    expect(getAllowedOrigin(reqCustom2)).toBe('https://custom2.org');
  });

  it('returns null when no origin header is provided', () => {
    const reqNoOrigin = { headers: {} };
    expect(getAllowedOrigin(reqNoOrigin)).toBeNull();
  });

  it('sets appropriate CORS headers on response when origin is allowed', () => {
    const headersSet: Record<string, string> = {};
    const mockReq = { method: 'GET', headers: { origin: 'http://localhost:5173' } };
    const mockRes = {
      setHeader: (k: string, v: string) => {
        headersSet[k] = v;
      },
      status: (code: number) => ({
        end: () => {},
        json: () => {},
      }),
    };

    const isHandled = setCorsHeaders(mockReq, mockRes as any);

    expect(isHandled).toBe(false);
    expect(headersSet['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
    expect(headersSet['Vary']).toBe('Origin');
    expect(headersSet['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('handles OPTIONS preflight request correctly and ends response', () => {
    let statusCode = 0;
    let ended = false;
    const mockReq = { method: 'OPTIONS', headers: { origin: 'http://localhost:5173' } };
    const mockRes = {
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return {
          end: () => {
            ended = true;
          },
          json: () => {},
        };
      },
    };

    const isHandled = setCorsHeaders(mockReq, mockRes as any);

    expect(isHandled).toBe(true);
    expect(statusCode).toBe(200);
    expect(ended).toBe(true);
  });
});
