  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#d0e0f0',
    physics: {
      default: 'arcade'
    },
    parent: 'gameContainer', // HTML의 gameContainer div에 게임을 렌더링
    scene: {
      preload,
      create,
    }
  };

  let player;
  let promptImages = []; // 여러 개의 prompt 이미지 배열
  let promptQueue = []; // 미리 생성된 문제 큐
  let currentAnswer;
  let score = 0;
  let scoreText;
  let feedbackText;

  // 타이머 관련 변수
  let timeLeft = 60; // 60초
  let timerText;
  let gameTimer;
  let gameEnded = false;

  const leftGroup = ['obj1', 'obj3'];
  const rightGroup = ['obj2', 'obj4'];

  // 구역에 쌓일 이미지 카운트 (Y 위치 계산용)
  let leftStackCount = 0;
  let rightStackCount = 0;

  // 각 구역의 쌓인 이미지들을 저장하는 배열
  let leftStackImages = [];
  let rightStackImages = [];

  let game; // 게임 인스턴스를 저장할 변수

  // 게임 초기화 함수
  function initializeGame() {
    // 기존 게임이 있다면 제거
    if (game) {
      game.destroy(true);
    }
    
    // 변수들 초기화
    promptImages = [];
    promptQueue = [];
    score = 0;
    timeLeft = 60;
    gameEnded = false;
    leftStackCount = 0;
    rightStackCount = 0;
    leftStackImages = [];
    rightStackImages = [];
    
    // 새 게임 생성
    game = new Phaser.Game(config);
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
    // 배경 이미지 추가 (가장 먼저)
    const background = this.add.image(400, 300, 'background');
    background.setDisplaySize(800, 600); // 화면 크기에 맞게 조정

    // 상단 그룹 표시
    leftGroup.forEach((key, index) => {
      this.add.image(100 + index * 60, 50, key);
    });

    rightGroup.forEach((key, index) => {
      this.add.image(650 + index * 60, 50, key);
    });

    // 중앙 player
    player = this.add.image(400, 500, 'player');

    // 미리 생성된 문제 큐 초기화
    generatePromptQueue();

    // 판단 대상 이미지들 (6개)
    for (let i = 0; i < 6; i++) {
      const image = this.add.image(400, 450 - i * 30, promptQueue[i].key);
      image.setScale(1.0 - i * 0.1); // 첫번째가 가장 크고(1.0) 위로 갈수록 작아짐
      image.setAlpha(1 - i * 0.1); // 위로 갈수록 투명하게
      promptImages.push(image);
    }

    currentAnswer = promptQueue[0].answer;

    // 점수 텍스트 (상단 중앙)
    scoreText = this.add.text(400, 10, 'Score: 0', {
      fontSize: '24px',
      fill: '#000'
    }).setOrigin(0.5, 0);

    // 타이머 텍스트 (상단 중앙, 점수 아래)
    timerText = this.add.text(400, 40, 'Time: 60', {
      fontSize: '24px',
      fill: '#ff0000'
    }).setOrigin(0.5, 0);

    // 피드백 텍스트
    feedbackText = this.add.text(400, 300, '', {
      fontSize: '48px',
      fill: '#000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 타이머 시작
    startTimer(this);

    // 키 입력 처리
    this.input.keyboard.on('keydown-LEFT', () => {
      checkAnswer('left', this);
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      checkAnswer('right', this);
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      checkAnswer('space', this);
    });
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
    // 첫 번째 문제를 처리했으므로 큐에서 제거
    promptQueue.shift();
    
    // 새로운 문제 하나 추가
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
    // 게임이 끝났으면 입력 무시
    if (gameEnded) return;

    if (direction === currentAnswer) {
      score += 1;
      feedbackText.setText('+1');
      feedbackText.setColor('#008800');

      // fakeObj가 아닌 경우에만 해당 구역에 캐릭터 쌓기
      if (currentAnswer !== 'space') {
        animateToStack(direction, scene);
      }

      setTimeout(() => {
        if (!gameEnded) setNewPrompt();
      }, 200);

    } else {
      score -= 2;
      // 점수가 0보다 적어지지 않도록 제한
      if (score < 0) score = 0;
      
      feedbackText.setText('-2');
      feedbackText.setColor('#cc0000');
      
      // 오답일 때도 바로 다음 문제로 넘어감
      setTimeout(() => {
        if (!gameEnded) {
          feedbackText.setText('');
          setNewPrompt();
        }
      }, 200);
    }

    scoreText.setText('Score: ' + score);
  }

  function animateToStack(direction, scene) {
    const key = promptQueue[0].key;
    let targetX, targetY;
    
    if (direction === 'left') {
      targetX = 100;
      targetY = 580 - (leftStackCount * 35); // 더 아래에서 시작하고 간격 증가
    } else {
      targetX = 700;
      targetY = 580 - (rightStackCount * 35); // 더 아래에서 시작하고 간격 증가
    }
    
    const animImage = scene.add.image(400, 450, key);
    animImage.setScale(1.0);
    
    scene.tweens.add({
      targets: animImage,
      x: targetX,
      y: targetY,
      scaleX: 0.7, // 쌓인 이미지를 더 작게
      scaleY: 0.7,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        const stackedImage = scene.add.image(targetX, targetY, key);
        stackedImage.setScale(0.7); // 쌓인 이미지를 더 작게
        
        if (direction === 'left') {
          leftStackImages.push(stackedImage);
          leftStackCount++;
        } else {
          rightStackImages.push(stackedImage);
          rightStackCount++;
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
        
        // 시간이 10초 이하일 때 빨간색으로 깜박임
        if (timeLeft <= 10) {
          timerText.setColor('#ff0000');
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
      repeat: 59 // 60번 반복 (0초까지)
    });
  }

  function endGame() {
    gameEnded = true;
    
    // 타이머 정지
    if (gameTimer) {
      gameTimer.remove();
    }
    
    // 게임 종료 메시지
    feedbackText.setText('게임 종료!\n최종 점수: ' + score);
    feedbackText.setColor('#ff6600');
    feedbackText.setFontSize('36px');
    
    // 모든 애니메이션 정지
    promptImages.forEach(img => {
      img.setAlpha(0.3);
    });
  }