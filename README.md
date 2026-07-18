# GiftNest

가족이 함께 쓰는 기프티콘 관리 웹앱(PWA). 기프티콘 이미지를 업로드하면 Gemini가 브랜드·상품명·유효기간을 자동으로 추출해 등록하고, 가족 구성원이 사용 예정/완료 상태를 실시간으로 공유하며 기한 임박 알림을 받습니다.

## 주요 기능

- **자동 등록**: 갤러리/카메라/드래그앤드롭으로 이미지를 올리면 Gemini(`gemini-3.1-flash-lite`)가 브랜드·상품명·카테고리·유효기간을 구조화된 JSON으로 추출. 신뢰도가 낮거나 날짜를 찾지 못하면 절대 추측하지 않고 "확인 필요"로 분류.
- **가족 공유 대시보드**: 만료/D-1/D-3/D-7/확인 필요/사용 예정 임박 순으로 상단 배너 표시, 실시간 목록 동기화, 검색·필터·정렬(기기별 기억).
- **사용 예정 · 사용 완료**: 예정 사용자/일시 지정, 사용 완료 처리는 Firestore 트랜잭션으로 중복 완료 방지, 완료 취소 가능.
- **변경 이력**: 등록/수정/예정/완료/삭제 전체 감사 로그.
- **PWA + 푸시 알림**: 홈 화면 설치, 매일 오전 9시(KST) 기한 임박·사용 예정 알림.
- **PIN 기반 가족 인증**: 기기별 Firebase Custom Token 인증, 운영 중 PIN 변경 가능.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프론트엔드 | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 |
| 데이터 | Firebase Authentication(Custom Token) · Firestore · Storage · Cloud Messaging |
| AI | Google GenAI SDK, `gemini-3.1-flash-lite`, Structured Outputs + Zod 검증 |
| 배포 | Vercel (SSR + Vercel Cron으로 매일 알림 스케줄 실행) |
| 테스트 | Vitest(단위) · Firebase Emulator Suite(보안 규칙) · Playwright(E2E) |

## 프로젝트 구조

```text
src/
  app/            Next.js 라우트 (페이지 + API Route Handler)
  components/ui/  범용 UI 프리미티브 (Button, Dialog, Card 등)
  features/       화면별 로직 (auth, gifticons, members, settings, pwa)
  lib/            프레임워크 비의존 순수 로직 (dates, gemini, image, notifications, validation)
  server/         서버 전용 서비스 레이어 (Admin SDK 사용, API Route에서만 import)
  types/          도메인 타입
firebase/         Firestore/Storage Security Rules
tests/
  unit/           Vitest 단위 테스트
  rules/          Firebase Emulator 보안 규칙 테스트
  e2e/            Playwright E2E 테스트
```

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

`.env.local`은 Git에 커밋되지 않습니다. 각 변수의 의미:

| 변수 | 설명 |
|---|---|
| `GEMINI_API_KEY` | Gemini 이미지 분석용 API 키 (서버 전용, [Google AI Studio](https://aistudio.google.com/)에서 발급) |
| `GEMINI_MODEL` | 사용할 Gemini 모델 ID (기본 `gemini-3.1-flash-lite`) |
| `FAMILY_PIN_HASH` | 가족 공용 PIN의 bcrypt 해시 (아래 "PIN 해시 생성" 참고) |
| `FAMILY_ID` / `NEXT_PUBLIC_FAMILY_ID` | Firestore 문서 경로에 쓰이는 가족 공간 id — 비밀값 아님 (MVP는 고정 가족 공간 하나만 운영) |
| `CRON_SECRET` | Vercel Cron이 `/api/internal/notifications/daily`를 호출할 때 쓰는 인증 토큰. `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`로 생성 |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 웹 SDK 설정 (Firebase 콘솔 > 프로젝트 설정 > 일반, 공개값) |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | 웹 푸시용 VAPID 키 (Firebase 콘솔 > Cloud Messaging > 웹 푸시 인증서) |
| `FIREBASE_ADMIN_*` | Firebase Admin SDK 서비스 계정 자격 증명 (콘솔 > 서비스 계정 > 새 비공개 키 생성, 서버 전용) |

> **`.env*` 파일에 bcrypt 해시를 넣을 때 주의**: Next.js의 dotenv 로더가 `$`를 변수 치환 문자로 해석해 `$2a$12$...` 형태의 해시를 손상시킵니다. `npm run hash-pin`이 이미 이스케이프된 값(`\$2a\$12\$...`)을 함께 출력하므로 그 값을 그대로 붙여넣으세요. Vercel/Firebase 대시보드에 직접 입력할 때는 이스케이프 없는 원본 해시를 사용합니다(대시보드는 dotenv 파싱을 거치지 않습니다).

### 3. PIN 해시 생성

가족 공용 로그인 PIN은 원문을 저장소나 로그에 남기지 않고, 아래 스크립트로 해시만 생성해 사용합니다.

```bash
npm run hash-pin
```

터미널에서 PIN을 숨김 입력으로 두 번 입력하면 두 가지 형태의 bcrypt 해시가 출력됩니다: `.env.local`용(이스케이프됨)과 운영 Secret용(원본). 앱 실행 중에는 설정 화면의 "공용 비밀번호 변경"으로도 PIN을 바꿀 수 있습니다 — 이 경우 새 해시는 `families/{familyId}/settings/app` Firestore 문서에 저장되어 재배포 없이 즉시 반영됩니다(환경 변수의 해시는 최초 부트스트랩 값으로만 쓰입니다).

### 4. 개발 서버 실행

```bash
npm run dev
```

## Firebase 로컬 에뮬레이터

보안 규칙 테스트, E2E 테스트, 로컬 개발은 Firebase Emulator Suite로 진행할 수 있습니다. Firestore/Storage 에뮬레이터는 Java(JRE 11+)가 필요합니다.

```bash
npm run emulators   # Firestore/Storage/Auth 에뮬레이터 실행 (http://localhost:4000 UI)
```

에뮬레이터에 연결해 개발 서버를 실행하려면:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 \
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true \
npm run dev
```

## 테스트 · 빌드

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # 단위 테스트 (Vitest)
npm run test:rules   # Firestore/Storage 보안 규칙 테스트 (에뮬레이터 자동 실행)
npm run test:e2e     # Playwright E2E 테스트 (에뮬레이터 자동 실행)
npm run build
```

GitHub Actions(`.github/workflows/ci.yml`)가 push/PR마다 위 검사 전체와 Gitleaks Secret 스캔을 실행합니다.

## Secret 스캔

커밋 전 [Gitleaks](https://github.com/gitleaks/gitleaks)가 pre-commit 훅으로 자동 실행됩니다. 로컬에 설치되어 있지 않다면:

```bash
winget install --id=Gitleaks.Gitleaks -e
```

## 배포 (Vercel + Firebase)

### Firebase 프로젝트 설정

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 프로젝트를 생성하고 **Blaze 요금제**로 전환합니다 (Storage 사용에 필요; Cloud Functions는 사용하지 않으므로 무료 한도 내에서 운영 가능).
2. Authentication, Firestore, Storage, Cloud Messaging을 활성화합니다.
3. 보안 규칙을 배포합니다: `npx firebase deploy --only firestore:rules,storage:rules` (사전에 `npx firebase login` 및 `.firebaserc`의 프로젝트 id 확인 필요).
4. 서비스 계정 키를 발급받아(`프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성`) `FIREBASE_ADMIN_*` 값으로 사용합니다.
5. Cloud Messaging에서 웹 푸시 인증서(VAPID 키)를 생성해 `NEXT_PUBLIC_FIREBASE_VAPID_KEY`로 사용합니다.

### Vercel 배포

1. GitHub 저장소를 Vercel 프로젝트로 연결합니다.
2. Vercel 프로젝트 설정 > Environment Variables에 `.env.example`의 모든 변수를 실제 값으로 등록합니다 (Production/Preview 모두).
3. `FAMILY_PIN_HASH`는 `npm run hash-pin`으로 만든 **이스케이프 없는 원본** 해시를 그대로 입력합니다.
4. `vercel.json`에 정의된 Cron(`/api/internal/notifications/daily`, 매일 00:00 UTC = 09:00 KST)은 Vercel이 자동으로 `CRON_SECRET`을 `Authorization: Bearer` 헤더로 주입해 호출합니다 — 별도 설정이 필요 없습니다.
5. `main` 브랜치에 병합하면 자동 배포됩니다.

## 알려진 제약과 대안

- **Firebase Admin 인증 방식**: PRD는 운영 환경에서 서비스 계정 JSON 대신 런타임 기본 자격 증명(Application Default Credentials) 사용을 권장하지만, 이는 Cloud Functions/Cloud Run 같은 GCP 네이티브 런타임에서만 가능합니다. 이 프로젝트는 Vercel에 배포하므로 ADC를 쓸 수 없어, 로컬과 운영 모두 `FIREBASE_ADMIN_*` 서비스 계정 자격 증명을 환경 변수로 사용합니다.
- **강제 로그아웃의 즉시성**: "비밀번호 변경 시 기존 기기 로그아웃" 기능은 Admin SDK로 해당 기기의 refresh token을 무효화하고, 이후 모든 서버 API 요청을 `checkRevoked: true`로 검증하여 즉시 차단합니다. 다만 Firestore/Storage에 대한 클라이언트 직접 접근은 발급된 ID 토큰이 자연 만료(최대 1시간)될 때까지 유효할 수 있습니다.
- **동시 수정**: 사용 완료 처리(`/api/gifticons/:id/use`)는 Firestore 트랜잭션으로 중복 완료를 원천 차단합니다. 일반 정보 수정(`PATCH /api/gifticons/:id`)은 낙관적 동시성 제어(`expectedUpdatedAt` 불일치 시 409 반환)로 다른 기기의 최신 수정을 덮어쓰지 않도록 하며, 실시간 구독으로 최신 값이 자동 반영됩니다.
- **매일 알림 스케줄 정확도**: Vercel Hobby 플랜의 Cron은 정확히 09:00:00에 실행됨을 보장하지 않습니다(수 분 지연 가능). `NotificationLog` 기반 멱등 설계라 지연되거나 중복 실행돼도 안전합니다. 정확한 시각이 중요해지면 Cloud Scheduler로 전환할 수 있습니다.
- **여러 기프티콘이 한 이미지에 있는 경우**: MVP는 이미지당 기프티콘 1개만 인식합니다. 여러 개 분리 인식은 PRD상 P1(추후 개선) 항목입니다.
- **오프라인 사용**: 오프라인 상태에서의 작업 큐잉/동기화는 지원하지 않습니다(PRD P1). 네트워크 요청 실패 시 오류 메시지를 표시합니다.

## 라이선스

TBD
