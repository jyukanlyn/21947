import { scenario } from "../data/scenario.js";
import { characters } from "../data/characters.js";
// 重要：必須引入 backgrounds 才能讀取圖片路徑
import { state, backgrounds } from "./state.js";

// 等待 HTML 載入完成後執行
document.addEventListener("DOMContentLoaded", () => {
    console.log("引擎載入中..."); // Debug 訊息
    initGame();
});

// UI 元素快取 (對應 index.html 的 ID)
const ui = {
    namePlate: document.getElementById("name-plate"),
    textBox: document.getElementById("dialogue-text"),
    avatarLeft: document.getElementById("avatar-left"),
    avatarRight: document.getElementById("avatar-right"),
    gameScreen: document.getElementById("game-screen"),
    chapterBtn: document.getElementById("chapter-btn"),
    chapterMenu: document.getElementById("chapter-menu"),
    // 👇 新增：歷史紀錄與上一頁相關按鈕
    logBtn: document.getElementById("log-btn"),
    logWindow: document.getElementById("log-window"),
    logContent: document.getElementById("log-content"),
    closeLogBtn: document.getElementById("close-log-btn"),
    backBtn: document.getElementById("back-btn"),
};

// --- 初始化系統 ---
function initGame() {
    if (!ui.gameScreen) {
        console.error("錯誤：找不到 id='game-screen' 的元素！請檢查 index.html");
        return;
    }

    console.log("初始化完成，綁定點擊事件");

    ui.gameScreen.addEventListener("click", nextStep);
    setupChapterMenu();

    // 👇 新增按鈕事件綁定 (紀錄 & 上一頁)
    if (ui.logBtn) ui.logBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        showLog();
    });

    if (ui.closeLogBtn) ui.closeLogBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        ui.logWindow.hidden = true;
    });

    if (ui.backBtn) ui.backBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        prevStep();
    });

    // 初始渲染
    if (state.index === 0 && scenario.length > 0) {
        nextStep(); 
    } else {
        render(scenario[state.index - 1] || scenario[0]);
    }
}

// --- 核心運作邏輯 ---

// 設定：大約多少字換一頁？
const CHAR_LIMIT = 80; 

function nextStep() {
    // 1. 【檢查佇列】優先處理還沒講完的話 (Smart Cut)
    if (state.textQueue && state.textQueue.length > 0) {
        const nextChunk = state.textQueue.shift();
        ui.textBox.textContent = nextChunk;
        console.log("顯示剩餘文字:", nextChunk);
        return; 
    }

    // 2. 檢查劇本是否結束
    if (state.index >= scenario.length) {
        console.log("劇本已結束");
        return;
    }

    // --- 💾 3. 存入歷史紀錄 ---
    if (state.index > 0) {
        const currentStep = scenario[state.index - 1]; 
        const lastLog = state.history[state.history.length - 1];
        if (!lastLog || lastLog.index !== state.index - 1) {
             state.history.push({
                index: state.index - 1,
                speaker: currentStep.speaker || "",
                text: currentStep.text || ""
            });
        }
    }

    // 4. 取得新的步驟
    let step = { ...scenario[state.index] }; 
    state.index++;
    state.textQueue = []; // 清空舊的文字佇列

    // 5. 【✨ 聰明換頁邏輯：字數限制 + 找句號】
    if (step.text && step.text.length > CHAR_LIMIT) {
        const fullText = step.text;
        const chunks = [];
        let remaining = fullText;

        while (remaining.length > 0) {
            // 如果剩下的字少於限制，直接全部塞進去
            if (remaining.length <= CHAR_LIMIT) {
                chunks.push(remaining);
                break;
            }

            // --- 尋找最佳切割點 ---
            // 先取出前 CHAR_LIMIT 個字
            let chunkAttempt = remaining.substring(0, CHAR_LIMIT);
