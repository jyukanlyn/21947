import { scenario } from "../data/scenario.js";
import { characters } from "../data/characters.js";
import { state } from "./state.js";

// 1. 確保 DOM 載入後再執行，避免抓不到元素
document.addEventListener("DOMContentLoaded", () => {
    initGame();
});

// DOM 元素快取
const ui = {
    namePlate: document.getElementById("name-plate"),
    textBox: document.getElementById("dialogue-text"),
    avatarLeft: document.getElementById("avatar-left"),
    avatarRight: document.getElementById("avatar-right"),
    gameScreen: document.getElementById("game-screen"),
    chapterBtn: document.getElementById("chapter-btn"),
    chapterMenu: document.getElementById("chapter-menu"),
    bgContainer: document.body // 假設背景是換 body 或特定 div，請依需求調整
};

// --- 初始化 ---
function initGame() {
    // 綁定主畫面點擊事件
    ui.gameScreen.addEventListener("click", nextStep);
    
    // 綁定章節按鈕
    setupChapterMenu();

    // 2. 自動執行第一步，或是渲染初始狀態
    // 如果 state.index 是 0，我們需要手動渲染第一幀，或者直接呼叫 nextStep()
    if (state.index === 0 && scenario.length > 0) {
        // 這裡選擇直接執行一次 nextStep 來顯示開頭
        nextStep(); 
    } else {
        // 如果是讀取存檔 (index > 0)，則渲染當前進度
        render(scenario[state.index - 1] || scenario[0]);
    }
}

// --- 核心邏輯 ---

function nextStep() {
    // 檢查是否結束
    if (state.index >= scenario.length) {
        console.log("劇本結束");
        return;
    }

    const step = scenario[state.index];
    
    // 更新索引 (先取出 step 再 +1，確保邏輯清晰)
    state.index++;

    render(step);
}

function render(step) {
    if (!step) return;

    // 3. 修正：背景切換不應該阻擋文字顯示
    // 舊程式碼有 return，導致有背景的那一步會看不到字
    if (step.bg) {
        changeBackground(step.bg);
        // 移除這裡的 return，讓程式繼續往下執行顯示文字
    }

    // 更新文字
    ui.namePlate.textContent = step.speaker === "Narrator" ? "" : step.speaker;
    ui.textBox.textContent = step.text;

    // 更新立繪
    updateCharacters(step);
}

// 假設的背景切換函數 (您的原代碼中未定義，需補上避免報錯)
function changeBackground(bgImage) {
    // 範例實作
    if(ui.gameScreen) {
        ui.gameScreen.style.backgroundImage = `url('${bgImage}')`;
    }
}

function updateCharacters(step) {
    resetAvatars();

    if (step.speaker === "Narrator") {
        dimAll();
        return;
    }

    const char = characters[step.speaker];
    
    // 安全檢查：確保角色和 sprites 存在
    if (!char || !char.sprites) return;

    const target = char.side === "left" ? ui.avatarLeft : ui.avatarRight;
    
    // 使用預設值避免 undefined
    const emotion = step.emotion || "normal";
    if (char.sprites[emotion]) {
        target.src = char.sprites[emotion];
        target.classList.add("active");
        target.classList.remove("inactive"); // 確保移除暗淡效果
    }

    dimOther(char.side);
}

// --- 輔助 UI 函數 ---

function resetAvatars() {
    [ui.avatarLeft, ui.avatarRight].forEach(a => {
        // 保持原有的 side class，只重置狀態
        const side = a.classList.contains("left") ? "left" : "right";
        a.className = `avatar ${side}`; // 重置 class string
    });
}

function dimOther(activeSide) {
    if (activeSide === "left") ui.avatarRight.classList.add("inactive");
    if (activeSide === "right") ui.avatarLeft.classList.add("inactive");
}

function dimAll() {
    ui.avatarLeft.classList.add("inactive");
    ui.avatarRight.classList.add("inactive");
}

// --- 章節系統 ---

function setupChapterMenu() {
    // 產生章節列表
    const chapters = scenario
        .map((step, index) => step.chapter ? { title: step.chapter, index } : null)
        .filter(Boolean);

    ui.chapterBtn.addEventListener("click", e => {
        e.stopPropagation(); // 防止點擊按鈕觸發 nextStep
        openChapterMenu(chapters);
    });

    ui.chapterMenu.addEventListener("click", () => {
        ui.chapterMenu.hidden = true;
    });
}

function openChapterMenu(chapters) {
    ui.chapterMenu.innerHTML = "<h2>章節選擇</h2>";

    chapters.forEach(ch => {
        const div = document.createElement("div");
        div.className = "chapter-item";
        div.textContent = ch.title;
        
        // 點擊章節
        div.onclick = (e) => {
            e.stopPropagation(); // 防止冒泡
            jumpToChapter(ch.index);
        };
        
        ui.chapterMenu.appendChild(div);
    });

    ui.chapterMenu.hidden = false;
}

function jumpToChapter(index) {
    state.index = index;
    ui.chapterMenu.hidden = true;
    
    // 跳轉後不需要使用者點擊，直接渲染該行
    // 注意：因為 nextStep 會 index++，所以這裡直接呼叫 nextStep 即可
    nextStep();
}
