# 🔒 인증 및 세션 보안 강화(JWT) 계획서

현재 평문(Plain Text)으로 저장되어 위조 및 변조가 쉬운 쿠키 기반 세션을 **JSON Web Token(JWT)**을 활용해 안전하게 암호화하고 서명하는 방식으로 교체합니다.

## User Review Required

- 환경 변수(`.env`)에 `JWT_SECRET` (암호화 키)과 `TEACHER_PASSWORD` (선생님 로그인 비밀번호)를 추가하게 됩니다. 로컬 환경 테스트를 위해 `.env.local`을 생성하여 사용하겠습니다. 괜찮으신가요?
- 기존 로그인 세션이 모두 무효화되므로 테스트 시 다시 로그인해야 합니다.

## Proposed Changes

### 1. `jose` 라이브러리 설치
- Next.js Edge Runtime(Middleware)에서도 완벽히 호환되는 가벼운 JWT 라이브러리인 `jose`를 설치합니다.

### 2. JWT 유틸리티 생성
#### [NEW] `src/lib/jwt.ts`
- 서버 비밀키(`JWT_SECRET`)를 사용하여 학생과 교사의 세션 데이터를 서명(Sign)하고 검증(Verify)하는 유틸리티 함수를 생성합니다.

### 3. 세션 파서 업데이트
#### [MODIFY] `src/lib/session.ts` (학생 세션)
#### [MODIFY] `src/lib/teacherSession.ts` (교사 세션)
- 기존의 단순 JSON.parse() 및 단순 문자열 검증 로직을 제거하고, `src/lib/jwt.ts`를 호출하여 **유효한 JWT 토큰인지 검증 후 해독**하도록 수정합니다.

### 4. 로그인 로직 업데이트
#### [MODIFY] `src/app/api/auth/login/route.ts` (학생 로그인)
- 로그인 성공 시 평문 JSON 대신 JWT 토큰을 발급하여 쿠키에 저장합니다.
#### [MODIFY] `src/app/api/teacher/auth/login/route.ts` (교사 로그인)
- 하드코딩된 `"0000"` 비밀번호 대신 `process.env.TEACHER_PASSWORD`와 대조합니다.
- 단순 `"authenticated"` 텍스트 대신 교사 권한이 담긴 JWT 토큰을 발급합니다.

### 5. 미들웨어 보안 처리
#### [MODIFY] `src/middleware.ts`
- 교사 페이지(`(/teacher)`) 접근 시 쿠키 값이 유효한 서명을 가진 교사용 JWT인지 `jose` 라이브러리를 통해 검증합니다. 서명이 유효하지 않거나 위조된 경우 차단합니다.

## Verification Plan
1. 학생 계정으로 로그인 후 브라우저 개발자 도구(F12)에서 `session` 쿠키가 읽을 수 없는 긴 암호화 문자열(JWT)로 변경되었는지 확인합니다.
2. 쿠키 값을 임의로 변조했을 때 서버에서 올바르게 차단(로그아웃 상태 처리)하는지 확인합니다.
3. 교사 비밀번호가 `.env` 기반으로 잘 동작하는지, 잘못된 비밀번호 입력 시 차단되는지 확인합니다.
