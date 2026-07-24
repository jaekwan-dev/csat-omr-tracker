// (auth) 그룹은 교사 인증이 필요 없는 페이지 (로그인 페이지)
// 부모 layout의 auth guard를 우회하기 위해 빈 layout으로 오버라이드
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
