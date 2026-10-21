
"use strict";

// ========================================
// 1. HTML要素を取得
// ========================================

const canvas = document.getElementById("artCanvas");
const status = document.getElementById("status");
const startButton = document.getElementById("startButton");
const clearButton = document.getElementById("clearButton");

const ctx = canvas?.getContext("2d");

// 必須要素が取得できなければ、ここで原因を表示する
const missingElements = [];

if (!canvas) missingElements.push("#artCanvas");
if (!status) missingElements.push("#status");
if (!startButton) missingElements.push("#startButton");
if (!clearButton) missingElements.push("#clearButton");
if (!ctx) missingElements.push("Canvas 2D context");

if (missingElements.length > 0) {
    console.error(
        "OTOIRO：HTML要素が見つかりません:",
        missingElements.join(", ")
    );
    throw new Error("HTMLのIDとJavaScriptを確認してください");
}

// ========================================
// 2. 状態を管理
// ========================================

let isStarted = false;

// pointerIdごとに、各指の座標と色を記録する
const activeTouches = new Map();

const colors = ["#52e5ff", "#ff6bd6", "#ffe66d"];

// 音声の状態を保存する
const audioState = {
    context: null
};

// 関数を短く呼び出せるようにする
const fn = window.OTOIROFunctions;

if (!fn) {
    throw new Error("functions.jsが読み込まれていません");
}

// ========================================
// 3. キャンバスの準備
// ========================================

function resizeCanvas() {
    fn.resizeCanvas(canvas, ctx);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ========================================
// 4. 開始ボタン
// ========================================

function startInteraction() {
    if (isStarted) return;

    isStarted = true;
    status.textContent = "画面に触れて始めよう";

    startButton.textContent = "操作中";
    startButton.disabled = true;

    console.log("OTOIRO：操作を開始しました");
}

startButton.addEventListener("click", startInteraction);

// ========================================
// 5. 指が触れたとき
// ========================================

canvas.addEventListener("pointerdown", (event) => {
    console.log("pointerdown:", event.pointerType, event.pointerId);

    if (!isStarted) {
        status.textContent = "先に開始ボタンを押してください";
        return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
        return;
    }

    event.preventDefault();

    const pos = fn.getPosition(event, canvas);
    const color = colors[activeTouches.size % colors.length];

    activeTouches.set(event.pointerId, {
        x: pos.x,
        y: pos.y,
        color: color
    });

    // キャンバスの外へ指が動いても追跡する
    canvas.setPointerCapture(event.pointerId);

    fn.drawRipple(ctx, pos.x, pos.y, color);

    const count = activeTouches.size;
    fn.updateStatus(status, count);
    fn.playSound(audioState, count);
});

// ========================================
// 6. 指が動いたとき
// ========================================

canvas.addEventListener("pointermove", (event) => {
    const touch = activeTouches.get(event.pointerId);

    // 追跡していない指なら何もしない
    if (!touch) return;

    event.preventDefault();

    const pos = fn.getPosition(event, canvas);

    ctx.beginPath();
    ctx.moveTo(touch.x, touch.y);
    ctx.lineTo(pos.x, pos.y);

    ctx.strokeStyle = touch.color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    // 次の描画に備えて座標を更新
    touch.x = pos.x;
    touch.y = pos.y;
});

// ========================================
// 7. 指を離したとき
// ========================================

function endTouch(event) {
    if (!activeTouches.has(event.pointerId)) return;

    activeTouches.delete(event.pointerId);
    fn.updateStatus(status, activeTouches.size);

    console.log("指を離しました。残り:", activeTouches.size);
}

canvas.addEventListener("pointerup", endTouch);
canvas.addEventListener("pointercancel", endTouch);

// ========================================
// 8. リセットボタン
// ========================================

clearButton.addEventListener("click", () => {
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);

    status.textContent = "画面をリセットしました";
    console.log("OTOIRO：画面をリセットしました");
});

console.log("OTOIRO：JavaScriptの読み込み完了");
