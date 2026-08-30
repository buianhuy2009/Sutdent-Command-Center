import { handleQuickDraft } from "../../src/server/handlers";

export default async function handler(req: any, res: any) {
  return handleQuickDraft(req, res);
}
