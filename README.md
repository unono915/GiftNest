# GiftNest

가족이 함께 쓰는 기프티콘 관리 웹앱(PWA). 기프티콘 이미지를 업로드하면 AI가 브랜드·상품명·유효기간을 자동으로 추출하고, 가족 구성원이 사용 예정/완료 상태를 공유합니다.

## 기술 스택

- Next.js (App Router) + TypeScript + Tailwind CSS
- Firebase Authentication (Custom Token) · Firestore · Storage · Cloud Messaging
- Google GenAI SDK (`gemini-3.1-flash-lite`)
- 배포: Vercel (Vercel Cron으로 매일 알림 스케줄 실행)

## 개발 환경 준비

```bash
npm install
```

### 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

`.env.local`은 Git에 커밋되지 않습니다. 각 변수의 의미:

| 변수 | 설명 |
|---|---|
| `GEMINI_API_KEY` | Gemini 이미지 분석용 API 키 (서버 전용) |
| `GEMINI_MODEL` | 사용할 Gemini 모델 ID |
| `FAMILY_PIN_HASH` | 가족 공용 PIN의 bcrypt 해시 (아래 "PIN 해시 생성" 참고) |
| `FAMILY_ID` | Firestore 문서 경로에 쓰이는 가족 공간 id (비밀값 아님) |
| `CRON_SECRET` | Vercel Cron이 `/api/internal/notifications/daily`를 호출할 때 쓰는 인증 토큰 |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 웹 SDK 설정 (공개값) |
| `FIREBASE_ADMIN_*` | Firebase Admin SDK 서비스 계정 자격 증명 (서버 전용) |

### PIN 해시 생성

가족 공용 로그인 PIN은 원문을 저장소나 로그에 남기지 않고, 아래 스크립트로 해시만 생성해 사용합니다.

```bash
npm run hash-pin
```

터미널에서 PIN을 숨김 입력으로 두 번 입력하면 bcrypt 해시가 출력됩니다. 이 해시를 로컬 개발용 `.env.local`의 `FAMILY_PIN_HASH` 값, 또는 운영 환경의 Secret/Environment Variable로 등록하세요.

앱 실행 중에는 설정 화면의 "공용 비밀번호 변경"으로도 PIN을 바꿀 수 있습니다. 이 경우 새 해시는 `families/{familyId}/settings/app` Firestore 문서에 저장되어 재배포 없이 즉시 반영됩니다(환경 변수의 해시는 최초 부트스트랩 값으로만 쓰입니다).

## 개발 서버 실행

```bash
npm run dev
```

## Firebase 로컬 에뮬레이터

보안 규칙 테스트와 로컬 개발은 Firebase Emulator Suite로 진행합니다. Firestore/Storage 에뮬레이터는 Java(JRE 11+)가 필요합니다.

```bash
npm run emulators      # Firestore/Storage/Auth 에뮬레이터 실행 (http://localhost:4000 UI)
npm run test:rules     # 에뮬레이터를 자동으로 띄우고 보안 규칙 테스트 실행
```

## 테스트 · 빌드

```bash
npm run lint
npm run typecheck
npm run test        # 단위 테스트 (Vitest)
npm run test:rules   # Firestore/Storage 보안 규칙 테스트
npm run build
```

## Secret 스캔

커밋 전 [Gitleaks](https://github.com/gitleaks/gitleaks)가 pre-commit 훅으로 자동 실행됩니다. 로컬에 설치되어 있지 않다면:

```bash
winget install --id=Gitleaks.Gitleaks -e
```

## 알려진 제약과 대안

- **Firebase Admin 인증 방식**: PRD는 운영 환경에서 서비스 계정 JSON 대신 런타임 기본 자격 증명(Application Default Credentials) 사용을 권장하지만, 이는 Cloud Functions/Cloud Run 같은 GCP 네이티브 런타임에서만 가능합니다. 이 프로젝트는 Vercel에 배포하므로 ADC를 쓸 수 없어, 로컬과 운영 모두 `FIREBASE_ADMIN_*` 서비스 계정 자격 증명을 환경 변수로 사용합니다.
- **강제 로그아웃의 즉시성**: "비밀번호 변경 시 기존 기기 로그아웃" 기능은 Admin SDK로 해당 기기의 refresh token을 무효화하고, 이후 모든 서버 API 요청을 `checkRevoked: true`로 검증하여 즉시 차단합니다. 다만 Firestore/Storage에 대한 클라이언트 직접 접근은 발급된 ID 토큰이 자연 만료(최대 1시간)될 때까지 유효할 수 있습니다.

## 라이선스

TBD
