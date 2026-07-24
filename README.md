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
- **학번 + 이름 로그인** (예: 1학년 1반 1번 → `1101`)
- **과목 선택** — 국어 / 수학 / 영어
- **OMR 마킹** — 문항별 1~5번 선택, 경과 시간 타이머, 미마킹 경고 Alert
- **즉시 자동 채점** — 총점, 정답/오답/미응답 수, 문항별 정오답 비교

### 교사용
- **시험 등록** — 과목·회차 선택 시 문항 수/시작 번호 자동 설정, 문항별 정답·배점 입력
- **정답 수정** — 등록된 시험의 정답표 모달에서 바로 수정
- **성적 대시보드** — 시험 선택 → 학생별 석차·총점·정답률 테이블
- **반별 필터 / 다중 정렬** — 반 필터 버튼, 석차·학번·이름·정답률 컬럼 클릭 정렬
- **성적 추이 차트** — 학생 행 클릭 시 인라인 SVG 선 그래프(과목별 색상 구분)
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
| 인증 | HttpOnly 쿠키 기반 세션 |
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

# 환경 변수 설정 (.env)
DATABASE_URL="postgresql://..."
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
| 학생 | `/login` | 학번 `1101` / 이름 `김철수` |
| 교사 | `/teacher/login` | 비밀번호 `teacher1234` |

---

## 🔐 인증 구조

- **학생:** 학번 + 이름 조합 매칭 → `student_session` HttpOnly 쿠키 (7일)
- **교사:** 환경변수 `TEACHER_PASSWORD` 일치 확인 → `teacher_session` HttpOnly 쿠키 (8시간)
- **보안:** 학생은 본인 제출 데이터만 조회 가능, 정답은 서버에서만 채점 (클라이언트 미노출)

---

## 📊 데이터 모델

```
Student ─── Submission ─── Exam ─── Question
   id            id           id         id
   name          studentId    subject    examId
   grade         examId       title      questionNum
   classNum      answers(JSON)totalQ.    correctAnswer
                 totalScore   startNum   score
                 submittedAt
```
