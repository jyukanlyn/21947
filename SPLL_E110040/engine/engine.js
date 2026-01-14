import { scenario } from "../data/scenario.js";
import { characters } from "../data/characters.js";
// 修正 1：必須引入 backgrounds，否則無法讀取圖片路徑
import { state, backgrounds } from "./state.js"; 

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
    bgContainer: document.body 
};

// --- 初始化 ---
function initGame() {
    ui.gameScreen.addEventListener("click", nextStep);
    setupChapterMenu();

    // 檢查是否為新遊戲
    if (state.index === 0 && scenario.length > 0) {
        nextStep(); 
    } else {
        // 讀取進度
        render(scenario[state.index - 1] || scenario[0]);
    }
}

// --- 核心邏輯 ---

function nextStep() {
    if (state.index >= scenario.length) {
        console.log("劇本結束");
        return;
    }

    const step = scenario[state.index];
    state.index++;
    render(step);
}

function render(step) {
    if (!step) return;

    // 1. 處理背景
    if (step.bg) {
        changeBackground(step.bg);
    }

    // 2. 處理文字
    const speakerName = (step.speaker === "Narrator" || !step.speaker) ? "" : step.speaker;
    
    // 修正 2：使用 ui 物件來存取元素
    ui.namePlate.textContent = speakerName;
    ui.textBox.textContent = step.text || "";

    // 3. 處理立繪
    updateCharacters(step);
}

function changeBackground(bgName) {
    // 修正 3：直接使用 ui.gameScreen，並檢查 backgrounds 是否存在
    const bgPath = backgrounds[bgName];

    if (ui.gameScreen && bgPath) {
        ui.gameScreen.style.backgroundImage = `url('${bgPath}')`;
        ui.gameScreen.style.backgroundSize = "cover";
        ui.gameScreen.style.backgroundPosition = "center";
    } else {
        // 如果找不到圖片設定，可以在這裡 debug
        console.warn(`找不到背景圖片設定或路徑: ${bgName}`);
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
    if (char.sprites[emotion]) {
        target.src = char.sprites[emotion];
        target.classList.add("active");
        target.classList.remove("inactive");
    }

    dimOther(char.side);
}

// --- 輔助 UI 函數 ---

function resetAvatars() {
    [ui.avatarLeft, ui.avatarRight].forEach(a => {
        const side = a.classList.contains("left") ? "left" : "right";
        a.className = `avatar ${side}`;
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
    const chapters = scenario
        .map((step, index) => step.chapter ? { title: step.chapter, index } : null)
        .filter(Boolean);

    ui.chapterBtn.addEventListener("click", e => {
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
