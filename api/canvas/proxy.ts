import { handleCanvasProxy } from "../../src/server/handlers";

export default async function handler(req: any, res: any) {
  return handleCanvasProxy(req, res);
}
