import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyJwt } from "./jwt";

export async function getTeacherSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("teacher_session");
    if (!session?.value) return false;
    
    const payload = await verifyJwt(session.value);
    return payload?.role === "teacher";
  } catch {
    return false;
  }
}

export async function getTeacherSessionFromRequest(req: NextRequest | Request): Promise<boolean> {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)teacher_session=([^;]*)/);
    if (!match) return false;
    
    const payload = await verifyJwt(match[1]);
    return payload?.role === "teacher";
  } catch {
    return false;
  }
}
