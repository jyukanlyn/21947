export const characters = {
  "二羽 一葉": {
    side: "left",
    nameColor: "#FF5809",
    sprites: {
      normal: "assets/char/21.png"
    }
  },
  "久世　傾": {
    side: "right",
    nameColor: "#E6CAFF",
    textColor: "black",
    sprites: {
      normal: "assets/char/947.png"
    }
  }
  // 👇 新增這裡：定義 Narrator (旁白) 的樣式
  "Narrator": {
    // 您可以不設定 side，或是設為 "left" / "right" 來決定名字框位置
    nameColor: "#333333",  // 例如：深灰色背景
    textColor: "white",    // 例如：白色文字
    sprites: {}            // 旁白通常沒有立繪，留空即可
  }
};
