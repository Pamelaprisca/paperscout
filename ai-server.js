import http from "node:http";

const PORT = Number(process.env.AI_PORT || 8787);
const API_KEY =
  process.env.DEEPSEEK_API_KEY ||
  process.env.AI_API_KEY ||
  process.env.OPENAI_API_KEY;
const BASE_URL =
  process.env.AI_BASE_URL || "https://api.deepseek.com/chat/completions";
const MODEL = process.env.AI_MODEL || "deepseek-chat";

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("请求体不是合法 JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function callChat(systemPrompt, userPrompt) {
  if (!API_KEY) {
    const error = new Error("AI 服务未配置 API Key");
    error.status = 503;
    throw error;
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const error = new Error(`AI 接口请求失败：${response.status}`);
    error.status = 502;
    throw error;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function parseJsonFromContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI 没有返回合法 JSON");
    return JSON.parse(match[0]);
  }
}

function normalizePriority(priority) {
  const value = String(priority || "").toLowerCase();
  return ["low", "medium", "high"].includes(value) ? value : "medium";
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method !== "POST") {
    return sendJson(res, 404, { error: "Not found" });
  }

  try {
    const body = await readBody(req);

    if (req.url === "/api/ai/generate-issue") {
      const prompt = String(body.prompt || "").trim();
      if (!prompt) {
        return sendJson(res, 400, { error: "请输入任务描述" });
      }

      const systemPrompt = [
        "You are a task manager assistant for a React issue board.",
        "Turn the user's request into one structured issue.",
        "Use Simplified Chinese by default. If the user writes in English, respond in English.",
        'Return JSON only, no markdown, with this exact shape:',
        '{"title":"short title","description":"2-3 sentence description","priority":"low|medium|high","tags":["tag1","tag2"]}',
        "Title should be under 80 characters. Tags should be lowercase keywords.",
      ].join(" ");

      const hasChinese = /[\u4e00-\u9fff]/.test(prompt);
      const languageHint = hasChinese
        ? "\n用户输入为中文，请使用简体中文返回 title、description 和 tags。"
        : "\nThe user input is not Chinese; reply in the same language as the user.";
      const content = await callChat(systemPrompt, `${prompt}\n${languageHint}`);
      const parsed = parseJsonFromContent(content);
      const issue = {
        title: String(parsed.title || "").trim(),
        description: String(parsed.description || "").trim(),
        priority: normalizePriority(parsed.priority),
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.map(String).slice(0, 5)
          : [],
      };

      if (!issue.title) {
        return sendJson(res, 422, { error: "AI 返回缺少 title" });
      }

      return sendJson(res, 200, issue);
    }

    if (req.url === "/api/ai/board-summary") {
      const issues = Array.isArray(body.issues) ? body.issues : [];

      const today = new Date();
      const todayISO = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      function daysUntilDue(dueDate) {
        if (!dueDate) return null;
        const due = new Date(`${dueDate}T00:00:00`);
        const now = new Date(`${todayISO}T00:00:00`);
        return Math.round((due - now) / 86400000);
      }

      const doneIssues = issues.filter((issue) => issue.status === "done");
      const activeIssues = issues.filter((issue) => issue.status !== "done");

      const overdue = activeIssues
        .filter((issue) => {
          const days = daysUntilDue(issue.dueDate);
          return days !== null && days < 0;
        })
        .map((issue) => ({
          title: issue.title,
          assignee: issue.assignee || "未分配",
          dueDate: issue.dueDate || "",
          overdueDays: Math.abs(daysUntilDue(issue.dueDate)),
        }));

      const upcoming = activeIssues
        .filter((issue) => {
          const days = daysUntilDue(issue.dueDate);
          return days !== null && days >= 0 && days <= 3;
        })
        .sort((a, b) => daysUntilDue(a.dueDate) - daysUntilDue(b.dueDate))
        .map((issue) => ({
          title: issue.title,
          assignee: issue.assignee || "未分配",
          dueDate: issue.dueDate || "",
          daysUntilDue: daysUntilDue(issue.dueDate),
          description: String(issue.description || "").slice(0, 120),
          tags: issue.tags || [],
        }));

      const inProgress = activeIssues.filter((issue) => {
        const days = daysUntilDue(issue.dueDate);
        const isOverdue = days !== null && days < 0;
        const isUpcoming = days !== null && days >= 0 && days <= 3;
        return !isOverdue && !isUpcoming;
      });

      const structuredBoard = {
        today: todayISO,
        done: doneIssues.map((issue) => issue.title),
        inProgress: inProgress.map((issue) => ({
          title: issue.title,
          assignee: issue.assignee || "未分配",
          dueDate: issue.dueDate || "",
        })),
        overdue,
        upcoming,
      };

      const systemPrompt = [
        "You are a practical project manager assistant for a Chinese task board.",
        "Use Simplified Chinese. Return JSON only, no markdown, no code block.",
        "The response must follow this exact JSON shape:",
        '{"summary":"one-line overall status","completed":["finished tasks"],"inProgress":["active non-urgent tasks"],"overdue":["overdue follow-up"],"upcoming":[{"title":"task","daysUntilDue":0,"prepHint":"concrete preparation"}],"nextStep":"one clear next action"}',
        "Rules:",
        "1. Done tasks are finished. Never list them as follow-up, never recommend continuing them, never say to follow up on their assignee.",
        "2. Only overdue, upcoming, and inProgress tasks may appear in recommendations.",
        "3. For every upcoming task due within 0-3 days, write one concrete prepHint based on its title, description, and tags.",
        "4. If an upcoming task looks like an interview, meeting, defense, exam, presentation, or delivery, mention concrete preparations such as materials, documents, portfolio, rehearsal, time confirmation, or backup plan.",
        "5. summary <= 60 Chinese characters. nextStep <= 50 Chinese characters. Each list item <= 25 Chinese characters.",
        "6. If a list is empty, use an empty array []. Do not invent tasks.",
      ].join(" ");

      const content = await callChat(
        systemPrompt,
        JSON.stringify(structuredBoard, null, 2)
      );

      const parsed = parseJsonFromContent(content);
      const report = {
        summary: String(parsed.summary || "").trim(),
        completed: Array.isArray(parsed.completed)
          ? parsed.completed.map(String)
          : [],
        inProgress: Array.isArray(parsed.inProgress)
          ? parsed.inProgress.map(String)
          : [],
        overdue: Array.isArray(parsed.overdue)
          ? parsed.overdue.map(String)
          : [],
        upcoming: Array.isArray(parsed.upcoming)
          ? parsed.upcoming.map((item) => ({
              title: String(item?.title || "").trim(),
              daysUntilDue: Number(item?.daysUntilDue ?? 0),
              prepHint: String(item?.prepHint || "").trim(),
            }))
          : [],
        nextStep: String(parsed.nextStep || "").trim(),
      };

      if (!report.summary && report.upcoming.length === 0) {
        return sendJson(res, 422, { error: "AI 返回的总结格式不正确" });
      }

      return sendJson(res, 200, report);
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    return sendJson(res, error.status || 500, {
      error: error.message || "AI 服务内部错误",
    });
  }
});

server.listen(PORT, () => {
  console.log(`AI helper server running at http://127.0.0.1:${PORT}`);
});
