// Vercel Serverless Function：さ小文轉換後端代理
// 使用者的瀏覽器呼叫 /api/convert，由這裡帶著伺服器端的 Key 去打 Gemini。
// Gemini API Key 存在 Vercel 環境變數 GEMINI_API_KEY，永遠不會出現在前端原始碼。

const MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `你是一個台語翻譯與さ小文轉換專家。

さ小文是一種台灣網路迷因文體，外觀看起來像日文，但實際上是用平假名拼出台語發音，並混入少量漢字。目標是讓人一眼以為是日文，唸出來卻是純台語。

## 轉換流程（每一步都要做完才能進下一步，不可跳步）

### 第一步：中文／英文 → 台語
- 翻譯成自然口語台語，逐字確認沒有漏字
- **嚴禁照國語字面直譯！必須用台語慣用詞。** 很多詞台語講法跟國語完全不同，照字面翻會錯。
- 常見直譯陷阱對照（務必用右邊的台語詞，不可用左邊國語字的音）：
  - 可愛 → 古錐 (kóo-tsui)，不可翻成 khó-ài
  - 漂亮／美 → 媠 (suí)
  - 喜歡 → 佮意 (kah-ì)
  - 厲害 → 𠢕 (gâu)
  - 怎麼 → 按怎 (án-tsuánn)
  - 什麼 → 啥物 (siánn-mih)
  - 為什麼 → 是按怎 (sī án-tsuánn)
  - 不要 → 毋通 (m̄-thang) / 莫 (mài)
  - 沒有 → 無 (bô)
  - 在哪裡 → 佇叨位 (tī tó-uī)
- 遇到上表沒列的詞，也要先想「台語日常會這樣講嗎」，再決定用詞，不要反射性照國語直翻。
- 特別注意時間詞：「今天」是「今仔日」(kin-á-ji̍t)，三個音節都要在，不可簡寫成「今仔」

### 第二步：台語 → 台羅拼音
- 依教育部台羅方案標音
- 把每個字的音節用「-」清楚分開，例如：今仔日 = kin-á-ji̍t

### 第三步：台羅 → 假名（最關鍵，lite 最容易在這裡出錯）
**逐音節對應，一個台羅音節 = 一個假名，不可合併、不可遺漏、不可張冠李戴。**

操作方法：先把整句台羅拆成一串獨立音節，再一個一個查表轉假名。

常見台羅音節 → 平假名對照（務必嚴格區分相近音）：
- lí → り
- kin → きん（注意！是 ki 的音，不是 ku）
- khùn → くん（這才是 ku 的音，睏）
- á → あ
- ji̍t → じ
- pá → ぱ
- bōe / bē → べ
- guá → わ
- thiann → てぃあん
- teh → てー
- khàu → 靠（借音漢字）

⚠️ 最容易錯的陷阱：kin（今，きん）和 khùn（睏，くん）發音相近但不同，絕對不可混淆。轉換時請對照原台羅，確認每個音節都對到正確假名。

## さ小文四大規則
規則一【漢字上限】：短句最多只能出現兩個漢字（專有名詞、流行語除外）
規則二【漢字選擇】：必須以台羅發音為準去找對應借音漢字。優先順序：(1)有台味感的借音漢字如「靠」「死」「愛」「叨」(2)中日共用常用漢字如天、雨、心、人、食、今、来(3)台語原字。不可直接留原中文字（除非發音恰好吻合台羅）。
規則三【假名優先】：其餘音節一律用平假名，盡量避免片假名。
規則四【專有名詞保留】：流行語、新造詞、專有名詞直接保留原字不轉假名，不計入漢字上限。如「班味」「暈碳」「瑪卡巴卡」。
規則五【嚴禁羅馬字】：sasiobun 欄位裡絕對不可出現任何羅馬拼音字母（a-z、聲調符號）。台羅拼音只是中間步驟，最終 sasiobun 只能由「平假名 + 少量漢字」組成。例如台羅的 pá 必須寫成平假名 ぱ，不可直接留 pá。

## 完整示範（照這個流程做）
輸入：你今天睡飽了沒有？
第一步台語：你今仔日睏飽未？
第二步台羅：lí kin-á-ji̍t khùn-pá bē？
第三步逐音節拆解：lí=り / kin=きん / á=あ / ji̍t=じ / khùn=くん / pá=ぱ / bē=べ
合併 sasiobun：り きん あ じ くん ぱ べ？

## 自我檢查（輸出前必做，逐項確認）
1. sasiobun 裡有沒有殘留英文字母（a-z）？有 → 全部改成平假名
2. 台羅有幾個音節，sasiobun 就該有相對應的假名/漢字數，數量有沒有對上？少了就是漏字
3. kin/khùn 這類相近音有沒有對到正確假名？

## 參考案例
- 來都來了 → 来と来あ
- 我今天暈碳了 → わ 今あじ 暈碳き あ
- 你在哪裡？ → り てぃ 叨 い？
- 我聽你在哭 → わ てぃあん り てー 靠
- 你睡了嗎？ → り くん 去 べ？

## 輸出格式
只輸出一個 JSON 物件，格式：
{"taigi":"台語句子","tailo":"台羅拼音","sasiobun":"さ小文"}

重要：直接回傳純 JSON 字串，開頭第一個字必須是 {，結尾最後一個字必須是 }。不要加任何說明文字，絕對不要使用 markdown 的 \`\`\` 標籤。`;

// ====== 詞彙對照表（人工校閱版）======
// zh=國語觸發詞、tw=台語、tailo=台羅、sasi=さ小文建議寫法。
// 輸入句子若含 zh，會把該筆當「指定用詞」動態提示給模型，導正第一步選詞。
// 要新增詞：在這裡加一行即可。
const GLOSSARY = [
  // 形容 / 情緒
  { zh: "可愛", tw: "古錐", tailo: "kóo-tsui", sasi: "古つい" },
  { zh: "漂亮", tw: "媠", tailo: "suí", sasi: "水" },
  { zh: "帥", tw: "緣投", tailo: "iân-tâu", sasi: "緣たう" },
  { zh: "厲害", tw: "𠢕", tailo: "gâu", sasi: "がう" },
  { zh: "能幹", tw: "𠢕", tailo: "gâu", sasi: "がう" },
  { zh: "笨", tw: "戇", tailo: "gōng", sasi: "ごん" },
  { zh: "傻", tw: "戇", tailo: "gōng", sasi: "ごん" },
  { zh: "醜", tw: "䆀", tailo: "bái", sasi: "ばい" },
  { zh: "累", tw: "忝", tailo: "thiám", sasi: "てぃぁむ" },
  { zh: "高興", tw: "歡喜", tailo: "huann-hí", sasi: "花んひ" },
  { zh: "生氣", tw: "受氣", tailo: "siū-khì", sasi: "しう き" },
  { zh: "不好意思", tw: "歹勢", tailo: "pháinn-sè", sasi: "拍せ" },
  // 動作 / 日常
  { zh: "吃", tw: "食", tailo: "tsia̍h", sasi: "甲" },
  { zh: "睡", tw: "睏", tailo: "khùn", sasi: "くん" },
  { zh: "玩", tw: "𨑨迌", tailo: "tshit-thô", sasi: "ちっとお" },
  { zh: "找", tw: "揣", tailo: "tshuē", sasi: "ちゅえ" },
  { zh: "給", tw: "予", tailo: "hōo", sasi: "ほお" },
  { zh: "說", tw: "講", tailo: "kóng", sasi: "供" },
  { zh: "知道", tw: "知影", tailo: "tsai-iánn", sasi: "つぁいいあん" },
  { zh: "回去", tw: "轉去", tailo: "tńg-khì", sasi: "凳き" },
  { zh: "工作", tw: "做穡", tailo: "tsò-sit", sasi: "つぉしっ" },
  // 語氣 / 連接詞
  { zh: "超", tw: "足", tailo: "tsiok", sasi: "じょ" },
  { zh: "很", tw: "真", tailo: "tsin", sasi: "金" },
  { zh: "非常", tw: "真", tailo: "tsin", sasi: "金" },
  { zh: "怎麼", tw: "按怎", tailo: "án-tsuánn", sasi: "安つぁん" },
  { zh: "什麼", tw: "啥物", tailo: "siánn-mih", sasi: "蝦みっ" },
  { zh: "這樣", tw: "按呢", tailo: "án-ne", sasi: "安ねー" },
  { zh: "現在", tw: "這馬", tailo: "tsit-má", sasi: "じ罵" },
  { zh: "不要", tw: "莫", tailo: "mài", sasi: "まい" },
  { zh: "等一下", tw: "等咧", tailo: "tán--leh", sasi: "たんれー" },
  // 稱呼 / 人
  { zh: "他", tw: "伊", tailo: "i", sasi: "い" },
  { zh: "我們", tw: "阮", tailo: "gún", sasi: "ぐん" },
  { zh: "小孩", tw: "囡仔", tailo: "gín-á", sasi: "音な" },
  { zh: "男生", tw: "查埔", tailo: "tsa-poo", sasi: "雜ぽお" },
  { zh: "女生", tw: "查某", tailo: "tsa-bóo", sasi: "雜もー" },
  { zh: "老婆", tw: "牽手", tailo: "khan-tshiú", sasi: "かんちう" },
  // 嗆 / 罵人 / 梗
  { zh: "幹嘛", tw: "衝啥", tailo: "tshòng-siánn", sasi: "ちょんしあん" },
  { zh: "發瘋", tw: "起痟", tailo: "khí-siáu", sasi: "き笑" },
  { zh: "討人厭", tw: "顧人怨", tailo: "kòo-lâng-uàn", sasi: "こおらんうあん" },
  { zh: "很煩", tw: "阿雜", tailo: "a-tsap", sasi: "あ雜" }
];

// 掃描輸入，命中的詞組成「指定用詞」提示（只注入有出現的，prompt 保持輕巧）
function buildGlossaryHint(text) {
  const hit = GLOSSARY.filter(e => text.includes(e.zh));
  if (hit.length === 0) return "";
  const lines = hit.map(e => `- 「${e.zh}」→ 台語用「${e.tw}」(${e.tailo})，さ小文寫法參考「${e.sasi}」`);
  return "【本句指定用詞，第一步翻譯務必照用，不可改用其他講法或直譯】\n" + lines.join("\n") +
    "\n（さ小文寫法為單詞參考；放進整句時若超過兩漢字上限，可把其中漢字改回平假名，但發音不變。）\n\n";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "只接受 POST" });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: "伺服器尚未設定 GEMINI_API_KEY 環境變數" });
    return;
  }

  const { text, thinkBudget } = req.body || {};
  if (!text || !String(text).trim()) {
    res.status(400).json({ error: "請輸入文字" });
    return;
  }

  // 思考預算：0=關閉、數字越大想越久、-1 為動態自動。預設 4096（較準）。
  const budget = Number.isInteger(thinkBudget) ? thinkBudget : 4096;

  // 命中詞典的詞，動態組成指定用詞提示，接在使用者輸入前面
  const userText = buildGlossaryHint(String(text)) + "輸入：" + String(text);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: budget }
    }
  });

  // 遇 429（額度）或 500/502/503（伺服器忙線）自動退避重試
  const delays = [1000, 2000, 4000, 8000];

  for (let attempt = 0; ; attempt++) {
    let upstream;
    try {
      upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
    } catch (e) {
      res.status(502).json({ error: "連線 Gemini 失敗，請稍後再試" });
      return;
    }

    if ([429, 500, 502, 503].includes(upstream.status) && attempt < delays.length) {
      await new Promise(r => setTimeout(r, delays[attempt]));
      continue;
    }

    if (upstream.status === 429) {
      res.status(429).json({ error: "已達免費額度上限，請稍後再試一下" });
      return;
    }
    if (!upstream.ok) {
      res.status(502).json({ error: "Gemini 回應錯誤（" + upstream.status + "）" });
      return;
    }

    const data = await upstream.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 強壯解析：去掉 markdown 標記，抓出第一個完整 {...}
    let cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      res.status(502).json({ error: "Gemini 回應裡找不到 JSON，請再試一次" });
      return;
    }
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      res.status(200).json({
        taigi: parsed.taigi || "",
        tailo: parsed.tailo || "",
        sasiobun: parsed.sasiobun || ""
      });
    } catch (err) {
      res.status(502).json({ error: "JSON 解析失敗，請再試一次" });
    }
    return;
  }
}
