/**
 * UI Controller - 화면 전환 및 사용자 인터페이스 관리
 */
class UIController {
  constructor() {
    this.elements = {
      startScreen: document.getElementById('startScreen'),
      gameContainer: document.getElementById('gameContainer'),
      endScreen: document.getElementById('endScreen'),
      swipeArea: document.getElementById('swipeArea'),
      finalScoreText: document.getElementById('finalScoreText'),
      scoreMessage: document.getElementById('scoreMessage')
    };
    
    this.scoreMessages = {
      80: '🏆 완벽해요! 최고의 실력입니다!',
      60: '🎉 훌륭해요! 정말 잘했습니다!',
      40: '👍 좋아요! 더 연습하면 더 잘할 수 있어요!',
      20: '😊 괜찮아요! 다음엔 더 잘할 수 있을 거예요!',
      0: '💪 연습이 필요해요! 포기하지 말고 다시 도전해보세요!'
    };
  }

  /**
   * 게임 시작 화면 숨기고 게임 화면 표시
   */
  startGame() {
    this.hideScreen(this.elements.startScreen);
    this.hideScreen(this.elements.endScreen);
    this.showGameScreen();
    this.activateSwipeArea();
    
    if (typeof initializeGame === 'function') {
      initializeGame();
    }
  }

  /**
   * 게임 종료 화면 표시
   */
  showEndScreen(finalScore) {
    this.hideGameScreen();
    this.deactivateSwipeArea();
    this.updateScoreDisplay(finalScore);
    this.showScreen(this.elements.endScreen);
  }

  /**
   * 게임 재시작
   */
  restartGame() {
    this.hideScreen(this.elements.endScreen);
    this.showGameScreen();
    this.activateSwipeArea();
    
    if (typeof initializeGame === 'function') {
      initializeGame();
    }
  }

  /**
   * 홈 화면으로 돌아가기
   */
  goHome() {
    this.hideScreen(this.elements.endScreen);
    this.showScreen(this.elements.startScreen);
    this.deactivateSwipeArea();
  }

  /**
   * 화면 표시
   */
  showScreen(element) {
    element.style.display = 'flex';
    element.classList.add('active');
  }

  /**
   * 화면 숨기기
   */
  hideScreen(element) {
    element.style.display = 'none';
    element.classList.remove('active');
  }

  /**
   * 게임 화면 표시
   */
  showGameScreen() {
    this.elements.gameContainer.style.display = 'flex';
    this.elements.gameContainer.classList.add('active');
  }

  /**
   * 게임 화면 숨기기
   */
  hideGameScreen() {
    this.elements.gameContainer.classList.remove('active');
    this.elements.gameContainer.style.display = 'none';
  }

  /**
   * 스와이프 영역 활성화
   */
  activateSwipeArea() {
    this.elements.swipeArea.classList.add('active');
  }

  /**
   * 스와이프 영역 비활성화
   */
  deactivateSwipeArea() {
    this.elements.swipeArea.classList.remove('active');
  }

  /**
   * 점수 표시 업데이트
   */
  updateScoreDisplay(score) {
    this.elements.finalScoreText.textContent = `최종 점수: ${score}`;
    this.elements.scoreMessage.textContent = this.getScoreMessage(score);
  }

  /**
   * 점수에 따른 메시지 반환
   */
  getScoreMessage(score) {
    const thresholds = [50, 30, 15, 10, 0];
    const threshold = thresholds.find(t => score >= t);
    return this.scoreMessages[threshold];
  }
}

// 전역 UI 컨트롤러 인스턴스
const uiController = new UIController();

// 전역 함수들 (HTML에서 호출)
function startGame() {
  uiController.startGame();
}

function showEndScreen(finalScore) {
  uiController.showEndScreen(finalScore);
}

function restartGame() {
  uiController.restartGame();
}

function goHome() {
  uiController.goHome();
}
