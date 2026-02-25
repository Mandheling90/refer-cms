# ehr-next (refer-cms)

병원 의뢰 관리 CMS 프로젝트

## 기술 스택

### 1. Core Framework & Runtime

- **Next.js 15** (App Router)
- **React 19**

### 2. Language

- **TypeScript 5**

### 3. Styling

- **Tailwind CSS 4** + PostCSS
- **class-variance-authority** + **clsx** + **tailwind-merge** (조건부 스타일링)
- **tw-animate-css** (애니메이션)

### 4. UI Components

- **Radix UI** + **shadcn** (기본 UI 컴포넌트)
- **Lucide React** (아이콘)
- **cmdk** (커맨드 팔레트)
- **Sonner** (토스트 알림)
- **next-themes** (다크/라이트 테마)

### 5. State Management

- **Zustand 5** (전역 상태)

### 6. Form & Validation

- **React Hook Form 7**
- **Zod 4** (스키마 검증)

### 7. API & Data

- **Apollo Client 4** (GraphQL)
- **TanStack React Table 8** (테이블 렌더링)
- **@dnd-kit** (드래그&드롭)
- **date-fns 4** (날짜 유틸)

### 8. Testing

- **Playwright** (E2E 테스트)

### 9. Tooling

- **npm**
- **ESLint 8** + eslint-config-next
- **Prettier 3**

## 스크립트

```bash
# 개발 서버 실행 (포트 3007)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작 (포트 3007)
npm run start

# 린트 검사
npm run lint

# E2E 테스트 실행
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui
```

## 환경변수

### `.env.local` (개발)

| 변수명                    | 설명                                | 값                              |
| ------------------------- | ----------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_GRAPHQL_URL` | GraphQL API 엔드포인트 (클라이언트) | `https://api.propai.kr/graphql` |

### `.env.production` (운영)

| 변수명                    | 설명                                | 값                              |
| ------------------------- | ----------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_GRAPHQL_URL` | GraphQL API 엔드포인트 (클라이언트) | `https://api.propai.kr/graphql` |

## 주요 설정

### Next.js (`next.config.ts`)

- `/graphql` 경로를 백엔드 서버(`http://158.247.215.161/graphql`)로 rewrite 프록시

### TypeScript (`tsconfig.json`)

- target: `ES2017`
- strict 모드 활성화
- 경로 alias: `@/*` -> `./src/*`
- moduleResolution: `bundler`

### Playwright (`playwright.config.ts`)

- 테스트 디렉토리: `./tests`
- 대상 브라우저: Chromium, Firefox, WebKit
- baseURL: `http://localhost:3000`
- CI 환경: retry 2회, worker 1개

## 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 루트 페이지
│   └── cms/                      # CMS 페이지 라우트
│       ├── layout.tsx            # CMS 공통 레이아웃
│       ├── home/                 # 홈 대시보드
│       ├── admin-info/           # 관리자 정보
│       ├── banner/               # 배너 관리
│       │   ├── main-banner/      #   메인 배너
│       │   ├── mini-banner/      #   미니 배너
│       │   ├── popup/            #   팝업
│       │   └── strip/            #   스트립 배너
│       ├── board/                # 게시판 관리
│       │   └── config/           #   게시판 설정
│       ├── code/                 # 코드 관리
│       │   └── group/            #   코드 그룹
│       ├── common-code/          # 공통 코드
│       ├── contents/             # 콘텐츠 관리
│       ├── cooperation/          # 협력기관 관리
│       │   ├── clinic-apply/     #   의원 신청
│       │   ├── clinic-edit/      #   의원 수정
│       │   ├── hospital-apply/   #   병원 신청
│       │   └── hospital-edit/    #   병원 수정
│       ├── exam-image/           # 검사 이미지 관리
│       │   └── [category]/       #   카테고리별 동적 라우트
│       ├── interface/            # 인터페이스 관리
│       ├── medical-staff/        # 의료진 관리
│       ├── menu/                 # 메뉴 관리
│       ├── permission/           # 권한 관리
│       ├── role/                 # 역할 관리
│       ├── role-menu/            # 역할-메뉴 매핑
│       ├── role-user/            # 역할-사용자 매핑
│       ├── scheduler/            # 스케줄러
│       ├── sms/                  # SMS 관리
│       ├── system-menu/          # 시스템 메뉴
│       ├── template/             # 템플릿 관리
│       └── user/                 # 사용자 관리
│           └── apply/            #   사용자 신청
│
├── components/                   # 컴포넌트 (Atomic Design)
│   ├── atoms/                    # 원자 컴포넌트
│   │   ├── LoadingSpinner.tsx
│   │   ├── Logo.tsx
│   │   ├── SearchInput.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ThemeToggle.tsx
│   ├── molecules/                # 분자 컴포넌트
│   │   ├── ActionButtons.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── FormField.tsx
│   │   └── SearchBar.tsx
│   ├── organisms/                # 유기체 컴포넌트
│   │   ├── CrudForm.tsx
│   │   ├── DataTable.tsx
│   │   └── MenuTreeGrid.tsx
│   ├── templates/                # 템플릿 컴포넌트
│   │   ├── CmsLayout.tsx
│   │   ├── FormPageTemplate.tsx
│   │   └── ListPageTemplate.tsx
│   ├── providers/                # Context Provider
│   │   ├── ApolloProvider.tsx
│   │   └── ThemeProvider.tsx
│   └── ui/                       # shadcn UI 컴포넌트
│
├── hooks/                        # 커스텀 훅
│   └── use-mobile.ts
│
├── lib/                          # 유틸리티 및 API
│   ├── api/                      # API 모듈
│   │   ├── client.ts             #   Apollo Client 설정
│   │   ├── board.ts
│   │   ├── code.ts
│   │   ├── contents.ts
│   │   ├── menu.ts
│   │   ├── permission.ts
│   │   ├── role.ts
│   │   └── user.ts
│   ├── graphql/                  # GraphQL 쿼리/뮤테이션
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── queries/
│   │       ├── auth.ts
│   │       ├── member.ts
│   │       ├── member-apply.ts
│   │       └── partner.ts
│   ├── utils/                    # 유틸 함수
│   │   ├── date.ts
│   │   └── format.ts
│   ├── utils.ts                  # 공통 유틸 (cn 등)
│   └── constants.ts              # 상수 정의
│
├── stores/                       # Zustand 스토어
│   └── menu-store.ts
│
└── types/                        # TypeScript 타입 정의
    ├── api.ts
    ├── board.ts
    ├── code.ts
    ├── cooperation.ts
    ├── member.ts
    ├── menu.ts
    ├── permission.ts
    ├── role.ts
    └── user.ts
```
