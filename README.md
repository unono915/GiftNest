# GiftNest

가족이 함께 쓰는 기프티콘 관리 웹앱(PWA). 기프티콘 이미지를 업로드하면 AI가 브랜드·상품명·유효기간을 자동으로 추출하고, 가족 구성원이 사용 예정/완료 상태를 공유합니다.

> 이 저장소는 초기 구축 단계입니다. 애플리케이션 코드는 이후 Phase에서 추가됩니다.

## 개발 환경 준비

```bash
npm install
```

### PIN 해시 생성

가족 공용 로그인 PIN은 원문을 저장소나 로그에 남기지 않고, 아래 스크립트로 해시만 생성해 사용합니다.

```bash
npm run hash-pin
```

터미널에서 PIN을 숨김 입력으로 두 번 입력하면 bcrypt 해시가 출력됩니다. 이 해시를 로컬 개발용 `.env.local`의 `FAMILY_PIN_HASH` 값, 또는 운영 환경의 Secret/Environment Variable로 등록하세요.

### 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

`.env.local`은 Git에 커밋되지 않습니다. 자세한 변수 설명과 Secret 관리 정책은 향후 추가될 프로젝트 문서를 따릅니다.

## Secret 스캔

커밋 전 [Gitleaks](https://github.com/gitleaks/gitleaks)가 pre-commit 훅으로 자동 실행됩니다. 로컬에 설치되어 있지 않다면:

```bash
winget install --id=Gitleaks.Gitleaks -e
```

## 라이선스

TBD
