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
    eventImage: document.getElementById("event-image"), 
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
const CHAR_LIMIT = 40; 

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

    // 2. 文字處理 (包含名字框邏輯)
    const speakerName = step.speaker || "";
    
    if (ui.namePlate) {
        // 如果是 Narrator，直接隱藏名字框
        if (step.speaker === "Narrator") {
            ui.namePlate.style.display = "none";
        } else {
            ui.namePlate.style.display = ""; 
            ui.namePlate.textContent = speakerName;
            ui.namePlate.setAttribute("data-name", speakerName); 

            // 取得角色資料並設定顏色
            const charData = characters[step.speaker];

            if (charData) {
                if (charData.nameColor) {
                    ui.namePlate.style.backgroundColor = charData.nameColor;
                    ui.namePlate.style.color = charData.textColor || "white"; 
                } else {
                    ui.namePlate.style.backgroundColor = ""; 
                    ui.namePlate.style.color = ""; 
                }
            } else {
                // 預設樣式
                ui.namePlate.style.backgroundColor = ""; 
                ui.namePlate.style.color = ""; 
            }

            // ✨ 【修改 1】強制移除 right-side 樣式，確保名字框永遠在左邊
            ui.namePlate.classList.remove("right-side"); 
        }
    }

    // 文字框樣式 (Narrator 字體)
    if (ui.textBox) {
        ui.textBox.textContent = step.text || "";
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

// ✨ 【修改 2】重寫立繪邏輯：強制只顯示說話者在左邊
function updateCharacters(step) {
    // 1. 強制隱藏右邊立繪 (因為我們只用左邊)
    if (ui.avatarRight) {
        ui.avatarRight.style.display = "none";
        ui.avatarRight.classList.remove("active");
    }

    // 2. 先把左邊立繪也隱藏並重置 (預設為空)
    // 這樣如果是 Narrator 或沒立繪的人說話，畫面上就不會有人
    if (ui.avatarLeft) {
        ui.avatarLeft.src = "";
        ui.avatarLeft.style.display = "none"; // 先藏起來
        ui.avatarLeft.classList.remove("active");
        ui.avatarLeft.className = "avatar left"; // 重置 class
    }

    // 3. 如果是旁白，做到這裡就結束 (畫面上無人)
    if (step.speaker === "Narrator") {
        return;
    }

    // 4. 檢查該角色是否有立繪
    const char = characters[step.speaker];
    
    // 如果角色資料不存在，或沒有 sprites 設定，也結束
    if (!char || !char.sprites) return;

    const emotion = step.emotion || "normal";
    
    // 5. 如果有對應表情的圖片，就顯示在【左邊】
    if (char.sprites[emotion]) {
        if (ui.avatarLeft) {
            ui.avatarLeft.src = char.sprites[emotion];
            ui.avatarLeft.style.display = "block"; // 顯示出來
            
            // 加入 active 讓它變亮/出現
            ui.avatarLeft.classList.add("active");
            ui.avatarLeft.classList.remove("inactive");
        }
    }
}

// --- 輔助功能 ---

function resetAvatars() {
    if (ui.avatarLeft) ui.avatarLeft.className = "avatar left";
    if (ui.avatarRight) ui.avatarRight.className = "avatar right";
}

// dimOther 和 dimAll 在新邏輯下其實用不到了，但為了避免報錯先留著
function dimOther(activeSide) {}
function dimAll() {}

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
console.log("引擎啟動！");
initGame();
