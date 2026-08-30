import { handleAssistant } from "../../src/server/handlers";

export default async function handler(req: any, res: any) {
  return handleAssistant(req, res);
}
