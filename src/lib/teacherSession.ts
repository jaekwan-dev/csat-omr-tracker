import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function getTeacherSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("teacher_session");
  return session?.value === "authenticated";
}

export function getTeacherSessionFromRequest(req: NextRequest): boolean {
  const session = req.cookies.get("teacher_session");
  return session?.value === "authenticated";
}
