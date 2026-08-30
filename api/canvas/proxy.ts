export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-canvas-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid URL protocol" });
    }

    const headers: Record<string, string> = {
      "User-Agent": "StudentCommandCenter/1.0",
    };

    const canvasToken = req.headers["x-canvas-token"] as string;
    if (canvasToken) {
      headers["Authorization"] = `Bearer ${canvasToken}`;
    }

    const response = await fetch(targetUrl, { headers });
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Canvas fetch failed with status ${response.status}: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get("content-type") || "text/plain";
    res.setHeader("Content-Type", contentType);

    if (contentType.includes("json")) {
      const data = await response.json();
      return res.status(200).json(data);
    } else {
      const text = await response.text();
      return res.status(200).send(text);
    }
  } catch (err: any) {
    console.error("Canvas proxy error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch from Canvas" });
  }
}
