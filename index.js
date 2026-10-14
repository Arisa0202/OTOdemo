
const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

// 同時に触れている指を管理する
// pointerId が指ごとの識別番号になる
const activeTouches = new Map();

const colors = [
  "#52e5ff",
  "#ff6bd6",
  "#ffe66d"
];

let audioContext = null;

// キャンバスの大きさを画面に合わせる
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  // 描画座標をCSS上のピクセルに合わせる
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// タッチ座標をキャンバス内の座標に変換する
function getPosition(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

// ブラウザの音声機能を準備する
function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

// 指の本数によって音を変える
function playSound(fingerCount) {
  const audio = getAudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  const frequencies = {
    1: 440,
    2: 554,
    3: 659
  };

  oscillator.type = "sine";
  oscillator.frequency.value =
    frequencies[Math.min(fingerCount, 3)] || 440;

  gain.gain.setValueAtTime(
    0.12,
    audio.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audio.currentTime + 0.25
  );

  oscillator.connect(gain);
  gain.connect(audio.destination);

  oscillator.start();
  oscillator.stop(audio.currentTime + 0.25);
}

// タップ位置に波紋を描く
function drawRipple(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

// 指が触れたとき
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();

  // マウスの右クリックなどは無視する
  if (event.pointerType === "mouse" &&
    event.button !== 0) {
    return;
  }

  const pos = getPosition(event);
  const color = colors[
    activeTouches.size % colors.length
  ];

  activeTouches.set(event.pointerId, {
    x: pos.x,
    y: pos.y,
    color: color
  });

  // 指がキャンバスの外に移動しても追跡する
  canvas.setPointerCapture(event.pointerId);

  drawRipple(pos.x, pos.y, color);

  const count = activeTouches.size;
  status.textContent = `${count}本の指で操作中`;

  playSound(count);
});

// 指を動かしたとき
canvas.addEventListener("pointermove", (event) => {
  const touch = activeTouches.get(event.pointerId);

  if (!touch) return;

  const pos = getPosition(event);

  ctx.beginPath();
  ctx.moveTo(touch.x, touch.y);
  ctx.lineTo(pos.x, pos.y);

  ctx.strokeStyle = touch.color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  // 次の描画のため、現在位置を保存する
  touch.x = pos.x;
  touch.y = pos.y;
});

// 指を離したとき
function endTouch(event) {
  activeTouches.delete(event.pointerId);

  if (activeTouches.size === 0) {
    status.textContent = "画面に触れて始めよう";
  } else {
    status.textContent =
      `${activeTouches.size}本の指で操作中`;
  }
}

canvas.addEventListener("pointerup", endTouch);
canvas.addEventListener("pointercancel", endTouch);

// リセットボタン
document.getElementById("clearButton")
  .addEventListener("click", () => {
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);
    status.textContent = "画面をリセットしました";
  });
