// 遊戲狀態 (存檔相關資料放這裡)
export const state = {
  index: 0,           // 目前讀到第幾句
  history: [],  // 👈 新增這個：用來存歷史紀錄
  chapter: 1,         // (預留) 目前章節
  flags: {}           // (預留) 用來記錄選項或好感度
  textQueue: [] // 👈 新增這個：用來存「還沒講完的文字」
};

// 背景圖片對照表 (註冊場景 ID 對應的路徑)
export const backgrounds = {
  // 格式 -> 場景ID: "圖片相對路徑"
  
  // 您的範例
  room: "assets/bg/bedroom.png",
  
  // 擴充範例 (請依照您實際的檔案路徑修改)
  school: "assets/bg/school_gate.jpg",
  classroom: "assets/bg/classroom_day.jpg",
  park: "assets/bg/park_sunset.png",
  black: "assets/bg/black.png" // 全黑背景，適合回憶或轉場用
};
