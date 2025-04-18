# 구글 광고 리포트 애플리케이션

구글 광고 API를 활용하여 광고 캠페인 및 키워드 성과를 분석하고 리포트를 제공하는 웹 애플리케이션입니다.

## 주요 기능

- 캠페인 퍼포먼스 리포트 (노출, 클릭, 비용, 전환, CTR 등)
- 키워드 퍼포먼스 리포트
- 사용자 정의 날짜 범위 설정
- 데이터 정렬 및 필터링

## 기술 스택

- Next.js 14
- TypeScript
- TailwindCSS
- Google Ads API
- React Hooks

## 시작하기

### 사전 요구사항

- Node.js 18.17.0 이상
- npm 또는 yarn
- Google Ads API 개발자 토큰 및 서비스 계정 인증 정보

### 설치 방법

1. 저장소 클론하기
   ```bash
   git clone https://github.com/yourusername/google-ads-report.git
   cd google-ads-report
   ```

2. 패키지 설치하기
   ```bash
   npm install
   # 또는
   yarn install
   ```

3. 환경 변수 설정하기
   `.env.local` 파일을 루트 디렉토리에 생성하고 다음과 같이 설정합니다:

   ```
   GOOGLE_CLIENT_EMAIL=your-service-account-email@project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
   GOOGLE_ADS_CUSTOMER_ID=1234567890
   GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
   GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890
   
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. 개발 서버 실행하기
   ```bash
   npm run dev
   # 또는
   yarn dev
   ```

5. 브라우저에서 http://localhost:3000 으로 접속하기

## Google Ads API 설정

Google Ads API를 사용하기 위해서는 다음과 같은 단계가 필요합니다:

1. [Google API Console](https://console.developers.google.com/)에서 프로젝트 생성
2. Google Ads API 활성화
3. 서비스 계정 생성 및 키 다운로드
4. [Google Ads](https://ads.google.com/) 계정에서 개발자 토큰 발급
5. Google Ads 계정에 API 접근 권한 부여

## 배포

Vercel을 통해 손쉽게 배포할 수 있습니다:

```bash
npm run build
# 또는
vercel deploy
```

## 라이선스

MIT
