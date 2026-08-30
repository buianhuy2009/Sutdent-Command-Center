import { handleSummarizeEmails } from "../../src/server/handlers";

export default async function handler(req: any, res: any) {
  return handleSummarizeEmails(req, res);
}
