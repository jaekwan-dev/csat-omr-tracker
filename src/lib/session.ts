import { cookies } from "next/headers";
import { verifyJwt } from "./jwt";

export interface SessionUser {
  studentId: string;
  name: string;
  grade: number;
  classNum: number;
}

/**
 * 서버 컴포넌트 / Route Handler에서 현재 세션을 파싱합니다.
 * 세션이 없거나 파싱 실패 시 null 반환.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return null;
    
    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.studentId || !payload.name) return null;
    
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Route Handler에서 Request 객체로 세션을 파싱합니다.
 */
export async function getSessionFromRequest(req: Request): Promise<SessionUser | null> {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
    if (!match) return null;
    
    const payload = await verifyJwt(match[1]);
    if (!payload || !payload.studentId || !payload.name) return null;
    
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
