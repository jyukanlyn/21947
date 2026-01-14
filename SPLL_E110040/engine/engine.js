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
    if (!ui.gameScreen) {
        console.error("錯誤：找不到 id='game-screen' 的元素！請檢查 index.html");
        return;
    }

    console.log("初始化完成，綁定點擊事件");

    ui.gameScreen.addEventListener("click", nextStep);
    setupChapterMenu();

    if (state.index === 0 && scenario.length > 0) {
        nextStep(); 
    } else {
        render(scenario[state.index - 1] || scenario[0]);
    }
}

// --- 核心運作邏輯 ---
// 修改 engine/engine.js 裡的 nextStep 函數

// 設定：大約多少字換一頁？
// 手機一行大約 18-20 字，3 行大約是 60 字。您可以依需求調整這個數字。
const CHAR_LIMIT = 60; 

function nextStep() {
    // 1. 【檢查佇列】優先處理還沒講完的話
    if (state.textQueue && state.textQueue.length > 0) {
        // 取出佇列中的第一段
        const nextChunk = state.textQueue.shift();
        
        // 直接更新對話框，不重新 render 整個人物背景，節省效能
        ui.textBox.textContent = nextChunk;
        
        console.log("顯示剩餘文字:", nextChunk);
        return; // ⚠️ 重要：直接結束，不讓 state.index + 1
    }

    // 2. 檢查劇本是否結束
    if (state.index >= scenario.length) {
        console.log("劇本已結束");
        return;
    }

    // 3. 取得新的步驟
    // 注意：這裡我們先用一個變數存起來，不要直接改原始資料
    // 我們使用 {...obj} 來複製一份資料，避免污染原始劇本
    let step = { ...scenario[state.index] }; 
    
    // 索引 +1 (指向下一步)
    state.index++;

    // 4. 【文字切割邏輯】
    // 如果這一步有文字，且文字長度超過限制
    if (step.text && step.text.length > CHAR_LIMIT) {
        
        const fullText = step.text;
        const chunks = [];

        // 把長文字切成好幾塊
        for (let i = 0; i < fullText.length; i += CHAR_LIMIT) {
            chunks.push(fullText.substring(i, i + CHAR_LIMIT));
        }

        // 第一塊文字：馬上要顯示的，放回 step 物件
        step.text = chunks.shift(); // 取出第一個

        // 剩下的文字：存入佇列，等待之後的點擊
        state.textQueue = chunks; 
        
        console.log(`文字太長，已切割成 ${chunks.length + 1} 段`);
    }

    // 執行渲染
    console.log(`執行步驟 ${state.index}:`, step);
    render(step);
}

function render(step) {
    if (!step) return;

    // 1. 背景處理
    if (step.bg) {
        changeBackground(step.bg);
    }

    // 2. 文字處理
    const speakerName = (step.speaker === "Narrator" || !step.speaker) ? "" : step.speaker;
    
    if (ui.namePlate) {
        ui.namePlate.textContent = speakerName;
        ui.namePlate.setAttribute("data-name", speakerName); 

        // --- 動態改變名字框顏色 ---
        const charData = characters[step.speaker];

        // 判斷：如果角色存在，且有設定 nameColor
        if (charData && charData.nameColor) {
            ui.namePlate.style.backgroundColor = charData.nameColor;
            
            // 👇 優先使用設定檔裡的 textColor，如果沒設定才用白色
            ui.namePlate.style.color = charData.textColor || "white"; 
            
        } else {
            // 如果沒設定，或者此時是旁白，回復成 CSS 的預設值
            ui.namePlate.style.backgroundColor = ""; 
            ui.namePlate.style.color = ""; 
        }
    }

    if (ui.textBox) ui.textBox.textContent = step.text || "";

    // 3. 立繪處理
    updateCharacters(step);
}

function changeBackground(bgID) {
    const bgPath = backgrounds[bgID];

    if (bgPath) {
        ui.gameScreen.style.backgroundImage = `url('${bgPath}')`;
        ui.gameScreen.style.backgroundSize = "cover";     
        ui.gameScreen.style.backgroundPosition = "center"; 
    } else {
        console.warn(`警告：在 state.js 中找不到背景代號 '${bgID}'`);
    }
}

function updateCharacters(step) {
    resetAvatars();

    if (step.speaker === "Narrator") {
        dimAll();
        return;
    }

    const char = characters[step.speaker];
    
    if (!char || !char.sprites) return;

    const target = char.side === "left" ? ui.avatarLeft : ui.avatarRight;
    const emotion = step.emotion || "normal";
    
    if (target && char.sprites[emotion]) {
        target.src = char.sprites[emotion]; 
        target.classList.add("active");     
        target.classList.remove("inactive");
    }

    dimOther(char.side);
}

// --- 輔助功能 ---

function resetAvatars() {
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

    const chapters = scenario
        .map((step, index) => step.chapter ? { title: step.chapter, index } : null)
        .filter(Boolean);

    ui.chapterBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
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
        div.style.cursor = "pointer"; 
        div.style.padding = "10px";   
        
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
    nextStep();
}
