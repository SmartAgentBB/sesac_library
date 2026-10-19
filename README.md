# 송파 SeSAC 도서 대여 신청 및 관리 시스템 (PWA)

송파 SeSAC 수강생들을 위한 모바일 최적화 웹앱(PWA) 기반의 참고 도서 대여 및 관리 시스템입니다.

---

## 📱 주요 기능 및 특징

1. **PWA (Progressive Web App) 모바일 최적화**
   - 모바일 기기 홈 화면 추가 지원 (`manifest.json`, 앱 아이콘 192x192, 512x512)
   - 서비스 워커(`sw.js`)를 통한 도서 목록 및 표지 이미지 오프라인 캐싱 지원
   - Safe Area 패딩, 오버스크롤 방지, 3D 책등 그림자 효과 등 프리미엄 모바일 UI/UX

2. **사용자 인증 (Firebase & @iceu.kr 계정 제한)**
   - Google 계정으로 로그인 (Firebase Authentication Google SSO)
   - **`@iceu.kr` 도메인 계정만 엄격히 허용** (타 도메인 접속 시 차단 및 경고)
   - 빠른 체험 및 시연을 위한 원클릭 테스트 계정 지원 (`student@iceu.kr`, `member01@iceu.kr` 등)

3. **도서 대여 룰**
   - **1인당 최대 2권**까지 대여 가능 (2권 초과 시 대여 차단 및 안내)
   - **대여 기간 최대 1주일 (7일)**
   - 반납 예정일 초과 시 **"연체 중"** 상태로 실시간 자동 판정

4. **화면 구성**
   - **홈 화면 (`design_guide/home`)**:
     - 송파SeSAC 도서관 로고, Google 로그인, 대여 이용 규정 안내
   - **도서 목록 화면 (`design_guide/book_list`)**:
     - 상단 헤더: 로고, 사용자 프로필, 로그아웃
     - 대여 현황 배너: 사용자 이메일, 남은 대여 가능 권수 및 대여 중 권수 표시
     - 검색 바: 도서명, 저자, 카테고리 실시간 검색
     - 카테고리 칩: 전체, 컴퓨터/IT, 경제/경영
     - 세그먼트 탭 2개:
       - **대여 가능 도서**: 현재 대여 가능한 책 카드 목록
       - **대여 중 도서**: **대여일 기준 오래된 순 정렬**, 반납 예정일 및 연체 도서 강조 표시
     - 내가 대여 중인 도서 배너 및 원클릭 반납 버튼
   - **도서 상세 화면 (`design_guide/book_info`)**:
     - 3D 표지 프리젠테이션 및 블러 배경 효과
     - 도서 상세 정보 (제목, 저자, 출판사, 카테고리, 도서 소개 전문)
     - 외부 서점(교보문고) 링크
     - **권한별 하단 액션 버튼**:
       - 대여 가능 도서: `[대여 신청]` 버튼 (2권 한도 검사)
       - 내가 대여 중인 도서: `[반납하기]` 버튼
       - 다른 사용자가 대여 중인 도서: `[🔒 대여 중 (반납 예정: YYYY.MM.DD)]` 비활성화 안내
   - **대여 확인 모달 (`design_guide/checkout_book`)**:
     - 도서명, 신청자, 신청일, 반납 기한(7일 후), 주의사항 명세 카드

---

## 📂 프로젝트 구조

```
sesac_library/
├── index.html                 # PWA 메인 SPA 애플리케이션
├── app.js                     # 프론트엔드 라우팅 및 비즈니스 로직
├── firebase-config.js         # Firebase 설정, @iceu.kr 인증 및 Firestore 실시간 동기화/로컬 스토어
├── styles.css                 # 디자인 가이드 토큰 및 모바일 전용 스타일
├── manifest.json              # PWA Web App Manifest
├── sw.js                      # PWA Service Worker (오프라인 캐시)
├── collected_books.json       # 도서 상세 데이터 (13권)
├── images/                    # 도서 표지 원본 이미지 (13개)
├── icons/                     # PWA 앱 아이콘 (192x192, 512x512)
├── design_guide/              # UI/UX 레퍼런스 디자인 가이드
└── server.js                  # 로컬 테스트용 HTTP 서버
```

---

## 🚀 실행 방법

### 로컬 서버 실행:
```bash
node server.js
```
브라우저에서 `http://localhost:3000` 접속

---

## ⚙️ Firebase 실제 프로젝트 연동 가이드

1. `firebase-config.example.js`를 복사하여 `firebase-config.js`를 생성합니다.
2. 파일 상단의 `firebaseConfig` 객체에 Firebase 콘솔의 웹 앱 설정값을 입력하시면 즉시 실제 Firebase Auth 및 Cloud Firestore로 동작합니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef"
};
```

> **참고**: Firebase 키를 입력하지 않은 상태에서는 기본 내장된 **Local Simulated Backend**가 활성화되어 별도 설정 없이도 모든 UI/UX와 대여/반납/연체/2권 제한 로직이 100% 정상 작동합니다.
