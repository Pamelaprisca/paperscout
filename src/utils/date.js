const WEEKDAY_ALIASES = {
  日: 0,
  天: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysFromToday(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function parseExplicitDate(value) {
  const isoMatch = value.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const chineseMatch = value.match(/(?:今年)?(\d{1,2})月(\d{1,2})[日号]/);
  if (chineseMatch) {
    const year = new Date().getFullYear();
    return `${year}-${String(chineseMatch[1]).padStart(2, "0")}-${String(
      chineseMatch[2],
    ).padStart(2, "0")}`;
  }

  const englishMatch = value.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/i,
  );
  if (englishMatch) {
    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const month = months[englishMatch[1].slice(0, 3).toLowerCase()];
    const year = new Date().getFullYear();
    const date = new Date(year, month, Number(englishMatch[2]), 12);
    return toISODate(date);
  }

  return "";
}

function parseWeekday(value) {
  const lower = value.toLowerCase();

  const chineseMatch = value.match(/(下[周星期])?(周|星期)([一二三四五六日天])/);
  if (chineseMatch) {
    const targetDay = WEEKDAY_ALIASES[chineseMatch[3]];
    const nextWeek = chineseMatch[1] === "下" || chineseMatch[1] === "下周";
    const today = new Date().getDay();
    let offset = (targetDay - today + 7) % 7;
    if (nextWeek) {
      offset = offset === 0 ? 7 : offset;
    }
    return daysFromToday(offset);
  }

  for (const [name, targetDay] of Object.entries(WEEKDAY_ALIASES)) {
    if (lower === name || lower.endsWith(name)) {
      const today = new Date().getDay();
      let offset = (targetDay - today + 7) % 7;
      if (lower.includes("next")) {
        offset = offset === 0 ? 7 : offset;
      }
      return daysFromToday(offset);
    }
  }

  return "";
}

export function parseDateFromText(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return "";

  if (value.includes("今天")) return daysFromToday(0);
  if (value.includes("明天")) return daysFromToday(1);
  if (value.includes("后天")) return daysFromToday(2);
  if (value.includes("tomorrow")) return daysFromToday(1);
  if (value.includes("today")) return daysFromToday(0);

  const weekday = parseWeekday(value);
  if (weekday) return weekday;

  return parseExplicitDate(value);
}
