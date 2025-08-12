const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#d0e0f0',
  physics: {
    default: 'arcade',
  },
  parent: 'gameContainer',
  scene: {
    preload,
    create,
  },
};

const colors = {
  red: '#cc0000',
  green: '#00cc00',
  blue: '#0000cc',
  black: '#000000'
};

let player;
let promptImages = []; // 여러 개의 prompt 이미지 배열
let promptQueue = []; // 미리 생성된 문제 큐
let currentAnswer;
let score = 0;
let scoreText;
let feedbackText;

// 타이머 관련 변수
let timeLeft = 60;
let timerText;
let gameTimer;
let gameEnded = false;

// 그룹은 게임 시작할 때마다 랜덤으로 정해짐
let leftGroup = [];
let rightGroup = [];

// 각 이미지 타입별 스택 카운트 (Y 위치 계산용)
let stackCounts = {
  left: {},
  right: {}
};

// 각 구역의 쌓인 이미지들을 저장하는 배열
let leftStackImages = [];
let rightStackImages = [];

let game; // 게임 인스턴스를 저장할 변수

// 게임 초기화 함수
function initializeGame() {
  if (game) {
    game.destroy(true);
  }
  
  // obj 그룹을 랜덤으로 배치
  randomizeGroups();
  
  // 변수들 초기화
  promptImages = [];
  promptQueue = [];
  score = 0;
  timeLeft = 60;
  gameEnded = false;
  initializeStackCounts();
  leftStackImages = [];
  rightStackImages = [];
  
  // 새 게임 생성
  game = new Phaser.Game(config);
}

// obj들을 랜덤으로 왼쪽/오른쪽 그룹에 배치
function randomizeGroups() {
  const allObjs = ['obj1', 'obj2', 'obj3', 'obj4'];
  const shuffled = Phaser.Utils.Array.Shuffle([...allObjs]);
  
  leftGroup = shuffled.slice(0, 2);
  rightGroup = shuffled.slice(2, 4);
}

// 스택 카운트 초기화 (동적으로 그룹에 맞게)
function initializeStackCounts() {
  stackCounts = {
    left: {},
    right: {}
  };
  
  leftGroup.forEach(obj => stackCounts.left[obj] = 0);
  rightGroup.forEach(obj => stackCounts.right[obj] = 0);
}

function preload() {
  this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
  this.load.image('obj1', 'assets/obj1.png');
  this.load.image('obj2', 'assets/obj2.png');
  this.load.image('obj3', 'assets/obj3.png');
  this.load.image('obj4', 'assets/obj4.png');
  this.load.image('fakeObj', 'assets/fakeObj.png');
  this.load.image('background', 'assets/background.jpg');
}

function create() {
  const background = this.add.image(400, 300, 'background');
  background.setDisplaySize(800, 600); // 화면 크기에 맞게 조정

  // 상단 그룹 표시
  leftGroup.forEach((key, index) => this.add.image(100 + index * 60, 50, key));
  rightGroup.forEach((key, index) => this.add.image(650 + index * 60, 50, key));

  // 중앙 player
  player = this.add.image(400, 500, 'player');

  // 미리 생성된 문제 큐 초기화
  generatePromptQueue();

  // 판단 대상 이미지들 (6개)
  for (let i = 0; i < 6; i++) {
    const image = this.add.image(400, 450 - i * 30, promptQueue[i].key);
    image.setScale(1.0 - i * 0.1).setAlpha(1 - i * 0.1);
    promptImages.push(image);
  }

  currentAnswer = promptQueue[0].answer;

  // 점수 텍스트 (상단 중앙)
  scoreText = this.add.text(400, 10, 'Score: 0', {
    fontSize: '24px',
    fill: colors.black
  }).setOrigin(0.5, 0);

  // 타이머 텍스트 (상단 중앙, 점수 아래)
  timerText = this.add.text(400, 40, 'Time: 60', {
    fontSize: '24px',
    fill: colors.red
  }).setOrigin(0.5, 0);

  // 피드백 텍스트
  feedbackText = this.add.text(400, 300, '', {
    fontSize: '48px',
    fill: colors.black,
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // 타이머 시작
  startTimer(this);

  // 키 입력 처리
  this.input.keyboard.on('keydown-LEFT', () => checkAnswer('left', this));
  this.input.keyboard.on('keydown-RIGHT', () => checkAnswer('right', this));
  this.input.keyboard.on('keydown-SPACE', () => checkAnswer('space', this));
}

function generatePromptQueue() {
  promptQueue = [];
  
  for (let i = 0; i < 6; i++) {
    const promptData = generateRandomPrompt();
    promptQueue.push(promptData);
  }
}

function generateRandomPrompt() {
  const allCharacters = [...leftGroup, ...rightGroup, 'fakeObj'];
  const selected = Phaser.Math.RND.pick(allCharacters);
  
  let answer;
  if (selected === 'fakeObj') {
    answer = 'space';
  } else {
    answer = leftGroup.includes(selected) ? 'left' : 'right';
  }
  
  return { key: selected, answer: answer };
}

function setNewPrompt() {
  promptQueue.shift(); // 큐에서 제거
  
  // 새로운 문제 추가
  const newPrompt = generateRandomPrompt();
  promptQueue.push(newPrompt);
  
  // 모든 이미지 업데이트
  for (let i = 0; i < promptImages.length; i++) {
    promptImages[i].setTexture(promptQueue[i].key);
  }
  
  currentAnswer = promptQueue[0].answer;
  feedbackText.setText('');
}

function checkAnswer(direction, scene) {
  if (gameEnded) return;

  if (direction === currentAnswer) {
    score += 1;
    feedbackText.setText('+1');
    feedbackText.setColor(colors.green);

    if (currentAnswer !== 'space') {
      animateToStack(direction, scene);
    }
  } else {
    score -= 2;
    if (score < 0) score = 0;
    
    feedbackText.setText('-2');
    feedbackText.setColor(colors.red);
  }

  setTimeout(() => {
    if (!gameEnded) setNewPrompt();
    scoreText.setText('Score: ' + score);
  }, 200);
}

function animateToStack(direction, scene) {
  const key = promptQueue[0].key;
  let targetX, targetY;
  
  if (direction === 'left') {
    const leftIndex = leftGroup.indexOf(key);
    targetX = 80 + leftIndex * 40; // 첫 번째는 80, 두 번째는 120
    targetY = 580 - (stackCounts.left[key] * 15);
    stackCounts.left[key]++;
  } else {
    const rightIndex = rightGroup.indexOf(key);
    targetX = 680 + rightIndex * 40; // 첫 번째는 680, 두 번째는 720
    targetY = 580 - (stackCounts.right[key] * 15);
    stackCounts.right[key]++;
  }
  
  const animImage = scene.add.image(400, 450, key);
  animImage.setScale(1.0);
  
  scene.tweens.add({
    targets: animImage,
    x: targetX,
    y: targetY,
    scaleX: 0.5,
    scaleY: 0.5,
    duration: 400,
    ease: 'Power2',
    onComplete: () => {
      const stackedImage = scene.add.image(targetX, targetY, key);
      stackedImage.setScale(0.5);
      
      if (direction === 'left') {
        leftStackImages.push(stackedImage);
      } else {
        rightStackImages.push(stackedImage);
      }
      
      animImage.destroy();
    }
  });
}

function startTimer(scene) {
  gameTimer = scene.time.addEvent({
    delay: 1000, // 1초마다
    callback: () => {
      timeLeft--;
      timerText.setText('Time: ' + timeLeft);
      
      if (timeLeft <= 10) { // 10초 아래일 때 깜빡임
        scene.tweens.add({
          targets: timerText,
          alpha: 0.3,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        });
      }
      
      // 시간 종료
      if (timeLeft <= 0) {
        endGame();
      }
    },
    repeat: 59
  });
}

function endGame() {
  gameEnded = true;
  
  // 타이머 정지
  if (gameTimer) {
    gameTimer.remove();
  }
  
  // HTML 종료 화면으로 전환
  setTimeout(() => {
    showEndScreen(score);
  }, 500);
}