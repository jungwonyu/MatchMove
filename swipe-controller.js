/**
 * Swipe Controller - 터치/스와이프 입력 관리
 */
class SwipeController {
  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.minSwipeDistance = 50;
    this.isSwipeStarted = false;
    this.isDebugMode = false; // 디버깅 모드
    
    this.swipeArea = document.getElementById('swipeArea');
    this.initializeEventListeners();
  }

  /**
   * 이벤트 리스너 초기화
   */
  initializeEventListeners() {
    if (!this.swipeArea) return;

    // 터치 이벤트
    this.swipeArea.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.swipeArea.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.swipeArea.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.swipeArea.addEventListener('touchcancel', this.handleTouchCancel.bind(this));

    // 마우스 이벤트 (데스크톱 테스트용)
    this.swipeArea.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.swipeArea.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * 터치 시작 처리
   */
  handleTouchStart(e) {
    if (!this.isSwipeAreaActive()) return;

    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.isSwipeStarted = true;

    this.debug('Touch start:', this.startX, this.startY);
  }

  /**
   * 터치 이동 처리
   */
  handleTouchMove(e) {
    if (!this.isSwipeStarted || !this.isSwipeAreaActive()) return;
    e.preventDefault();
  }

  /**
   * 터치 종료 처리
   */
  handleTouchEnd(e) {
    if (!this.isSwipeStarted || !this.isSwipeAreaActive()) return;

    e.preventDefault();
    e.stopPropagation();

    const touch = e.changedTouches[0];
    this.endX = touch.clientX;
    this.endY = touch.clientY;
    this.isSwipeStarted = false;

    this.debug('Touch end:', this.endX, this.endY);
    this.processSwipe();
  }

  /**
   * 터치 취소 처리
   */
  handleTouchCancel() {
    this.isSwipeStarted = false;
  }

  /**
   * 마우스 다운 처리 (데스크톱 테스트용)
   */
  handleMouseDown(e) {
    if (!this.isSwipeAreaActive()) return;

    this.startX = e.clientX;
    this.startY = e.clientY;
    this.isSwipeStarted = true;
  }

  /**
   * 마우스 업 처리 (데스크톱 테스트용)
   */
  handleMouseUp(e) {
    if (!this.isSwipeStarted || !this.isSwipeAreaActive()) return;

    this.endX = e.clientX;
    this.endY = e.clientY;
    this.isSwipeStarted = false;
    this.processSwipe();
  }

  /**
   * 스와이프 영역이 활성화되어 있는지 확인
   */
  isSwipeAreaActive() {
    return this.swipeArea && this.swipeArea.classList.contains('active');
  }

  /**
   * 스와이프 처리
   */
  processSwipe() {
    const deltaX = this.endX - this.startX;
    const deltaY = this.endY - this.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    this.debug('Swipe delta:', deltaX, deltaY);

    // 최소 거리 체크
    if (Math.max(absDeltaX, absDeltaY) < this.minSwipeDistance) {
      this.debug('Swipe too short');
      return;
    }

    const action = this.determineSwipeAction(deltaX, deltaY, absDeltaX, absDeltaY);
    
    if (action) {
      this.debug('Swipe action:', action);
      this.executeGameAction(action);
    }
  }

  /**
   * 스와이프 방향 결정
   */
  determineSwipeAction(deltaX, deltaY, absDeltaX, absDeltaY) {
    // 수직 스와이프가 수평 스와이프보다 큰 경우
    if (absDeltaY > absDeltaX) {
      return deltaY < 0 ? 'space' : null; // 위로 스와이프만 유효
    } else {
      // 수평 스와이프
      return deltaX < 0 ? 'left' : 'right';
    }
  }

  /**
   * 게임 액션 실행
   */
  executeGameAction(action) {
    if (typeof checkAnswer === 'function' && window.gameScene) {
      checkAnswer(action, window.gameScene);
    }
  }

  /**
   * 디버깅 로그 출력
   */
  debug(...args) {
    if (this.isDebugMode) {
      console.log('[SwipeController]', ...args);
    }
  }

  /**
   * 디버깅 모드 토글
   */
  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode;
    console.log(`Swipe debug mode: ${this.isDebugMode ? 'ON' : 'OFF'}`);
  }
}

// 전역 스와이프 컨트롤러 인스턴스
let swipeController;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
  swipeController = new SwipeController();
});
