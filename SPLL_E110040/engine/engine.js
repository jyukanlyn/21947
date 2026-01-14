import { scenario } from "../data/scenario.js";
import { characters } from "../data/characters.js";
// 重要：必須引入 backgrounds 才能讀取圖片路徑
import { state, backgrounds } from "./state.js";

// ⚠️ 修正順序：先定義 UI，最後再執行 initGame()

// UI 元素快取 (對應 index.html 的 ID)
const ui = {
    namePlate: document.getElementById("name-plate"),
    textBox: document.getElementById("dialogue-text"),
    avatarLeft: document.getElementById("avatar-left"),
    avatarRight: document.getElementById("avatar-right"),
    gameScreen: document.getElementById("game-screen"),
    chapterBtn: document.getElementById("chapter-btn"),
    chapterMenu: document.getElementById("chapter-menu"),
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

    // 綁定主畫面點擊 (下一步)
    ui.gameScreen.addEventListener("click", nextStep);
    
    // 初始化章節選單
    setupChapterMenu();

    // 按鈕事件綁定 (紀錄 & 上一頁)
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

    // 初始渲染第一句
    if (state.index === 0 && scenario.length > 0) {
        nextStep(); 
    } else {
        render(scenario[state.index - 1] || scenario[0]);
    }
}

// --- 核心運作邏輯 ---

// 設定：每頁最多字數
const CHAR_LIMIT = 80; 

function nextStep() {
    // 1. 【檢查佇列】優先處理還沒講完的話
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
    state.textQueue = []; 

    // 5. 【✨ 聰明換頁邏輯】
    if (step.text && step.text.length > CHAR_LIMIT) {
        const fullText = step.text;
        const chunks = [];
        let remaining = fullText;

        while (remaining.length > 0) {
            if (remaining.length <= CHAR_LIMIT) {
                chunks.push(remaining);
                break;
            }

            let chunkAttempt = remaining.substring(0, CHAR_LIMIT);
            const punctuation = ["。", "！", "？", "\n", "……", "⋯⋯", "」"];
            let bestSplitIndex = -1;

            for (let p of punctuation) {
                const idx = chunkAttempt.lastIndexOf(p);
                if (idx > bestSplitIndex) {
                    bestSplitIndex = idx;
                }
            }

            let finalCutIndex;
            if (bestSplitIndex !== -1) {
                finalCutIndex = bestSplitIndex + 1;
            } else {
                finalCutIndex = CHAR_LIMIT;
            }

            chunks.push(remaining.substring(0, finalCutIndex));
            remaining = remaining.substring(finalCutIndex);
        }

        step.text = chunks.shift(); 
        state.textQueue = chunks;   
        console.log(`文字太長，已聰明切割成 ${chunks.length + 1} 段`);
    }

    // 執行渲染
    console.log(`執行步驟 ${state.index}:`, step);
    render(step);
}

// ✨ 上一頁功能
function prevStep() {
    if (state.index <= 1) return; 

    state.index -= 2;
    state.history.pop();
    state.textQueue = [];

    nextStep();
}
function render(step) {
    if (!step) return;

    // 1. 背景處理
    if (step.bg) {
        changeBackground(step.bg);
    }

    // 2. 文字處理
    const speakerName = step.speaker || "";
    
    if (ui.namePlate) {
        ui.namePlate.textContent = speakerName;
        ui.namePlate.setAttribute("data-name", speakerName); 

        // 取得角色資料
        const charData = characters[step.speaker];

        if (charData) {
            // 顏色設定
            if (charData.nameColor) {
                ui.namePlate.style.backgroundColor = charData.nameColor;
                ui.namePlate.style.color = charData.textColor || "white"; 
            } else {
                ui.namePlate.style.backgroundColor = ""; 
                ui.namePlate.style.color = ""; 
            }

            // 位置設定
            if (charData.side === "right") {
                ui.namePlate.classList.add("right-side");
            } else {
                ui.namePlate.classList.remove("right-side");
            }

        } else {
            // 還原預設值
            ui.namePlate.style.backgroundColor = ""; 
            ui.namePlate.style.color = ""; 
            ui.namePlate.classList.remove("right-side"); 
        }
    }

    // --- ✨ 修改這裡：文字框內容與樣式切換 ---
    if (ui.textBox) {
        ui.textBox.textContent = step.text || "";

        // 判斷：如果是 Narrator，就加上特殊字體樣式
        if (step.speaker === "Narrator") {
            ui.textBox.classList.add("narrator-style");
        } else {
            // 如果不是旁白（是普通角色），記得要把樣式移除，變回普通字體
            ui.textBox.classList.remove("narrator-style");
        }
    }

    // 3. 立繪處理
    updateCharacters(step);
}

// ✨ 顯示歷史紀錄視窗
function showLog() {
    if (!ui.logContent) return;
    const list = ui.logContent;
    list.innerHTML = ""; 

    const currentStep = scenario[state.index - 1];
    const displayHistory = [...state.history]; 
    
    if (currentStep) {
        displayHistory.push({
            speaker: currentStep.speaker || "",
            text: currentStep.text || ""
        });
    }

    displayHistory.forEach(log => {
        if (!log.text) return;
        const div = document.createElement("div");
        div.className = "log-entry";
        
        if (log.speaker && log.speaker !== "Narrator") {
            const nameSpan = document.createElement("span");
            nameSpan.className = "log-name";
            nameSpan.textContent = log.speaker + "：";
            div.appendChild(nameSpan);
        }

        const textSpan = document.createElement("span");
        textSpan.className = "log-text";
        textSpan.textContent = log.text;
        div.appendChild(textSpan);

        list.appendChild(div);
    });

    ui.logWindow.hidden = false;
    setTimeout(() => {
        list.scrollTop = list.scrollHeight;
    }, 10);
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

// ✅ 這裡才是最後一行：啟動遊戲
// 把啟動指令放在檔案最下面，確保所有變數都已經準備好了
console.log("引擎啟動！");
initGame();
