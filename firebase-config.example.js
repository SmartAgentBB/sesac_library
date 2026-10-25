/**
 * 송파 SeSAC 도서 대여 시스템 - Firebase 설정 및 연동 모듈
 * 
 * 실제 Firebase 프로젝트를 연동하려면 아래 firebaseConfig 객체에 
 * 본인의 Firebase 콘솔 설정값을 입력하세요.
 * 설정값이 비어있거나 플레이스홀더인 경우 자동으로 로컬 목(Mock) 스토어로 동작하여
 * @iceu.kr 계정 검증 및 대여/반납/연체 등 모든 핵심 기능을 바로 테스트할 수 있습니다.
 */

// Firebase 콘솔 웹 앱 설정값
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Firebase 초기화 상태
let isFirebaseInitialized = false;
let authInstance = null;
let firestoreInstance = null;

// Firebase 라이브러리가 로드되었고 유효한 API Key가 있는지 확인
function checkFirebaseReady() {
  const hasValidConfig = firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
    !firebaseConfig.apiKey.startsWith("YOUR_");

  if (typeof firebase !== 'undefined' && hasValidConfig) {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      authInstance = firebase.auth();
      firestoreInstance = firebase.firestore();
      isFirebaseInitialized = true;
      console.log('✅ Firebase가 성공적으로 초기화되었습니다: ' + firebaseConfig.projectId);
      return true;
    } catch (err) {
      console.warn('Firebase 초기화 실패, 로컬 목 스토어로 동작합니다:', err);
      isFirebaseInitialized = false;
      return false;
    }
  }
  return false;
}

// 스크립트 실행 시 즉시 Firebase 초기화 시도
checkFirebaseReady();

/**
 * 도서 대여 저장소 추상화 인터페이스 (Firebase Firestore 또는 LocalStorage Mock)
 */
class LibraryBackend {
  constructor() {
    this.storageKey = 'sesac_library_rentals_v1';
    this.listeners = [];
    this.initDefaultRentals();
  }

  // 초기 샘플 대여 데이터 (대여 상태별 및 연체 도서 시연용)
  initDefaultRentals() {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      const now = new Date();
      // 10일 전 대여 (연체 도서 예시: 하네스 엔지니어링)
      const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
      const threeDaysAgoDue = new Date(tenDaysAgo.getTime() + (7 * 24 * 60 * 60 * 1000));

      // 4일 전 대여 (대여 중 도서: 트렌드 코리아 2027)
      const fourDaysAgo = new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000));
      const threeDaysLeftDue = new Date(fourDaysAgo.getTime() + (7 * 24 * 60 * 60 * 1000));

      // 2일 전 대여 (대여 중 도서: 조코딩의 바이브 코딩 1인 창업)
      const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
      const fiveDaysLeftDue = new Date(twoDaysAgo.getTime() + (7 * 24 * 60 * 60 * 1000));

      const sampleRentals = [
        {
          id: 'rental_11',
          bookNum: 11,
          bookTitle: '하네스 엔지니어링',
          userEmail: 'member01@iceu.kr',
          userName: '수강생A',
          rentDate: tenDaysAgo.toISOString(),
          dueDate: threeDaysAgoDue.toISOString(),
          status: 'RENTED'
        },
        {
          id: 'rental_4',
          bookNum: 4,
          bookTitle: '트렌드 코리아 2027',
          userEmail: 'member02@iceu.kr',
          userName: '수강생B',
          rentDate: fourDaysAgo.toISOString(),
          dueDate: threeDaysLeftDue.toISOString(),
          status: 'RENTED'
        },
        {
          id: 'rental_6',
          bookNum: 6,
          bookTitle: '조코딩의 바이브 코딩 1인 창업 with 클로드 코드, 수파베이스, 스트라이프',
          userEmail: 'student@iceu.kr', // 현재 데모 기본 사용자가 빌린 책 예시
          userName: '송파수강생',
          rentDate: twoDaysAgo.toISOString(),
          dueDate: fiveDaysLeftDue.toISOString(),
          status: 'RENTED'
        }
      ];

      localStorage.setItem(this.storageKey, JSON.stringify(sampleRentals));
    }
  }

  // 대여 목록 실시간 구독
  subscribeRentals(callback) {
    if (isFirebaseInitialized && firestoreInstance) {
      // Firebase Firestore 실시간 구독
      return firestoreInstance.collection('rentals')
        .where('status', '==', 'RENTED')
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          callback(list);
        }, (error) => {
          console.error('Firestore 실시간 구독 오류:', error);
          callback(this.getLocalRentals());
        });
    } else {
      // 로컬 스토리지 실시간 이벤트 리스너
      const handler = () => {
        callback(this.getLocalRentals());
      };
      window.addEventListener('sesac_rentals_updated', handler);
      // 초기 1회 실행
      callback(this.getLocalRentals());

      return () => window.removeEventListener('sesac_rentals_updated', handler);
    }
  }

  getLocalRentals() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data).filter(r => r.status === 'RENTED') : [];
    } catch {
      return [];
    }
  }

  saveLocalRentals(rentals) {
    localStorage.setItem(this.storageKey, JSON.stringify(rentals));
    window.dispatchEvent(new CustomEvent('sesac_rentals_updated'));
  }

  // 도서 대여 요청
  async checkoutBook({ bookNum, bookTitle, userEmail, userName }) {
    // 1. 해당 사용자의 현재 대여 권수 체크 (최대 2권)
    const currentRentals = await this.getActiveRentalsByUser(userEmail);
    if (currentRentals.length >= 2) {
      throw new Error('1인당 최대 2권까지만 대여할 수 있습니다. 기존 도서를 먼저 반납해 주세요.');
    }

    // 1-2. 연체 중인 도서 보유 여부 체크 (1권이라도 연체 중이면 대여 불가)
    const now = new Date();
    const hasOverdue = currentRentals.some(r => new Date(r.dueDate) < now);
    if (hasOverdue) {
      throw new Error('연체 중인 도서가 있어 추가 대여가 불가능합니다. 연체 도서를 먼저 반납해 주세요.');
    }

    // 2. 해당 도서가 이미 대여 중인지 확인
    const allRentals = await this.getAllActiveRentals();
    const alreadyRented = allRentals.find(r => r.bookNum === bookNum);
    if (alreadyRented) {
      throw new Error('이미 다른 사용자가 대여 중인 도서입니다.');
    }

    const dueDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7일 후

    const newRental = {
      bookNum,
      bookTitle,
      userEmail,
      userName: userName || userEmail.split('@')[0],
      rentDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'RENTED',
      createdAt: now.toISOString()
    };

    if (isFirebaseInitialized && firestoreInstance) {
      const docRef = await firestoreInstance.collection('rentals').add(newRental);
      return { id: docRef.id, ...newRental };
    } else {
      const raw = localStorage.getItem(this.storageKey);
      const list = raw ? JSON.parse(raw) : [];
      newRental.id = 'rental_' + Date.now();
      list.push(newRental);
      this.saveLocalRentals(list);
      return newRental;
    }
  }

  // 도서 반납 요청
  async returnBook({ bookNum, userEmail }) {
    if (isFirebaseInitialized && firestoreInstance) {
      const snapshot = await firestoreInstance.collection('rentals')
        .where('bookNum', '==', bookNum)
        .where('status', '==', 'RENTED')
        .get();

      if (snapshot.empty) {
        throw new Error('대여 중인 도서를 찾을 수 없습니다.');
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      if (data.userEmail !== userEmail) {
        throw new Error('본인이 대여한 도서만 반납할 수 있습니다.');
      }

      await doc.ref.update({
        status: 'RETURNED',
        returnedAt: new Date().toISOString()
      });
      return true;
    } else {
      const raw = localStorage.getItem(this.storageKey);
      const list = raw ? JSON.parse(raw) : [];
      const item = list.find(r => r.bookNum === bookNum && r.status === 'RENTED');

      if (!item) {
        throw new Error('대여 중인 도서를 찾을 수 없습니다.');
      }
      if (item.userEmail !== userEmail) {
        throw new Error('본인이 대여한 도서만 반납할 수 있습니다.');
      }

      item.status = 'RETURNED';
      item.returnedAt = new Date().toISOString();
      this.saveLocalRentals(list);
      return true;
    }
  }

  // 도서 반납 기한 연장 요청 (기존 반납일 기준 7일 연장)
  async extendRental({ bookNum, userEmail }) {
    if (isFirebaseInitialized && firestoreInstance) {
      const snapshot = await firestoreInstance.collection('rentals')
        .where('bookNum', '==', bookNum)
        .where('status', '==', 'RENTED')
        .get();

      if (snapshot.empty) {
        throw new Error('대여 중인 도서를 찾을 수 없습니다.');
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      if (data.userEmail !== userEmail) {
        throw new Error('본인이 대여한 도서만 연장할 수 있습니다.');
      }

      // 대여일 기준 반납일 차이 체크 (차이가 21일 이상이거나 이미 2회 연장한 경우 연장 불가)
      const rentDate = new Date(data.rentDate);
      const currentDueDate = new Date(data.dueDate);
      const diffDays = Math.round((currentDueDate.getTime() - rentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 21 || (data.extendCount && data.extendCount >= 2)) {
        throw new Error('대여 연장은 최대 2회(대여일 기준 최대 21일)까지만 가능합니다.');
      }

      const newDueDate = new Date(currentDueDate.getTime() + (7 * 24 * 60 * 60 * 1000));
      const extendCount = (data.extendCount || 0) + 1;

      await doc.ref.update({
        dueDate: newDueDate.toISOString(),
        extendCount: extendCount,
        lastExtendedAt: new Date().toISOString()
      });
      return { id: doc.id, ...data, dueDate: newDueDate.toISOString(), extendCount };
    } else {
      const raw = localStorage.getItem(this.storageKey);
      const list = raw ? JSON.parse(raw) : [];
      const item = list.find(r => r.bookNum === bookNum && r.status === 'RENTED');

      if (!item) {
        throw new Error('대여 중인 도서를 찾을 수 없습니다.');
      }
      if (item.userEmail !== userEmail) {
        throw new Error('본인이 대여한 도서만 연장할 수 있습니다.');
      }

      // 대여일 기준 반납일 차이 체크 (차이가 21일 이상이거나 이미 2회 연장한 경우 연장 불가)
      const rentDate = new Date(item.rentDate);
      const currentDueDate = new Date(item.dueDate);
      const diffDays = Math.round((currentDueDate.getTime() - rentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 21 || (item.extendCount && item.extendCount >= 2)) {
        throw new Error('대여 연장은 최대 2회(대여일 기준 최대 21일)까지만 가능합니다.');
      }

      const newDueDate = new Date(currentDueDate.getTime() + (7 * 24 * 60 * 60 * 1000));
      item.dueDate = newDueDate.toISOString();
      item.extendCount = (item.extendCount || 0) + 1;
      item.lastExtendedAt = new Date().toISOString();

      this.saveLocalRentals(list);
      return item;
    }
  }

  async getAllActiveRentals() {
    if (isFirebaseInitialized && firestoreInstance) {
      const snapshot = await firestoreInstance.collection('rentals')
        .where('status', '==', 'RENTED')
        .get();
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      return list;
    } else {
      return this.getLocalRentals();
    }
  }

  async getActiveRentalsByUser(userEmail) {
    const all = await this.getAllActiveRentals();
    return all.filter(r => r.userEmail === userEmail);
  }
}

/**
 * Firebase 인증 및 @iceu.kr 도메인 제한 관리자
 */
class AuthManager {
  constructor() {
    this.sessionKey = 'sesac_library_user_session';
    this.setupAuthListener();
  }

  // Firebase Auth 리스너 및 리다이렉트 로그인 결과 처리
  setupAuthListener() {
    if (typeof firebase === 'undefined') return;

    try {
      const auth = firebase.auth();

      // 1. Firebase Auth 실시간 인증 상태 변경 감지
      auth.onAuthStateChanged((user) => {
        if (user) {
          const email = user.email || '';
          if (email.toLowerCase().endsWith('@iceu.kr')) {
            const sessionUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL || null
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));
            window.dispatchEvent(new CustomEvent('sesac_auth_changed', { detail: sessionUser }));
          } else {
            auth.signOut();
            localStorage.removeItem(this.sessionKey);
            window.dispatchEvent(new CustomEvent('sesac_auth_changed', { detail: null }));
          }
        } else {
          // 데모 유저로 접속 중이 아니라면 세션 제거
          const current = this.getCurrentUser();
          if (current && !current.uid.startsWith('demo_')) {
            localStorage.removeItem(this.sessionKey);
            window.dispatchEvent(new CustomEvent('sesac_auth_changed', { detail: null }));
          }
        }
      });

      // 2. 모바일 Safari signInWithRedirect 후 돌아왔을 때의 결과 처리
      auth.getRedirectResult()
        .then((result) => {
          if (result && result.user) {
            const user = result.user;
            const email = user.email || '';
            if (!email.toLowerCase().endsWith('@iceu.kr')) {
              auth.signOut();
              window.dispatchEvent(new CustomEvent('sesac_auth_error', {
                detail: '송파 SeSAC 도서관은 @iceu.kr 구글 계정으로만 이용 가능합니다.'
              }));
              return;
            }
            const sessionUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL || null
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));
            window.dispatchEvent(new CustomEvent('sesac_auth_changed', { detail: sessionUser }));
            console.log('✅ Google 리다이렉트 로그인 성공:', sessionUser.email);
          }
        })
        .catch((err) => {
          console.error('Redirect 로그인 결과 처리 오류:', err);
          const msg = this.formatAuthError(err);
          window.dispatchEvent(new CustomEvent('sesac_auth_error', { detail: msg }));
        });
    } catch (e) {
      console.warn('Auth 리스너 설정 중 예외:', e);
    }
  }

  // 에러 메시지 사용자 친화적 변환
  formatAuthError(err) {
    if (!err) return '로그인 처리 중 오류가 발생했습니다.';
    if (err.code === 'auth/popup-closed-by-user') {
      return '로그인 창이 닫혔습니다.';
    }
    if (err.code === 'auth/missing-initial-state') {
      return '브라우저 보안 설정(시크릿 모드 또는 인앱 브라우저)으로 인해 세션이 격리되었습니다. 일반 Safari 브라우저에서 접속해 주세요.';
    }
    if (err.code === 'auth/operation-not-allowed') {
      return 'Firebase 콘솔(Authentication > Sign-in method)에서 Google 로그인을 사용 설정(Enable)해 주세요.';
    }
    if (err.code === 'auth/unauthorized-domain') {
      return '현재 접속한 도메인이 Firebase 콘솔의 승인된 도메인(Authorized domains) 목록에 등록되어 있지 않습니다.';
    }
    if (err.code === 'auth/popup-blocked') {
      return '브라우저에 의해 팝업 창이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해 주세요.';
    }
    return err.message || '로그인에 실패했습니다.';
  }

  // 현재 로그인된 유저 가져오기
  getCurrentUser() {
    const raw = localStorage.getItem(this.sessionKey);
    return raw ? JSON.parse(raw) : null;
  }

  // 구글 SSO 로그인 처리 (@iceu.kr 계정만 허용)
  async signInWithGoogle() {
    if (isFirebaseInitialized && authInstance) {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({
        hd: 'iceu.kr', // iceu.kr 도메인 힌트 제공
        prompt: 'select_account'
      });

      // iOS 및 모바일 환경 감지
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isStandalonePWA = window.navigator.standalone === true || 
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

      try {
        let user;
        // iOS 또는 PWA 홈 화면 모드에서는 팝업 차단 발생 시 자동으로 리다이렉트 방식으로 폴백
        if (isIOS || isStandalonePWA) {
          try {
            const result = await authInstance.signInWithPopup(provider);
            user = result.user;
          } catch (popupErr) {
            if (popupErr.code === 'auth/popup-blocked' ||
                popupErr.code === 'auth/operation-not-supported-in-this-environment' ||
                popupErr.code === 'auth/missing-initial-state' ||
                popupErr.code === 'auth/cancelled-popup-request') {
              console.warn('모바일 환경 팝업 제약 감지, 리다이렉트 방식으로 로그인 진행:', popupErr);
              await authInstance.signInWithRedirect(provider);
              return null; // 페이지가 구글 로그인으로 리다이렉트됨
            }
            throw popupErr;
          }
        } else {
          const result = await authInstance.signInWithPopup(provider);
          user = result.user;
        }

        if (!user) return null;

        const email = user.email || '';
        // @iceu.kr 도메인 검증
        if (!email.toLowerCase().endsWith('@iceu.kr')) {
          await authInstance.signOut();
          throw new Error('송파 SeSAC 도서관은 @iceu.kr 구글 계정으로만 이용 가능합니다.');
        }

        const sessionUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));
        window.dispatchEvent(new CustomEvent('sesac_auth_changed', { detail: sessionUser }));
        return sessionUser;
      } catch (err) {
        throw new Error(this.formatAuthError(err));
      }
    } else {
      // Firebase 키 미설정 시: 친절한 안내와 함께 데모용 @iceu.kr 계정 로그인 지원
      return this.signInWithDemoUser('student@iceu.kr', '송파수강생');
    }
  }

  // 테스트 및 데모용 @iceu.kr 계정 로그인
  signInWithDemoUser(email, displayName) {
    if (!email.toLowerCase().endsWith('@iceu.kr')) {
      throw new Error('@iceu.kr 도메인 계정만 허용됩니다.');
    }
    const sessionUser = {
      uid: 'demo_' + Date.now(),
      email: email,
      displayName: displayName || email.split('@')[0],
      photoURL: null
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionUser));
    window.dispatchEvent(new CustomEvent('sesac_auth_changed', { detail: sessionUser }));
    return sessionUser;
  }

  // 로그아웃
  async signOut() {
    if (isFirebaseInitialized && authInstance) {
      await authInstance.signOut();
    }
    localStorage.removeItem(this.sessionKey);
    window.dispatchEvent(new CustomEvent('sesac_auth_changed', { detail: null }));
  }
}

// 전역 인스턴스 초기화 및 브라우저 전역(window) 바인딩
const libraryBackend = new LibraryBackend();
const authManager = new AuthManager();

window.firebaseConfig = firebaseConfig;
window.libraryBackend = libraryBackend;
window.authManager = authManager;
window.checkFirebaseReady = checkFirebaseReady;

// 페이지 로드 시 Firebase 초기화 재확인
window.addEventListener('DOMContentLoaded', () => {
  checkFirebaseReady();
});
