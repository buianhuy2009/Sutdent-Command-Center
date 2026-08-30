import { handleParseAssignment } from "../../src/server/handlers";

export default async function handler(req: any, res: any) {
  return handleParseAssignment(req, res);
}
