# さ小文轉換器 / Sa-Sio-Bun Converter

## 這是什麼？

一個把中文／英文翻譯成「さ小文」的網路迷因工具。

**さ小文**是一種台灣網路自創文體：
- 外觀看起來像日文
- 唸出來卻是台語
- 核心概念：**日文皮、國語骨、台語魂**

### 範例

| 原文 | さ小文 |
|------|--------|
| 來都來了 | 来と来あ |
| 你在哪裡？ | り てぃ 叨 い？ |
| 我很想你 | わ てぃん 想 り |
| 我今天暈碳了 | わ 今あじ 暈碳き あ |
| 今天全身都是班味 | 今あじ つぁんしん ろん 班 びー |

---

## 轉換邏輯

```
中文／英文
    ↓
台語（自然口語）
    ↓
台羅拼音 TL（教育部標準）
    ↓
さ小文
```

### さ小文四大規則

1. **漢字上限** — 短句最多兩個漢字
2. **漢字選擇** — 必須以台羅發音為準選借音漢字，優先選中日共用常用字或有台味的字（如「靠」「叨」），不可直接留原中文字
3. **假名優先** — 盡量平假名，避免片假名
4. **專有名詞保留** — 流行語、新造詞直接保留原字（如「班味」「暈碳」），不計入漢字上限

---

## 技術架構

- **前端**：純 HTML／CSS／JS（單一檔案）
- **LLM**：Google Gemini API（免費方案）
- **部署**：Vercel（免費）
- **System Prompt**：見 `sa-sio-bun_system_prompt.md`

---

## 專案檔案

```
/
├── README.md                   # 本文件
├── index.html                  # 主網頁（已完成）
├── sa-sio-bun_system_prompt.md    # LLM 核心指令
└── sa-sio-bun_progress.md         # 開發進度追蹤
```

---

## 開發進度

詳見 `sa-sio-bun_progress.md`

目前狀態：`index.html` 已完成並串接 Gemini API（`gemini-2.5-flash-lite`），可本地測試。下一步為部署上線（GitHub + Vercel）。

---

## 環境設定

需要一個 Gemini API Key：
1. 去 [aistudio.google.com](https://aistudio.google.com)
2. 登入 Google 帳號
3. 點「Get API Key」→「Create API Key」
4. 打開 `index.html`，在網頁上方的輸入框貼上 Key（只存在當前瀏覽器分頁，不會寫進檔案）

