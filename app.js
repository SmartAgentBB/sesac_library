/**
 * 송파 SeSAC 도서 대여 및 관리 시스템 - 애플리케이션 프론트엔드 제어
 */

// 전역 상태
let allBooks = [];
let currentRentals = [];
let activeTab = 'available'; // 'available' | 'rented'
let activeCategory = 'ALL';
let currentSearchQuery = '';
let selectedBook = null;
let pendingCheckoutBook = null;
let pendingReturnBook = null;

// DOM 요소 캐시
const homeView = document.getElementById('homeView');
const bookListView = document.getElementById('bookListView');
const bookDetailView = document.getElementById('bookDetailView');

const googleSsoBtn = document.getElementById('googleSsoBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailBadge = document.getElementById('userEmailBadge');
const userAvailableQuota = document.getElementById('userAvailableQuota');
const userRentedCount = document.getElementById('userRentedCount');
const userWarningPill = document.getElementById('userWarningPill');

const catalogSearchInput = document.getElementById('catalogSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

const tabBtnAvailable = document.getElementById('tabBtnAvailable');
const tabBtnRented = document.getElementById('tabBtnRented');
const tabCountAvailable = document.getElementById('tabCountAvailable');
const tabCountRented = document.getElementById('tabCountRented');
const sectionAvailable = document.getElementById('sectionAvailable');
const sectionRented = document.getElementById('sectionRented');
const availableBooksList = document.getElementById('availableBooksList');
const rentedBooksList = document.getElementById('rentedBooksList');
const emptyAvailableNotice = document.getElementById('emptyAvailableNotice');
const emptyRentedNotice = document.getElementById('emptyRentedNotice');

const myRentedBanner = document.getElementById('myRentedBanner');
const myRentedContainer = document.getElementById('myRentedContainer');
const myRentedCountBadge = document.getElementById('myRentedCountBadge');
const rentedHeaderTotal = document.getElementById('rentedHeaderTotal');

// 상세 화면 요소
const detailScrollContainer = document.getElementById('detailScrollContainer');
const detailBackBtn = document.getElementById('detailBackBtn');
const detailExternalLink = document.getElementById('detailExternalLink');
const detailBookCover = document.getElementById('detailBookCover');
const detailBlurPoster = document.getElementById('detailBlurPoster');
const detailTitle = document.getElementById('detailTitle');
const detailCategory = document.getElementById('detailCategory');
const detailAuthor = document.getElementById('detailAuthor');
const detailPublisher = document.getElementById('detailPublisher');
const detailStatusBadge = document.getElementById('detailStatusBadge');
const detailDescription = document.getElementById('detailDescription');
const detailRentalInfoCard = document.getElementById('detailRentalInfoCard');
const detailRentalStateBadge = document.getElementById('detailRentalStateBadge');
const detailRentedUser = document.getElementById('detailRentedUser');
const detailRentDate = document.getElementById('detailRentDate');
const detailDueDate = document.getElementById('detailDueDate');
const detailActionBtn = document.getElementById('detailActionBtn');

// 모달 요소
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModalBtn = document.getElementById('closeCheckoutModalBtn');
const cancelCheckoutBtn = document.getElementById('cancelCheckoutBtn');
const confirmCheckoutBtn = document.getElementById('confirmCheckoutBtn');
const checkoutModalBookTitle = document.getElementById('checkoutModalBookTitle');
const checkoutModalUserEmail = document.getElementById('checkoutModalUserEmail');
const checkoutModalRentDate = document.getElementById('checkoutModalRentDate');
const checkoutModalDueDate = document.getElementById('checkoutModalDueDate');

const returnModal = document.getElementById('returnModal');
const closeReturnModalBtn = document.getElementById('closeReturnModalBtn');
const cancelReturnBtn = document.getElementById('cancelReturnBtn');
const confirmReturnBtn = document.getElementById('confirmReturnBtn');
const returnModalBookTitle = document.getElementById('returnModalBookTitle');
const returnModalUserEmail = document.getElementById('returnModalUserEmail');

const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

/**
 * 초기 진입점
 */
window.addEventListener('DOMContentLoaded', async () => {
  // 브라우저 초기 history state 등록 (외부 페이지로 이탈하지 않고 웹앱 메인으로 안전 복귀 보장)
  if (!window.history.state) {
    window.history.replaceState({ screen: 'main' }, '', window.location.href);
  }

  await loadBooksData();
  setupEventListeners();
  checkAuthAndRender();

  // 대여 데이터 실시간 리스너 연결
  libraryBackend.subscribeRentals((rentals) => {
    currentRentals = rentals || [];
    renderDashboard();
    if (selectedBook) {
      updateDetailView(selectedBook.num);
    }
  });
});

/**
 * 도서 기본 데이터 (collected_books.json) 로드
 */
async function loadBooksData() {
  try {
    const res = await fetch('./collected_books.json');
    if (!res.ok) throw new Error('도서 목록 로드 실패');
    allBooks = await res.json();
    console.log(`✅ 총 ${allBooks.length}권의 도서 로드 완료`);
  } catch (err) {
    console.error('도서 데이터 로드 에러:', err);
    showToast('도서 데이터를 불러오지 못했습니다.', true);
  }
}

/**
 * 인증 상태 확인 및 라우팅
 */
function checkAuthAndRender() {
  const user = authManager.getCurrentUser();
  if (user) {
    showScreen('bookList');
    userEmailBadge.textContent = user.email;
    checkInitialRoute();
  } else {
    showScreen('home');
  }
}

/**
 * URL 해시(#book-번호)를 확인하여 상세 화면 자동 열기
 */
function checkInitialRoute() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#book-')) {
    const bookNum = parseInt(hash.replace('#book-', ''), 10);
    if (!isNaN(bookNum) && allBooks.some(b => b.num === bookNum)) {
      openBookDetail(bookNum, false);
    }
  }
}

/**
 * 화면 전환 제어
 */
function showScreen(screen) {
  if (screen === 'home') {
    homeView.classList.remove('hidden');
    homeView.classList.add('page-fade-in');
    bookListView.classList.add('hidden');
    bookDetailView.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (screen === 'bookList') {
    homeView.classList.add('hidden');
    bookListView.classList.remove('hidden');
    bookListView.removeAttribute('aria-hidden');
    bookDetailView.classList.add('hidden');
    renderDashboard();
  } else if (screen === 'bookDetail') {
    homeView.classList.add('hidden');
    // bookListView는 숨기지 않고 뒤에 유지 (스와이프 제스처 시 뒤쪽에 목록이 보이도록 함)
    if (bookListView) {
      bookListView.classList.remove('hidden');
      bookListView.setAttribute('aria-hidden', 'true');
    }
    bookDetailView.style.transform = '';
    bookDetailView.style.webkitTransform = '';
    bookDetailView.style.opacity = '';
    bookDetailView.style.transition = '';
    bookDetailView.classList.remove('hidden');
    bookDetailView.classList.add('page-fade-in');
    if (detailScrollContainer) {
      detailScrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
}

/**
 * 도서 상세 화면 닫기 (목록 화면으로 복귀)
 * @param {boolean} animated - 애니메이션 적용 여부
 * @param {boolean} triggerHistoryBack - 브라우저 뒤로가기 실행 여부 (popstate를 통해 일관된 닫기 유도)
 */
function closeDetailView(animated = false, triggerHistoryBack = false) {
  // 브라우저 뒤로가기 트리거 요청이 있고 현재 상태가 상세 뷰라면 history.back() 호출
  if (triggerHistoryBack) {
    if (window.location.hash.startsWith('#book-') || (window.history.state && window.history.state.screen === 'bookDetail')) {
      window.history.back();
      return; // popstate 이벤트 핸들러에서 closeDetailView(animated, false)가 호출됨
    }
  }

  selectedBook = null;

  if (animated) {
    bookDetailView.style.transition = '-webkit-transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out';
    bookDetailView.style.transform = 'translate3d(100%, 0, 0)';
    bookDetailView.style.webkitTransform = 'translate3d(100%, 0, 0)';
    bookDetailView.style.opacity = '0';
    setTimeout(() => {
      bookDetailView.style.transform = '';
      bookDetailView.style.webkitTransform = '';
      bookDetailView.style.opacity = '';
      bookDetailView.style.transition = '';
      bookDetailView.classList.add('hidden');
      if (bookListView) {
        bookListView.removeAttribute('aria-hidden');
      }
    }, 220);
  } else {
    bookDetailView.style.transform = '';
    bookDetailView.style.webkitTransform = '';
    bookDetailView.style.opacity = '';
    bookDetailView.style.transition = '';
    bookDetailView.classList.add('hidden');
    if (bookListView) {
      bookListView.removeAttribute('aria-hidden');
    }
  }

  // popstate 없이 직접 닫힌 경우 해시 정리
  if (!triggerHistoryBack && window.location.hash.startsWith('#book-')) {
    window.history.replaceState({ screen: 'main' }, '', window.location.pathname + window.location.search);
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 0. Firebase Auth 전역 이벤트 리스너 (리다이렉트 로그인 및 상태 변경 대응)
  window.addEventListener('sesac_auth_changed', (e) => {
    checkAuthAndRender();
  });

  window.addEventListener('sesac_auth_error', (e) => {
    if (e.detail) {
      showToast(e.detail, true);
    }
  });

  // 1. Google SSO 버튼
  googleSsoBtn.addEventListener('click', async () => {
    try {
      googleSsoBtn.classList.add('opacity-70', 'pointer-events-none');
      const user = await authManager.signInWithGoogle();
      if (user) {
        showToast(`${user.displayName || user.email}님 환영합니다!`);
        showScreen('bookList');
      }
    } catch (err) {
      console.warn('Google 로그인 실패:', err);
      showToast(err.message || '로그인에 실패했습니다.', true);
    } finally {
      googleSsoBtn.classList.remove('opacity-70', 'pointer-events-none');
    }
  });

  // 2. 데모 로그인 버튼들
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const email = btn.dataset.email;
      const name = btn.dataset.name;
      try {
        const user = authManager.signInWithDemoUser(email, name);
        showToast(`테스트 계정(${email})으로 로그인되었습니다.`);
        showScreen('bookList');
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  // 3. 로그아웃
  logoutBtn.addEventListener('click', async () => {
    await authManager.signOut();
    showToast('로그아웃되었습니다.');
    showScreen('home');
  });

  // 4. 검색
  catalogSearchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim().toLowerCase();
    if (currentSearchQuery.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    renderCatalogLists();
  });

  clearSearchBtn.addEventListener('click', () => {
    catalogSearchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.classList.add('hidden');
    renderCatalogLists();
  });

  // 5. 카테고리 칩 클릭
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      activeCategory = chip.dataset.category;
      renderCatalogLists();
    });
  });

  // 6. 도서 상세 뒤로가기
  detailBackBtn.addEventListener('click', () => {
    closeDetailView(true, true);
  });

  // 7. 대여 신청 확인 모달 이벤트
  closeCheckoutModalBtn.addEventListener('click', hideCheckoutModal);
  cancelCheckoutBtn.addEventListener('click', hideCheckoutModal);
  confirmCheckoutBtn.addEventListener('click', handleConfirmCheckout);

  // 8. 반납 확인 모달 이벤트
  closeReturnModalBtn.addEventListener('click', hideReturnModal);
  cancelReturnBtn.addEventListener('click', hideReturnModal);
  confirmReturnBtn.addEventListener('click', handleConfirmReturn);

  // 모달 배경 클릭 시 닫기
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) hideCheckoutModal();
  });
  returnModal.addEventListener('click', (e) => {
    if (e.target === returnModal) hideReturnModal();
  });

  // 9. 도서 상세 화면 좌->우 슬라이드(스와이프) 제스처 등록
  setupDetailSwipeGesture();

  // 10. 브라우저 뒤로가기 / 앞으로가기 제스처 이벤트 리스너 (iOS Safari 엣지 스와이프 및 Android 제스처 내비게이션 완벽 대응)
  window.addEventListener('popstate', (e) => {
    // 1) 열려 있는 모달이 있으면 모달부터 닫기
    if (checkoutModal && !checkoutModal.classList.contains('hidden') && checkoutModal.style.display !== 'none') {
      hideCheckoutModal();
      return;
    }
    if (returnModal && !returnModal.classList.contains('hidden') && returnModal.style.display !== 'none') {
      hideReturnModal();
      return;
    }

    // 2) 상세 화면 처리
    const state = e.state;
    const isDetailOpen = bookDetailView && !bookDetailView.classList.contains('hidden');

    if (isDetailOpen) {
      // 상세 화면이 열려있는데 브라우저 뒤로가기(스와이프/버튼)가 일어난 경우
      if (!state || state.screen !== 'bookDetail') {
        // triggerHistoryBack = false로 주어 추가 history.back() 호출 방지
        closeDetailView(true, false);
      }
    } else {
      // 상세 화면이 닫혀있는데 앞으로가기 된 경우
      if (state && state.screen === 'bookDetail' && state.bookNum) {
        openBookDetail(state.bookNum, false);
      }
    }
  });
}

/**
 * 책 상세 화면에서 화면을 왼쪽에서 오른쪽 방향으로 슬라이드하면 목록 화면으로 돌아가는 제스처 (iOS Safari 및 Android 완벽 지원)
 */
function setupDetailSwipeGesture() {
  if (!bookDetailView) return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let startTime = 0;
  let isTracking = false;
  let isSwiping = false;
  let directionDecided = false;

  // 1. 공통 터치/마우스 시작 처리
  const handleStart = (clientX, clientY) => {
    if (isTracking) return;
    if (bookDetailView.classList.contains('hidden')) return;
    if (checkoutModal && !checkoutModal.classList.contains('hidden') && checkoutModal.style.display !== 'none') return;
    if (returnModal && !returnModal.classList.contains('hidden') && returnModal.style.display !== 'none') return;

    startX = clientX;
    startY = clientY;
    currentX = startX;
    currentY = startY;
    startTime = Date.now();
    isTracking = true;
    isSwiping = false;
    directionDecided = false;
    bookDetailView.style.transition = 'none';
  };

  // 2. 공통 터치/마우스 이동 처리
  const handleMove = (clientX, clientY, e) => {
    if (!isTracking) return;

    currentX = clientX;
    currentY = clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // 슬라이드 방향 판정 (7px 이상 움직였을 때)
    if (!directionDecided) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > 7 || absY > 7) {
        directionDecided = true;
        // 세로 스크롤 의도가 뚜렷하거나(absY > absX * 1.3), 왼쪽으로 드래그하는 경우 -> 일반 스크롤 허용하고 스와이프 취소
        if (absY > absX * 1.3 || deltaX <= 0) {
          isTracking = false;
          bookDetailView.style.transform = '';
          bookDetailView.style.webkitTransform = '';
          bookDetailView.style.opacity = '';
          return;
        } else {
          // 오른쪽 슬라이드로 확정
          isSwiping = true;
        }
      }
    }

    if (isSwiping && deltaX > 0) {
      // iOS Safari 및 Android에서 기본 스크롤 및 바운스 차단
      if (e && e.cancelable) {
        e.preventDefault();
      }
      const maxDist = Math.max(window.innerWidth, 380);
      const opacity = Math.max(0.35, 1 - (deltaX / maxDist) * 0.45);
      bookDetailView.style.transform = `translate3d(${deltaX}px, 0, 0)`;
      bookDetailView.style.webkitTransform = `translate3d(${deltaX}px, 0, 0)`;
      bookDetailView.style.opacity = opacity.toString();
    }
  };

  // 3. 공통 터치/마우스 종료 처리
  const handleEnd = () => {
    if (!isTracking && !isSwiping) return;

    if (isSwiping) {
      const deltaX = currentX - startX;
      const deltaTime = Date.now() - startTime;
      // 빠른 플릭(350ms 이내 & 40px 이상 이동) 또는 임계치(화면 너비의 20% 또는 60px 이상 이동)
      const isQuickFlick = deltaTime < 350 && deltaX > 40;
      const isThresholdPassed = deltaX > 60 || deltaX > (window.innerWidth * 0.2);

      if (isQuickFlick || isThresholdPassed) {
        // 브라우저 뒤로가기(History API)와 연동하여 도서 상세 닫기
        closeDetailView(true, true);
      } else {
        // 원래 위치로 복귀
        bookDetailView.style.transition = '-webkit-transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out';
        bookDetailView.style.transform = 'translate3d(0, 0, 0)';
        bookDetailView.style.webkitTransform = 'translate3d(0, 0, 0)';
        bookDetailView.style.opacity = '1';
        setTimeout(() => {
          bookDetailView.style.transform = '';
          bookDetailView.style.webkitTransform = '';
          bookDetailView.style.opacity = '';
          bookDetailView.style.transition = '';
        }, 200);
      }
    }

    isTracking = false;
    isSwiping = false;
    directionDecided = false;
  };

  // --- [모바일 터치 이벤트: iOS Safari & Android] ---
  bookDetailView.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isTracking || e.touches.length !== 1) return;
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY, e);
  }, { passive: false });

  window.addEventListener('touchend', () => {
    handleEnd();
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    handleEnd();
  }, { passive: true });

  // --- [데스크톱 마우스 이벤트] ---
  bookDetailView.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input, textarea, select')) return;
    handleStart(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isTracking) return;
    handleMove(e.clientX, e.clientY, e);
  });

  window.addEventListener('mouseup', () => {
    handleEnd();
  });
}

/**
 * 탭 전환 함수 (전역 노출)
 */
window.switchCatalogTab = function(tabName) {
  activeTab = tabName;
  if (tabName === 'available') {
    tabBtnAvailable.classList.add('text-text-main', 'font-bold', 'border-primary');
    tabBtnAvailable.classList.remove('text-text-sub', 'font-medium', 'border-transparent');
    tabBtnRented.classList.add('text-text-sub', 'font-medium', 'border-transparent');
    tabBtnRented.classList.remove('text-text-main', 'font-bold', 'border-primary');

    sectionAvailable.classList.remove('hidden');
    sectionRented.classList.add('hidden');
  } else {
    tabBtnRented.classList.add('text-text-main', 'font-bold', 'border-primary');
    tabBtnRented.classList.remove('text-text-sub', 'font-medium', 'border-transparent');
    tabBtnAvailable.classList.add('text-text-sub', 'font-medium', 'border-transparent');
    tabBtnAvailable.classList.remove('text-text-main', 'font-bold', 'border-primary');

    sectionRented.classList.remove('hidden');
    sectionAvailable.classList.add('hidden');
  }
  renderCatalogLists();
};

/**
 * 대시보드 및 목록 전체 렌더링
 */
function renderDashboard() {
  const user = authManager.getCurrentUser();
  if (!user) return;

  userEmailBadge.textContent = user.email;

  // 내 대여 목록
  const myRentals = currentRentals.filter(r => r.userEmail === user.email);
  const myRentedCount = myRentals.length;
  const availableQuota = Math.max(0, 2 - myRentedCount);

  userAvailableQuota.textContent = `${availableQuota}권`;
  userRentedCount.textContent = `${myRentedCount}권`;

  if (availableQuota === 0) {
    userWarningPill.classList.remove('hidden');
  } else {
    userWarningPill.classList.add('hidden');
  }

  // 전체 카테고리 칩 카운트 갱신
  const allCategoryChip = document.querySelector('.category-chip[data-category="ALL"]');
  if (allCategoryChip) {
    allCategoryChip.textContent = `전체 ${allBooks.length}`;
  }

  // 탭 카운트 업데이트
  const rentedBookNums = new Set(currentRentals.map(r => r.bookNum));
  const availableCount = allBooks.filter(b => !rentedBookNums.has(b.num)).length;
  const rentedCount = currentRentals.length;

  tabCountAvailable.textContent = availableCount;
  tabCountRented.textContent = rentedCount;
  rentedHeaderTotal.textContent = `총 ${rentedCount}권`;

  // 내가 대여 중인 도서 상단 배너
  if (myRentedCount > 0) {
    myRentedBanner.classList.remove('hidden');
    myRentedCountBadge.textContent = myRentedCount;
    renderMyRentedBanner(myRentals);
  } else {
    myRentedBanner.classList.add('hidden');
  }

  renderCatalogLists();
}

/**
 * 내가 대여 중인 도서 상단 배너 렌더링
 */
function renderMyRentedBanner(myRentals) {
  myRentedContainer.innerHTML = '';
  myRentals.forEach(rental => {
    const book = allBooks.find(b => b.num === rental.bookNum);
    if (!book) return;

    const dueInfo = calculateDueInfo(rental.dueDate);
    const item = document.createElement('div');
    item.className = 'p-3 rounded-lg bg-white border border-blue-200/80 shadow-xs flex items-center justify-between gap-3';
    item.innerHTML = `
      <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onclick="openBookDetail(${book.num})">
        <div class="w-12 h-16 rounded bg-surface-alt overflow-hidden shrink-0 book-spine-shadow border border-border-line">
          <img src="${encodeURI(book.local_image)}" onerror="this.src='${book.cover_url}'" alt="${book.title}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-[13px] font-bold text-text-main truncate">${book.title}</h4>
          <p class="text-[11px] text-text-sub truncate mt-0.5">${book.author}</p>
          <div class="mt-1 flex items-center gap-1.5">
            ${dueInfo.isOverdue 
              ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-badge-red-bg text-badge-red font-mono">연체 ${dueInfo.diffText}</span>` 
              : `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-badge-blue-bg text-badge-blue font-mono">${dueInfo.diffText}</span>`
            }
            <span class="text-[11px] text-text-muted font-mono">반납: ${dueInfo.formattedDate}</span>
          </div>
        </div>
      </div>
      <button type="button" class="px-2.5 py-1.5 rounded-lg ${dueInfo.isOverdue ? 'bg-badge-red hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white text-[12px] font-semibold shrink-0 shadow-xs transition flex items-center gap-1 active:scale-95" onclick="promptReturnBook(${book.num}, '${escapeString(book.title)}')">
        <span class="material-symbols-outlined text-[15px]">assignment_return</span>
        ${dueInfo.isOverdue ? '반납 (연체)' : '반납'}
      </button>
    `;
    myRentedContainer.appendChild(item);
  });
}

/**
 * 카탈로그 도서 목록 필터링 및 렌더링
 */
function renderCatalogLists() {
  const user = authManager.getCurrentUser();
  const userEmail = user ? user.email : '';
  const rentedMap = new Map();
  currentRentals.forEach(r => rentedMap.set(r.bookNum, r));

  // 1. 카테고리 & 검색 필터링
  let filteredBooks = allBooks.filter(book => {
    // 검색어 필터
    if (currentSearchQuery) {
      const matchTitle = (book.title || '').toLowerCase().includes(currentSearchQuery);
      const matchAuthor = (book.author || '').toLowerCase().includes(currentSearchQuery);
      const matchCategory = (book.category || '').toLowerCase().includes(currentSearchQuery);
      if (!matchTitle && !matchAuthor && !matchCategory) return false;
    }

    // 카테고리 칩 필터
    if (activeCategory === 'MY') {
      const rental = rentedMap.get(book.num);
      return rental && rental.userEmail === userEmail;
    } else if (activeCategory !== 'ALL') {
      return (book.category || '').includes(activeCategory);
    }
    return true;
  });

  // 2. 대여 가능 도서 목록 렌더링
  const availableBooks = filteredBooks.filter(b => !rentedMap.has(b.num));
  renderAvailableList(availableBooks);

  // 3. 대여 중 도서 목록 렌더링 (대여일 기준 오래된 순 정렬)
  // ★ 상단에 "내가 대여 중인 도서" 배너가 있으므로, 목록에서는 중복 방지를 위해 본인 대여 도서 제외
  const rentedBooksWithInfo = filteredBooks
    .filter(b => {
      const rental = rentedMap.get(b.num);
      if (!rental) return false;
      // 내가 대여 중인 도서는 상단 배너에 표시되므로 하단 목록에서는 제외
      if (userEmail && rental.userEmail === userEmail) {
        return false;
      }
      return true;
    })
    .map(book => {
      const rental = rentedMap.get(book.num);
      return {
        book,
        rental,
        rentTime: new Date(rental.rentDate).getTime()
      };
    })
    // ★ 요구사항: 대여일 기준으로 정렬해서 대여한 날짜가 오래된 순으로 표시하기
    .sort((a, b) => a.rentTime - b.rentTime);

  rentedHeaderTotal.textContent = `총 ${rentedBooksWithInfo.length}권`;
  renderRentedList(rentedBooksWithInfo);
}

/**
 * 대여 가능 도서 목록 렌더링 (design_guide/book_list 레퍼런스 스타일)
 */
function renderAvailableList(books) {
  availableBooksList.innerHTML = '';
  if (books.length === 0) {
    emptyAvailableNotice.classList.remove('hidden');
    return;
  }
  emptyAvailableNotice.classList.add('hidden');

  books.forEach(book => {
    const card = document.createElement('article');
    card.className = 'book-card p-4 flex items-center gap-3.5 hover:bg-surface-alt/70 transition-colors cursor-pointer active:bg-slate-100';
    card.onclick = () => openBookDetail(book.num);

    card.innerHTML = `
      <div class="w-[68px] h-[96px] rounded bg-surface-alt overflow-hidden shrink-0 book-spine-shadow border border-border-line relative">
        <img class="w-full h-full object-cover" src="${encodeURI(book.local_image)}" onerror="this.src='${book.cover_url}'" alt="${book.title} 표지">
      </div>
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="text-[10px] font-semibold text-text-sub px-1.5 py-0.5 rounded bg-surface-alt border border-border-line">
            ${book.category}
          </span>
        </div>
        <h2 class="text-[15px] font-bold text-text-main leading-snug line-clamp-1">${book.title}</h2>
        <p class="text-[13px] text-text-sub mt-0.5 truncate">${book.author} · ${book.publisher}</p>
      </div>
      <div class="shrink-0 text-text-muted">
        <span class="material-symbols-outlined text-[20px]">chevron_right</span>
      </div>
    `;
    availableBooksList.appendChild(card);
  });
}

/**
 * 대여 중 도서 목록 렌더링 (대여일 오래된 순 + 반납 예정일 + 연체 판정)
 */
function renderRentedList(items) {
  rentedBooksList.innerHTML = '';
  const currentUser = authManager.getCurrentUser();
  const currentEmail = currentUser ? currentUser.email : '';

  if (items.length === 0) {
    emptyRentedNotice.classList.remove('hidden');
    const noticeText = emptyRentedNotice.querySelector('p');
    if (noticeText) {
      const myRentalsCount = currentRentals.filter(r => currentEmail && r.userEmail === currentEmail).length;
      if (myRentalsCount > 0) {
        noticeText.textContent = '다른 사용자가 대여 중인 도서가 없습니다.';
      } else {
        noticeText.textContent = '현재 대여 중인 도서가 없습니다.';
      }
    }
    return;
  }
  emptyRentedNotice.classList.add('hidden');

  items.forEach(({ book, rental }) => {
    const dueInfo = calculateDueInfo(rental.dueDate);
    const isMine = rental.userEmail === currentEmail;

    const card = document.createElement('article');
    card.className = 'book-card p-4 flex items-center gap-3.5 hover:bg-surface-alt/70 transition-colors cursor-pointer active:bg-slate-100';

    card.innerHTML = `
      <div class="w-[68px] h-[96px] rounded bg-surface-alt overflow-hidden shrink-0 book-spine-shadow border border-border-line relative" onclick="openBookDetail(${book.num})">
        <img class="w-full h-full object-cover" src="${encodeURI(book.local_image)}" onerror="this.src='${book.cover_url}'" alt="${book.title} 표지">
        ${dueInfo.isOverdue ? `
          <div class="absolute top-0 right-0 bg-badge-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
            연체
          </div>
        ` : ''}
      </div>
      <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5" onclick="openBookDetail(${book.num})">
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[10px] font-semibold text-text-sub px-1.5 py-0.5 rounded bg-surface-alt border border-border-line">
              ${book.category}
            </span>
            ${dueInfo.isOverdue ? `
              <span class="text-[10px] font-bold text-badge-red px-1.5 py-0.5 rounded bg-badge-red-bg border border-red-200">
                연체 중 (${dueInfo.diffText})
              </span>
            ` : `
              <span class="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary-light border border-blue-200">
                대여 중 (${dueInfo.diffText})
              </span>
            `}
            ${isMine ? `
              <span class="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-blue-100">
                MY
              </span>
            ` : ''}
          </div>
          <h3 class="text-[14px] font-bold text-text-main leading-snug line-clamp-1">${book.title}</h3>
          <p class="text-[12px] text-text-sub mt-0.5 truncate">${book.author} · ${book.publisher}</p>
        </div>
        
        <div class="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle text-[11px]">
          <div class="flex flex-col">
            <span class="text-text-muted">대여자: <span class="font-medium text-text-sub">${rental.userEmail || '-'}</span></span>
            <span class="text-text-muted">반납 예정일: <span class="font-mono font-bold ${dueInfo.isOverdue ? 'text-badge-red' : 'text-primary'}">${dueInfo.formattedDate}</span></span>
          </div>
          <div class="flex items-center gap-2">
            ${isMine ? `
              <button type="button" class="px-2.5 py-1 rounded-md text-[11px] font-bold text-white ${dueInfo.isOverdue ? 'bg-badge-red hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} transition flex items-center gap-0.5 shadow-xs shrink-0 active:scale-95" onclick="event.stopPropagation(); promptReturnBook(${book.num}, '${escapeString(book.title)}')">
                <span class="material-symbols-outlined text-[13px]">assignment_return</span>
                반납
              </button>
            ` : `
              <span class="material-symbols-outlined text-[18px] text-text-muted">chevron_right</span>
            `}
          </div>
        </div>
      </div>
    `;

    rentedBooksList.appendChild(card);
  });
}

/**
 * 도서 상세 화면 열기 (design_guide/book_info)
 * @param {number} bookNum - 도서 고유 번호
 * @param {boolean} pushHistory - 브라우저 히스토리 스택에 push할지 여부 (popstate로 열릴 때는 false)
 */
window.openBookDetail = function(bookNum, pushHistory = true) {
  const book = allBooks.find(b => b.num === bookNum);
  if (!book) return;
  selectedBook = book;
  updateDetailView(bookNum);
  showScreen('bookDetail');

  if (pushHistory) {
    const targetHash = `#book-${bookNum}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ screen: 'bookDetail', bookNum: bookNum }, '', targetHash);
    }
  }
};

/**
 * 도서 상세 화면 갱신
 */
function updateDetailView(bookNum) {
  const book = allBooks.find(b => b.num === bookNum);
  if (!book) return;

  const currentUser = authManager.getCurrentUser();
  const currentEmail = currentUser ? currentUser.email : '';
  const rental = currentRentals.find(r => r.bookNum === bookNum);

  // 표지 및 블러 배경
  detailBookCover.src = encodeURI(book.local_image);
  detailBookCover.onerror = () => { detailBookCover.src = book.cover_url; };
  detailBlurPoster.style.backgroundImage = `url('${book.cover_url}')`;

  // 기본 정보
  detailTitle.textContent = book.title;
  detailCategory.textContent = book.category;
  detailAuthor.textContent = book.author;
  detailPublisher.textContent = book.publisher;
  detailExternalLink.href = book.detail_url || '#';
  detailDescription.textContent = book.description || '도서 상세 소개가 제공되지 않습니다.';

  // 대여 상태 처리
  if (!rental) {
    // 1) 대여 가능 도서
    detailStatusBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold mb-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200';
    detailStatusBadge.innerHTML = '<span class="material-symbols-outlined text-[16px]">check_circle</span> 대여 가능';
    detailRentalInfoCard.classList.add('hidden');

    // 현재 사용자의 대여 현황 및 연체 여부 파악
    const myRentals = currentRentals.filter(r => r.userEmail === currentEmail);
    const now = new Date();
    const hasOverdueBook = myRentals.some(r => new Date(r.dueDate) < now);
    const isMaxQuotaReached = (myRentals.length >= 2);

    // ★ 룰 1: 2권 대여 중이면 대여하지 못하게 책 상세 화면에서 "대여 신청" 버튼 비활성화
    if (isMaxQuotaReached) {
      detailActionBtn.className = 'w-full h-12 rounded-xl bg-slate-200 text-slate-500 font-bold text-[15px] transition flex items-center justify-center gap-1.5 cursor-not-allowed';
      detailActionBtn.disabled = true;
      detailActionBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">block</span><span>대여 신청 불가 (최대 2권 대여 중)</span>';
      detailActionBtn.onclick = null;
    } 
    // ★ 룰 2: 1권 대여 중이지만 그 책이 연체 중이라면 책 상세 화면에서 대여하지 못하게 "대여 신청" 버튼 비활성화
    else if (hasOverdueBook) {
      detailActionBtn.className = 'w-full h-12 rounded-xl bg-slate-200 text-rose-500 font-bold text-[15px] transition flex items-center justify-center gap-1.5 cursor-not-allowed';
      detailActionBtn.disabled = true;
      detailActionBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] text-badge-red">warning</span><span>대여 신청 불가 (연체 도서 보유 중)</span>';
      detailActionBtn.onclick = null;
    } 
    // 정상 대여 가능 상태
    else {
      detailActionBtn.className = 'w-full h-12 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-[16px] shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer';
      detailActionBtn.disabled = false;
      detailActionBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">local_library</span><span>대여 신청</span>';
      detailActionBtn.onclick = () => promptCheckoutBook(book);
    }

  } else {
    // 2) 대여 중 도서
    const dueInfo = calculateDueInfo(rental.dueDate);
    const isMine = (rental.userEmail === currentEmail);

    detailRentalInfoCard.classList.remove('hidden');
    detailRentedUser.textContent = isMine ? `${rental.userEmail} (본인)` : (rental.userEmail || '-');
    detailRentDate.textContent = formatDate(rental.rentDate);
    detailDueDate.textContent = `${dueInfo.formattedDate} (${dueInfo.diffText})`;

    if (dueInfo.isOverdue) {
      detailStatusBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold mb-2.5 bg-badge-red-bg text-badge-red border border-red-200';
      detailStatusBadge.innerHTML = `<span class="material-symbols-outlined text-[16px]">warning</span> 연체 중 (${dueInfo.diffText})`;
      detailRentalStateBadge.className = 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-badge-red text-white';
      detailRentalStateBadge.textContent = '연체 중';
      detailDueDate.className = 'font-mono font-bold text-badge-red';
    } else {
      detailStatusBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold mb-2.5 bg-blue-50 text-primary border border-blue-200';
      detailStatusBadge.innerHTML = `<span class="material-symbols-outlined text-[16px]">schedule</span> 대여 중 (${dueInfo.diffText})`;
      detailRentalStateBadge.className = 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white';
      detailRentalStateBadge.textContent = '대여 중';
      detailDueDate.className = 'font-mono font-bold text-primary';
    }

    // ★ 룰 3: 대여중인 사람한테만 "반납하기" 버튼 표시 + 연체중이라면 "반납" 버튼을 빨간색으로 표시하기
    if (isMine) {
      if (dueInfo.isOverdue) {
        // 연체 중인 경우: 빨간색 반납 버튼
        detailActionBtn.className = 'w-full h-12 rounded-xl bg-badge-red hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-[16px] shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer';
        detailActionBtn.disabled = false;
        detailActionBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">assignment_return</span><span>반납하기 (연체 중)</span>';
        detailActionBtn.onclick = () => promptReturnBook(book.num, book.title);
      } else {
        // 정상 대여 중인 경우: 초록색 반납 버튼
        detailActionBtn.className = 'w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-[16px] shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer';
        detailActionBtn.disabled = false;
        detailActionBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">assignment_return</span><span>반납하기</span>';
        detailActionBtn.onclick = () => promptReturnBook(book.num, book.title);
      }
    } else {
      // 다른 사용자가 대여 중인 경우: 비활성화 버튼 표시 (반납하기 미표시)
      detailActionBtn.className = 'w-full h-12 rounded-xl bg-slate-200 text-slate-500 font-bold text-[15px] transition flex items-center justify-center gap-1.5 cursor-not-allowed';
      detailActionBtn.disabled = true;
      detailActionBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">lock</span><span>대여 중 (반납 예정: ${dueInfo.formattedDate})</span>`;
      detailActionBtn.onclick = null;
    }
  }
}

/**
 * 대여 확인 모달 띄우기 (design_guide/checkout_book 디자인)
 */
function promptCheckoutBook(book) {
  const user = authManager.getCurrentUser();
  if (!user) {
    showToast('로그인이 필요한 기능입니다.', true);
    showScreen('home');
    return;
  }

  // 1인당 최대 2권 룰 검사
  const myRentals = currentRentals.filter(r => r.userEmail === user.email);
  if (myRentals.length >= 2) {
    showToast('1인당 최대 2권까지만 대여 가능합니다. 기존 도서를 먼저 반납해 주세요.', true);
    return;
  }

  // 연체 도서 보유 여부 검사
  const now = new Date();
  const hasOverdue = myRentals.some(r => new Date(r.dueDate) < now);
  if (hasOverdue) {
    showToast('연체 중인 도서가 있어 추가 대여가 불가능합니다. 연체 도서를 먼저 반납해 주세요.', true);
    return;
  }

  pendingCheckoutBook = book;
  const dueDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

  checkoutModalBookTitle.textContent = book.title;
  checkoutModalUserEmail.textContent = user.email;
  checkoutModalRentDate.textContent = `오늘 (${formatDate(now)})`;
  checkoutModalDueDate.textContent = `${formatDate(dueDate)} (7일간)`;

  checkoutModal.style.display = 'flex';
  checkoutModal.classList.remove('hidden');
}

function hideCheckoutModal() {
  checkoutModal.style.display = 'none';
  checkoutModal.classList.add('hidden');
  pendingCheckoutBook = null;
}

/**
 * 대여 확인 실행
 */
async function handleConfirmCheckout() {
  if (!pendingCheckoutBook) return;

  const user = authManager.getCurrentUser();
  if (!user) return;

  const targetBook = pendingCheckoutBook;

  try {
    confirmCheckoutBtn.classList.add('opacity-70', 'pointer-events-none');
    await libraryBackend.checkoutBook({
      bookNum: targetBook.num,
      bookTitle: targetBook.title,
      userEmail: user.email,
      userName: user.displayName || user.email.split('@')[0]
    });

    hideCheckoutModal();
    showToast('도서 대여 신청이 완료되었습니다!');
    
    // 만약 상세 화면을 보고 있었다면 바로 갱신
    if (selectedBook && selectedBook.num === targetBook.num) {
      updateDetailView(selectedBook.num);
    }
  } catch (err) {
    showToast(err.message || '대여 신청에 실패했습니다.', true);
  } finally {
    confirmCheckoutBtn.classList.remove('opacity-70', 'pointer-events-none');
  }
}

/**
 * 반납 확인 모달 띄우기
 */
window.promptReturnBook = function(bookNum, bookTitle) {
  const user = authManager.getCurrentUser();
  if (!user) return;

  pendingReturnBook = { bookNum, bookTitle };
  returnModalBookTitle.textContent = bookTitle;
  returnModalUserEmail.textContent = user.email;

  returnModal.style.display = 'flex';
  returnModal.classList.remove('hidden');
};

function hideReturnModal() {
  returnModal.style.display = 'none';
  returnModal.classList.add('hidden');
  pendingReturnBook = null;
}

/**
 * 반납 처리 실행
 */
async function handleConfirmReturn() {
  if (!pendingReturnBook) return;
  const user = authManager.getCurrentUser();
  if (!user) return;

  const targetBook = pendingReturnBook;

  try {
    confirmReturnBtn.classList.add('opacity-70', 'pointer-events-none');
    await libraryBackend.returnBook({
      bookNum: targetBook.bookNum,
      userEmail: user.email
    });

    hideReturnModal();
    showToast('도서가 정상적으로 반납되었습니다.');

    if (selectedBook && selectedBook.num === targetBook.bookNum) {
      updateDetailView(selectedBook.num);
    }
  } catch (err) {
    showToast(err.message || '반납 처리에 실패했습니다.', true);
  } finally {
    confirmReturnBtn.classList.remove('opacity-70', 'pointer-events-none');
  }
}

/**
 * 유틸: 날짜 포맷 (YYYY.MM.DD)
 */
function formatDate(isoOrDate) {
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/**
 * 유틸: 반납 기한 및 연체 판정 계산
 */
function calculateDueInfo(dueDateIso) {
  const now = new Date();
  const due = new Date(dueDateIso);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  let diffText = '';

  if (isOverdue) {
    diffText = `D+${Math.abs(diffDays)}일`;
  } else if (diffDays === 0) {
    diffText = '오늘 반납';
  } else {
    diffText = `D-${diffDays}`;
  }

  return {
    isOverdue,
    diffDays,
    diffText,
    formattedDate: formatDate(due)
  };
}

/**
 * 유틸: 이메일 마스킹 (개인정보 보호용: se***@iceu.kr)
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local}*@${domain}`;
  }
  const visible = local.substring(0, 3);
  return `${visible}***@${domain}`;
}

/**
 * 유틸: 특수문자 이스케이프
 */
function escapeString(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

/**
 * 토스트 알림 표시
 */
let toastTimer = null;
function showToast(message, isError = false) {
  if (toastTimer) clearTimeout(toastTimer);

  toastMessage.textContent = message;
  if (isError) {
    toastIcon.textContent = 'error';
    toastIcon.className = 'material-symbols-outlined text-[18px] text-rose-400';
  } else {
    toastIcon.textContent = 'check_circle';
    toastIcon.className = 'material-symbols-outlined text-[18px] text-emerald-400';
  }

  toastNotification.style.display = 'flex';
  toastNotification.classList.remove('hidden');
  toastNotification.classList.add('page-fade-in');

  toastTimer = setTimeout(() => {
    toastNotification.style.display = 'none';
    toastNotification.classList.add('hidden');
  }, 2800);
}
