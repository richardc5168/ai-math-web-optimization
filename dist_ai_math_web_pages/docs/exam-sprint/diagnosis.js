(function (globalScope) {
  function normalizeText(s) {
    return String(s || "")
      .replace(/−/g, "-")
      .replaceAll("，", ",")
      .replaceAll("、", ",")
      .replaceAll("／", "/")
      .replaceAll("＝", "=")
      .trim();
  }

  function parseRawNumber(text) {
    const s = normalizeText(text).replaceAll(",", "");
    const v = Number(s);
    if (!Number.isFinite(v)) throw new Error("請輸入數字");
    return v;
  }

  function parseFraction(text) {
    const s = normalizeText(text);
    let m = s.match(/^\s*(-?\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/);
    if (m) {
      const whole = parseInt(m[1], 10);
      const num = parseInt(m[2], 10);
      const den = parseInt(m[3], 10);
      if (!Number.isFinite(whole) || !Number.isFinite(num) || !Number.isFinite(den) || den === 0) throw new Error("分數格式錯誤");
      const sign = whole < 0 ? -1 : 1;
      const absWhole = Math.abs(whole);
      return sign * (absWhole * den + num) / den;
    }

    m = s.match(/^\s*(-?\d+)\s*\/\s*(\d+)\s*$/);
    if (m) {
      const n = parseInt(m[1], 10);
      const d = parseInt(m[2], 10);
      if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) throw new Error("分數格式錯誤");
      return n / d;
    }

    m = s.match(/^\s*(-?\d+)\s*$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isFinite(n)) throw new Error("分數格式錯誤");
      return n;
    }

    throw new Error("答案格式支援：2 1/3、7/3、2");
  }

  function parsePercent(text) {
    const s0 = normalizeText(text);
    const hasPercent = s0.includes("%");
    const v = parseRawNumber(s0.replaceAll("%", ""));
    if (hasPercent) return v;
    if (v >= 0 && v <= 1 && s0.includes(".")) return v * 100;
    return v;
  }

  function toValue(questionObj, text) {
    const unit = String((questionObj && questionObj.answer_unit) || "number");
    if (unit === "text") return normalizeText(text);
    if (unit === "fraction") return parseFraction(text);
    if (unit === "percent") return parsePercent(text);
    return parseRawNumber(text);
  }

  function nearlyEqual(a, b) {
    if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 1e-9;
    return String(a) === String(b);
  }

  function operationHint(questionObj) {
    const kind = String((questionObj && questionObj.kind) || "");
    const q = String((questionObj && questionObj.question) || "");
    if (kind.includes("avg") || q.includes("平均分")) return "先判斷題意：這是平均分配題，先用『總量 ÷ 人數』列式。";
    if (kind.includes("ratio") || q.includes("比例") || q.includes("配方")) return "先判斷題意：這是比例題，先把兩邊變成同一單位再比。";
    if (kind.includes("unit_convert") || q.includes("單位換算") || q.includes("公尺") || q.includes("公分")) return "先判斷題意：這題先統一單位，再做加減乘除。";
    if (kind.includes("percent") || q.includes("折扣") || q.includes("百分比")) return "先判斷題意：百分比題要先把『幾%』轉成小數或分數再計算。";
    if (kind.includes("frac") || q.includes("分數")) return "先判斷題意：分數題要先看分母是否相同，不同要先通分。";
    if (kind.includes("decimal") || q.includes("小數")) return "先判斷題意：小數題先對齊小數點，再依順序計算。";
    return "先判斷題意：先寫出要用哪個運算（加、減、乘、除），再開始算。";
  }

  function detectErrorType(questionObj, studentAnswerRaw, expected, actual) {
    const raw = normalizeText(studentAnswerRaw || "");
    const q = String((questionObj && questionObj.question) || "");
    const unit = String((questionObj && questionObj.answer_unit) || "number");
    if (!raw) return "misunderstanding";

    if (/[公分公尺公里毫升公升元角分鐘小時秒]/.test(raw) && !/[\/\d.%]/.test(raw.replace(/[公分公尺公里毫升公升元角分鐘小時秒]/g, ""))) {
      return "unit_error";
    }

    if (typeof expected === "number" && typeof actual === "number") {
      if (expected !== 0 && nearlyEqual(actual, -expected)) return "sign_error";
      const absDiff = Math.abs(actual - expected);
      if (absDiff > 0 && absDiff <= 0.1 && (unit === "number" || unit === "percent")) return "rounding_error";
      if ((q.includes("平均") || String((questionObj && questionObj.kind) || "").includes("avg")) && actual > expected) return "concept_error";
      return "calculation_error";
    }

    if (unit === "fraction" && raw.includes(".")) return "concept_error";
    return "other";
  }

  function errorDetailByType(errorType, questionObj, studentAnswerRaw) {
    const q = String((questionObj && questionObj.question) || "");
    if (errorType === "unit_error") return "你可能把單位直接寫在答案裡，或單位還沒先統一。先把單位換成同一種，再計算。";
    if (errorType === "sign_error") return "你可能在正負號上出錯了。請回頭檢查每一步的加減號。";
    if (errorType === "rounding_error") return "你的答案很接近，可能是小數位或四捨五入位置錯了。";
    if (errorType === "concept_error") {
      if (q.includes("平均") || String((questionObj && questionObj.kind) || "").includes("avg")) return "你可能把『平均分配』的運算方向弄反了。平均分配通常是總量除以人數。";
      return "你有抓到部分重點，但運算觀念還差一步，先回到題意判斷要用哪個運算。";
    }
    if (errorType === "misunderstanding") return "目前看起來你還沒真正開始作答，先用一句話說出題目要你求什麼。";
    if (errorType === "calculation_error") return "觀念方向大致對，但中間計算可能算錯了。請把每一步寫出來再算一次。";
    return `先別急，這題先把題目關鍵字圈出來，再重做一次。你剛剛的輸入是「${normalizeText(studentAnswerRaw)}」。`;
  }

  function buildRemediation(questionObj, errorType) {
    const hint1 = operationHint(questionObj);
    let hint2 = "把題目數字抄成算式，先不要口算，先確認每一步做的運算。";
    let hint3 = "算完後做合理性檢查：答案大小、單位、題意是否一致。";

    if (errorType === "unit_error") {
      hint2 = "先把所有數字換成同一單位，再寫算式。";
      hint3 = "最後答案要寫成題目要求的單位。";
    } else if (errorType === "sign_error") {
      hint2 = "每一步都把正負號抄完整，特別是減號前後。";
      hint3 = "用反算檢查一次（把結果代回去看是否合理）。";
    } else if (errorType === "rounding_error") {
      hint2 = "先完整算出原值，再在最後一步才四捨五入。";
      hint3 = "確認題目要保留幾位小數或是否要化成分數。";
    } else if (errorType === "concept_error") {
      hint2 = "先寫『要找的是什麼』，再選運算（不是先算）。";
      hint3 = "把關鍵句翻成算式後，再一步一步算。";
    }

    return {
      remediation_hints: [hint1, hint2, hint3],
      remediation_steps: [
        { step: 1, title: "判斷題型", action: hint1 },
        { step: 2, title: "重列算式", action: hint2 },
        { step: 3, title: "檢查結果", action: hint3 },
      ],
    };
  }

  function diagnoseWrongAnswer(questionObj, studentAnswer) {
    const studentAnswerRaw = String(studentAnswer == null ? "" : studentAnswer);

    let expected = null;
    let actual = null;
    let parseError = null;

    try { expected = toValue(questionObj, questionObj && questionObj.answer); } catch (e) { expected = null; }
    try { actual = toValue(questionObj, studentAnswerRaw); } catch (e) { parseError = String((e && e.message) || e); actual = null; }

    const error_type = parseError ? "misunderstanding" : detectErrorType(questionObj, studentAnswerRaw, expected, actual);
    const error_detail = parseError
      ? `你的答案格式需要調整：${parseError}。先改成題目要求的格式再試一次。`
      : errorDetailByType(error_type, questionObj, studentAnswerRaw);

    const remediation = buildRemediation(questionObj, error_type);

    return {
      error_type,
      error_detail,
      remediation_hints: remediation.remediation_hints,
      remediation_steps: remediation.remediation_steps,
      student_answer_raw: studentAnswerRaw,
      expected_value: expected,
      actual_value: actual,
    };
  }

  globalScope.diagnoseWrongAnswer = diagnoseWrongAnswer;
})(typeof window !== 'undefined' ? window : globalThis);
