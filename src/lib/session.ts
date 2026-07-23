import { cookies } from "next/headers";

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
    const session = cookieStore.get("session");
    if (!session?.value) return null;
    const parsed = JSON.parse(session.value) as SessionUser;
    if (!parsed.studentId || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Route Handler에서 Request 객체로 세션을 파싱합니다.
 */
export function getSessionFromRequest(req: Request): SessionUser | null {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
    if (!match) return null;
    const parsed = JSON.parse(decodeURIComponent(match[1])) as SessionUser;
    if (!parsed.studentId || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}
