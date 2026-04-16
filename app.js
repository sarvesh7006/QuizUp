document.addEventListener('DOMContentLoaded', () => {

// ===== STATE =====
let state = {
  category: null,
  questionIndex: 0,
  playerScore: 0,
  opponentScore: 0,
  timer: null,
  timeLeft: 10,
  answered: false,
  opponentName: '',
  totalQuestions: 10,
  correctCount: 0,
  wrongCount: 0,
  currentQuestions: []
};

const opponentNames = ['CerealChamp', 'StarQuizzer', 'BrainStorm', 'QuizMaster', 'NerdBot', 'Trivia_X'];

// ===== DOM REFS =====
const screens = {
  home: document.getElementById('home-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen')
};

// ===== SCREEN MANAGER =====
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ===== CATEGORY CARDS =====
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.cat-card').forEach(c => c.style.outline = '');
    card.style.outline = '3px solid #1A1A1A';
    state.category = card.dataset.cat;
  });
});

// ===== START BUTTON =====
document.getElementById('start-btn').addEventListener('click', () => {
  if (!state.category) {
    // Pick first category if none selected
    state.category = 'movies';
    document.querySelector('.cat-card.movies').style.outline = '3px solid #1A1A1A';
  }
  startGame();
});

// ===== SHUFFLE =====
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ===== START GAME =====
function startGame() {
  const pool = questions[state.category];
  state.currentQuestions = shuffle(pool).slice(0, state.totalQuestions);
  state.questionIndex = 0;
  state.playerScore = 0;
  state.opponentScore = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.opponentName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
  state.answered = false;

  // Set opponent name in UI
  document.getElementById('opp-label').textContent = state.opponentName;

  updateScoreUI();
  showScreen('game');
  loadQuestion();
}

// ===== LOAD QUESTION =====
function loadQuestion() {
  const q = state.currentQuestions[state.questionIndex];
  state.answered = false;
  state.timeLeft = 10;

  // Meta
  document.getElementById('q-meta').textContent =
    `Question ${state.questionIndex + 1} / ${state.totalQuestions}`;

  // Text
  document.getElementById('q-text').textContent = q.question;

  // Options
  const shuffledOptions = shuffle(q.options);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.textContent = shuffledOptions[i];
    btn.className = 'option-btn';
    btn.disabled = false;
    btn.dataset.answer = shuffledOptions[i];
    btn.onclick = () => handleAnswer(btn, q.answer);
  });

  // Progress bars
  updateProgressBars();

  // Timer
  startTimer();
}

// ===== HANDLE ANSWER =====
function handleAnswer(selectedBtn, correctAnswer) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timer);

  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(btn => btn.disabled = true);

  const isCorrect = selectedBtn.dataset.answer === correctAnswer;

  if (isCorrect) {
    selectedBtn.classList.add('correct');
    const bonus = Math.ceil(state.timeLeft / 10 * 50);
    state.playerScore += 50 + bonus;
    state.correctCount++;
  } else {
    selectedBtn.classList.add('wrong');
    state.wrongCount++;
    // Reveal correct answer
    btns.forEach(btn => {
      if (btn.dataset.answer === correctAnswer) btn.classList.add('correct');
    });
  }

  // Opponent logic
  const oppRoll = Math.random();
  if (oppRoll > 0.35) { // ~65% chance opponent gets it
    state.opponentScore += Math.floor(Math.random() * 45) + 15;
  }

  updateScoreUI();

  setTimeout(() => nextQuestion(), 1200);
}

// ===== TIMER =====
function startTimer() {
  const fill = document.querySelector('.timer-ring .fill');
  const circumference = 220;
  const numEl = document.getElementById('timer-num');
  fill.style.strokeDashoffset = 0;
  fill.style.stroke = '#E84A10';

  state.timer = setInterval(() => {
    state.timeLeft--;
    numEl.textContent = String(state.timeLeft).padStart(2, '0') + 's';

    const progress = state.timeLeft / 10;
    fill.style.strokeDashoffset = circumference * (1 - progress);

    if (state.timeLeft <= 3) fill.style.stroke = '#E53935';
    else if (state.timeLeft <= 6) fill.style.stroke = '#FF8C00';

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      if (!state.answered) timeOut();
    }
  }, 1000);
}

function timeOut() {
  state.answered = true;
  state.wrongCount++;
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(btn => btn.disabled = true);

  const q = state.currentQuestions[state.questionIndex];
  btns.forEach(btn => {
    if (btn.dataset.answer === q.answer) btn.classList.add('correct');
  });

  state.opponentScore += Math.floor(Math.random() * 50) + 20;
  updateScoreUI();

  setTimeout(() => nextQuestion(), 1200);
}

// ===== NEXT QUESTION =====
function nextQuestion() {
  state.questionIndex++;
  if (state.questionIndex >= state.totalQuestions) {
    endGame();
  } else {
    loadQuestion();
  }
}

// ===== SCORE UI =====
function updateScoreUI() {
  document.getElementById('you-score').textContent = `You: ${state.playerScore}`;
  document.getElementById('opp-score').textContent = `${state.opponentName}: ${state.opponentScore}`;
  updateProgressBars();
}

function updateProgressBars() {
  const total = state.totalQuestions;
  const youPct = ((state.questionIndex) / total) * 100;
  const maxPossibleOpp = state.totalQuestions * 100;
  const oppPct = Math.min((state.opponentScore / maxPossibleOpp) * 100, 95);
  document.getElementById('you-bar').style.width = youPct + '%';
  document.getElementById('opp-bar').style.width = oppPct + '%';
}

// ===== END GAME =====
function endGame() {
  clearInterval(state.timer);
  const win = state.playerScore > state.opponentScore;
  const draw = state.playerScore === state.opponentScore;

  // Title
  let titleText = win ? '🎉 YOU WIN!' : draw ? '🤝 DRAW!' : '😢 YOU LOSE!';
  document.getElementById('result-title').textContent = titleText;

  // Scores
  document.getElementById('final-you-score').textContent = state.playerScore;
  document.getElementById('final-opp-score').textContent = state.opponentScore;
  document.getElementById('result-opp-name').textContent = state.opponentName;

  // Correct/incorrect
  document.getElementById('accuracy-text').textContent =
    `${state.correctCount} Correct / ${state.wrongCount} Incorrect`;

  // High score
  const stored = parseInt(localStorage.getItem('quizup_highscore') || '0');
  const newHigh = Math.max(stored, state.playerScore);
  localStorage.setItem('quizup_highscore', newHigh);
  document.getElementById('highscore-val').textContent = `HIGH SCORE: ${newHigh}`;
  document.getElementById('highscore-note').textContent =
    state.playerScore > stored ? '🎊 New record!' : '(Saved from localStorage)';

  showScreen('result');
  if (win) launchConfetti();
}

// ===== CONFETTI =====
function launchConfetti() {
  const colors = ['#FFD60A', '#FF6B6B', '#60C8F5', '#A8EFD4', '#FFB8D4', '#E84A10'];
  const container = document.querySelector('.confetti-container');
  container.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      top: 0;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      width: ${6 + Math.random() * 10}px;
      height: ${6 + Math.random() * 10}px;
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.8}s;
    `;
    container.appendChild(piece);
  }
  setTimeout(() => container.innerHTML = '', 4000);
}

// ===== RESULT BUTTONS =====
document.getElementById('play-again-btn').addEventListener('click', () => {
  startGame();
});

document.getElementById('change-cat-btn').addEventListener('click', () => {
  clearInterval(state.timer);
  state.category = null;
  document.querySelectorAll('.cat-card').forEach(c => c.style.outline = '');
  showScreen('home');
});

// ===== INIT =====
showScreen('home');

});
