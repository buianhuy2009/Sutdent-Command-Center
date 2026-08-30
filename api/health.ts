import { handleHealth } from "../src/server/handlers";

export default async function handler(req: any, res: any) {
  return handleHealth(req, res);
}
