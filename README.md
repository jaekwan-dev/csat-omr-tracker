# 📋 수능 대비 OMR 성적 관리 앱

> 고등학교 수능 대비 OMR 답안 제출 및 자동 채점, 교사용 성적 관리 플랫폼

## 📌 프로젝트 소개

학생이 국어·수학·영어 과목의 OMR 답안을 직접 입력하면 **즉시 자동 채점**하여 결과를 확인할 수 있고, 교사는 시험을 등록하고 학생 전체의 성적을 한눈에 관리할 수 있는 웹 앱입니다.

| 대상 | 주요 기능 |
|------|-----------|
| 학생 | 로그인 → 과목 선택 → OMR 마킹 → 즉시 채점 결과 확인 |
| 교사 | 시험 등록/수정/삭제 → 성적 대시보드 → 반별 필터 → CSV 다운로드 |

---

## 🚀 주요 기능

### 학생용
- **학번 + 이름 + PIN 번호 로그인 및 초기 PIN(0000) 강제 재설정** — initial PIN `0000`으로 접속 시 4자리 비밀 PIN 번호 변경 모달 강제 팝업 실행
- **과목 선택 (상단 3열 필터 & 미응시 시험 안내)** — `국어`·`수학`·`영어` 3열 균등 그리드 탭 & 미응시 시험 부재 시 친절한 안내 카드 및 학습 이력 이동 버튼 제공
- **과목별 시험 OMR 마킹** — 국어(1~30번), 수학(1~20번), 영어(18~45번) 전과목 100% 객관식 1~5번 실시간 마킹 및 자동 채점 지원
- **과목별 간소화 제출** — 국어·수학 과목은 '그래도 제출' 단계를 없애고 "정말 제출하겠습니까?" 확인 팝업 안전장치를 거쳐 바로 제출
- **즉시 자동 채점 & 보안** — 총점, 정답/오답/미응답 수, 문항별 정오답 비교 (채점 후 정답률 조작 방지를 위해 제출 후 '다시 풀기' 탭 제한)
- **제출 이력 (History)** — 상단 3열 과목 필터 & 검색바 제공! 제출 완료한 모든 시험의 성적, 채점 결과표 및 문제지 다시보기 조회
- **성적 변화 그래프 & 통계 리포트** — `전체` 제거! 3열 균등 과목 그리드(`국어`·`수학`·`영어`) & 회차별 성적 추이 그래프(%), 과목별 평균/최고/최근 점수, 성적 변화 트렌드(상승/하락) 분석 제공

---

## 📚 이용 매뉴얼 (Manuals)

- 📖 [학생용 매뉴얼 (manual_student.md)](manual_student.md)
- 🏫 [교사용 매뉴얼 (manual_teacher.md)](manual_teacher.md)

### 교사용
- **학생 관리 (CRUD & 모바일 카드 UI)** — 학생 계정 생성 시 고유 **PIN 번호 자동 발급** (모바일용 반응형 학생 카드 뷰 지원)
- **CSV 대량 등록** — 엑셀 양식을 통한 수십 명 단위의 학생 및 PIN 일괄 등록 지원
- **시험 등록 및 관리 (3열 필터 & 컴팩트 리스트 뷰)** — `전체 과목` 제거! 3열 균등 과목 그리드(`국어`·`수학`·`영어`) & 실시간 검색바, 한 줄 슬림 리스트 뷰 지원
- **정답 수정** — 등록된 시험의 정답표 모달에서 바로 수정
- **성적 대시보드 (문항 통계 상단 배치)** — 필터 컨트롤 → KPI 지표 → 문항별 정답률 통계(상단 노출) → 학생별 성적 리스트 순 배치 제공
- **반별 필터 / 다중 정렬** — 반 필터 버튼, 석차·학번·이름·정답률 컬럼 클릭 정렬
- **CSV 다운로드** — 석차·문항별 답안 포함, Excel 한글 정상 출력

---

## 🗂️ 과목별 OMR 구성

| 과목 | 문항 범위 | 문항 수 |
|------|-----------|---------|
| 국어 | 1 ~ 30번 | 30문항 |
| 수학 | 1 ~ 20번 | 20문항 |
| 영어 | 18 ~ 45번 (듣기 제외) | 28문항 |

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | [Next.js 16](https://nextjs.org) (App Router) |
| DB ORM | [Prisma 7](https://www.prisma.io) + `@prisma/adapter-pg` |
| 데이터베이스 | PostgreSQL (Neon Serverless) |
| 인증 | JWT (jose 라이브러리) + HttpOnly 쿠키 |
| 스타일 | Vanilla CSS (글로벌 디자인 시스템) |
| 런타임 | Node.js 20 |

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── login/              # 학생 로그인
│   ├── exam/[id]/          # OMR 마킹 페이지
│   ├── result/[id]/        # 채점 결과 페이지
│   ├── teacher/
│   │   ├── login/          # 교사 로그인
│   │   ├── page.tsx        # 성적 대시보드
│   │   └── exams/          # 시험 등록·관리
│   └── api/
│       ├── auth/           # 학생 로그인/로그아웃
│       ├── exams/          # 시험 조회
│       ├── submissions/    # 답안 제출 + 자동 채점
│       └── teacher/        # 교사 전용 API
├── lib/
│   ├── prisma.ts           # Prisma Client 싱글톤
│   ├── session.ts          # 학생 세션 유틸
│   └── teacherSession.ts   # 교사 세션 유틸
└── styles/
    └── globals.css         # 디자인 시스템 토큰
```

---

## ⚡ 시작하기

### 사전 요구사항

- Node.js 20 이상
- PostgreSQL 호환 DB (또는 Neon 프로젝트)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local)
DATABASE_URL="postgresql://..."
JWT_SECRET="super-secret-jwt-key"
TEACHER_PASSWORD="teacher1234"

# DB 마이그레이션
npx prisma migrate deploy

# 초기 데이터 시딩 (테스트 학생 및 시험 데이터)
npx prisma db seed

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 앱을 확인하세요.

### 테스트 계정

| 구분 | 접속 경로 | 계정 정보 |
|------|-----------|-----------|
| 학생 | `/login` | 학번 `1101` / 이름 `김철수` / PIN `1234` |
| 교사 | `/teacher/login` | 비밀번호 `teacher1234` |

---

## 🔐 인증 구조 (Security)

- **학생:** 학번 + 이름 + PIN 번호(4자리) 3중 매칭 → Edge 런타임에서 `jose`를 통해 암호화 서명된 JWT 발급 → `session` HttpOnly 쿠키 (7일)
- **교사:** 환경변수 `TEACHER_PASSWORD` 매칭 → 암호화 서명된 관리자 JWT 발급 → `teacher_session` HttpOnly 쿠키 (8시간)
- **보안 검증:** API 및 페이지 접근 시 미들웨어(`middleware.ts`)에서 JWT 서명의 유효성을 엄격하게 검증하여 위조 및 탈취 방지

---

## 📊 데이터 모델

```
Student ─── Submission ─── Exam ─── Question
   id            id           id         id
   name          studentId    subject    examId
   pinCode       examId       title      questionNum
   grade         answers(JSON)totalQ.    correctAnswer
   classNum      totalScore   startNum   score
                 submittedAt
```
