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
};

// --- 初始化系統 ---
function initGame() {
    // 檢查有沒有抓到 game-screen
    if (!ui.gameScreen) {
        console.error("錯誤：找不到 id='game-screen' 的元素！請檢查 index.html");
        return;
    }

    console.log("初始化完成，綁定點擊事件");

    // 綁定點擊事件 (點擊畫面下一句)
    ui.gameScreen.addEventListener("click", nextStep);
    
    // 綁定章節選單事件
    setupChapterMenu();

    // 初始渲染
    // 如果是從頭開始 (index=0)，且有劇本，就自動執行第一步
    if (state.index === 0 && scenario.length > 0) {
        nextStep(); 
    } else {
        // 如果是讀取進度，就渲染當前那一格
        render(scenario[state.index - 1] || scenario[0]);
    }
}

// --- 核心運作邏輯 ---

function nextStep() {
    // 檢查劇本是否結束
    if (state.index >= scenario.length) {
        console.log("劇本已結束");
        return;
    }

    // 取得當前步驟資料
    const step = scenario[state.index];
    
    // 索引 +1 (指向下一步)
    state.index++;

    // 執行渲染
    console.log(`執行步驟 ${state.index}:`, step); // Debug 顯示目前執行哪一步
    render(step);
}

function render(step) {
    if (!step) return;

    // 1. 背景處理
    if (step.bg) {
        changeBackground(step.bg);
    }

    // 2. 文字處理
    // 如果是旁白(Narrator)或沒寫名字，名字欄留空
    const speakerName = (step.speaker === "Narrator" || !step.speaker) ? "" : step.speaker;
    
    if (ui.namePlate) ui.namePlate.textContent = speakerName;
    if (ui.textBox) ui.textBox.textContent = step.text || "";

    // 3. 立繪處理
    updateCharacters(step);
}

function changeBackground(bgID) {
    // 從 state.js 的 backgrounds 列表中查找路徑
    const bgPath = backgrounds[bgID];

    if (bgPath) {
        // 設定背景圖片
        ui.gameScreen.style.backgroundImage = `url('${bgPath}')`;
        ui.gameScreen.style.backgroundSize = "cover";     // 填滿
        ui.gameScreen.style.backgroundPosition = "center"; // 置中
        console.log(`背景切換為: ${bgID} (${bgPath})`);
    } else {
        console.warn(`警告：在 state.js 中找不到背景代號 '${bgID}'`);
    }
}

function updateCharacters(step) {
    resetAvatars();

    // 如果是旁白說話，通常將角色變暗或維持原狀 (這邊設定為變暗)
    if (step.speaker === "Narrator") {
        dimAll();
        return;
    }

    const char = characters[step.speaker];
    
    // 如果找不到角色資料 (例如只有名字但沒有立繪設定)，就跳過
    if (!char || !char.sprites) return;

    // 判斷角色在左邊還是右邊
    const target = char.side === "left" ? ui.avatarLeft : ui.avatarRight;
    
    // 取得表情，預設為 normal
    const emotion = step.emotion || "normal";
    
    if (target && char.sprites[emotion]) {
        target.src = char.sprites[emotion]; // 設定圖片路徑
        target.classList.add("active");     // 亮起
        target.classList.remove("inactive");
    }

    // 將另一邊的角色變暗
    dimOther(char.side);
}

// --- 輔助功能 ---

function resetAvatars() {
    // 重置 class，只保留基本的 avatar left/right
    if (ui.avatarLeft) ui.avatarLeft.className = "avatar left";
    if (ui.avatarRight) ui.avatarRight.className = "avatar right";
}

function dimOther(activeSide) {
    if (activeSide === "left" && ui.avatarRight) ui.avatarRight.classList.add("inactive");
    if (activeSide === "right" && ui.avatarLeft) ui.avatarLeft.classList.add("inactive");
}

function dimAll() {
    if (ui.avatarLeft) ui.avatarLeft.classList.add("inactive");
    if (ui.avatarRight) ui.avatarRight.classList.add("inactive");
}

// --- 章節選單邏輯 ---

function setupChapterMenu() {
    if (!ui.chapterBtn || !ui.chapterMenu) return;

    // 篩選出有 chapter 標題的步驟
    const chapters = scenario
        .map((step, index) => step.chapter ? { title: step.chapter, index } : null)
        .filter(Boolean);

    ui.chapterBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // 防止觸發 nextStep
        openChapterMenu(chapters);
    });

    // 點擊選單外部關閉選單
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
        div.style.cursor = "pointer"; // 讓滑鼠變成手指形狀
        div.style.padding = "10px";   // 增加點擊範圍
        
        div.onclick = (e) => {
            e.stopPropagation();
            jumpToChapter(ch.index);
        };
        
        ui.chapterMenu.appendChild(div);
    });

    ui.chapterMenu.hidden = false;
}

function jumpToChapter(index) {
    state.index = index;
    ui.chapterMenu.hidden = true;
    console.log(`跳轉至章節索引: ${index}`);
    
    // 跳轉後不需要再點一次，直接執行該步驟
    // 因為 nextStep 會先 +1，所以這裡不需要調整 index，直接呼叫
    // 但因為 jumpToChapter 設的是 index (例如 0)，nextStep 執行時會讀取 index 並 +1
    // 這裡我們直接呼叫 nextStep 讓它去讀取當前的 state.index
    nextStep();
}
