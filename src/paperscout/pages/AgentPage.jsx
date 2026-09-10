import { Bot, CornerDownLeft, Paperclip, Square, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { confirmAgentAction, streamAgentChat } from "../api/agent.js";
import { ActionConfirmCard, ToolCallCard } from "../components/AgentToolCard.jsx";
import { PageHeader, Pill, Surface } from "../components/ui.jsx";
import { getSelectedPapers } from "../lib/selectedPapers.js";

const initialMessages = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "我是 PaperScout Agent。你可以让我检索论文、比较观点、总结某篇论文，或者为一段论述寻找可引用证据。",
  },
];

export default function AgentPage() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [busyActionId, setBusyActionId] = useState("");
  const [selectedPapers] = useState(() => getSelectedPapers());
  const abortRef = useRef(null);

  function updateMessage(messageId, updater) {
    setMessages((current) =>
      current.map((item) =>
        item.id === messageId ? updater(item) : item,
      ),
    );
  }

  async function sendMessage() {
    const message = draft.trim();
    if (!message || generating) return;

    const history = messages.map((item) => ({
      role: item.role,
      content: item.content,
    }));
    const assistantId = `assistant-${Date.now()}`;

    setDraft("");
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: message },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        citations: [],
        tools: [],
        actions: [],
      },
    ]);
    setGenerating(true);
    setStatus("正在准备回答");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAgentChat({
        message,
        history,
        selectedPapers,
        signal: controller.signal,
        onEvent(event) {
          if (event.type === "status") {
            setStatus(event.text);
          }

          if (event.type === "message_delta") {
            updateMessage(assistantId, (item) => ({
              ...item,
              content: item.content + event.text,
            }));
          }

          if (event.type === "citations") {
            updateMessage(assistantId, (item) => ({
              ...item,
              citations: event.papers,
            }));
          }

          if (event.type === "tool_start") {
            updateMessage(assistantId, (item) => ({
              ...item,
              tools: [
                ...(item.tools ?? []),
                {
                  id: `${event.name}-${Date.now()}`,
                  name: event.name,
                  label: event.label,
                  status: "running",
                },
              ],
            }));
          }

          if (event.type === "tool_result") {
            updateMessage(assistantId, (item) => {
              const tools = [...(item.tools ?? [])];

              for (let index = tools.length - 1; index >= 0; index -= 1) {
                if (tools[index].name === event.name && tools[index].status === "running") {
                  tools[index] = {
                    ...tools[index],
                    status: "done",
                    summary: event.summary,
                  };
                  break;
                }
              }

              return { ...item, tools };
            });
          }

          if (event.type === "action_proposed") {
            updateMessage(assistantId, (item) => ({
              ...item,
              actions: [
                ...(item.actions ?? []),
                { ...event.action, status: "pending" },
              ],
            }));
          }

          if (event.type === "error") {
            updateMessage(assistantId, (item) => ({
              ...item,
              content: `${item.content}\n\n请求失败：${event.message}`,
            }));
          }
        },
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        updateMessage(assistantId, (item) => ({
          ...item,
          content: `请求失败：${error.message}`,
        }));
      }
    } finally {
      setGenerating(false);
      setStatus("");
      abortRef.current = null;
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
    setGenerating(false);
    setStatus("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  async function handleConfirmAction(messageId, action) {
    setBusyActionId(action.id);

    try {
      await confirmAgentAction(action.id);
      updateMessage(messageId, (item) => ({
        ...item,
        actions: item.actions.map((current) =>
          current.id === action.id
            ? { ...current, status: "confirmed" }
            : current,
        ),
      }));
    } catch (error) {
      updateMessage(messageId, (item) => ({
        ...item,
        actions: item.actions.map((current) =>
          current.id === action.id
            ? { ...current, status: "error", error: error.message }
            : current,
        ),
      }));
    } finally {
      setBusyActionId("");
    }
  }

  function handleDismissAction(messageId, action) {
    updateMessage(messageId, (item) => ({
      ...item,
      actions: item.actions.map((current) =>
        current.id === action.id
          ? { ...current, status: "dismissed" }
          : current,
      ),
    }));
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Agent"
        title="对文献库进行提问"
        description={`当前选中 ${selectedPapers.length} 篇论文。Agent 会在这些论文的摘要片段中检索证据，并返回引用来源。`}
      />

      <div className="grid min-h-[620px] gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-md bg-slate-950 text-white">
              <Bot size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">Research Agent</p>
              <p className="text-xs text-slate-500">Foundation mode</p>
            </div>
            <Pill tone="teal">Agent preview</Pill>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {messages.map((message, index) => (
              <div
                key={message.id ?? `${message.role}-${index}`}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-2xl rounded-lg bg-slate-950 px-4 py-3 text-sm leading-6 text-white"
                      : "max-w-2xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content || "..."}</p>
                  {message.tools?.map((tool) => (
                    <ToolCallCard key={tool.id} tool={tool} />
                  ))}
                  {message.actions?.map((action) => (
                    <ActionConfirmCard
                      key={action.id}
                      action={action}
                      busy={busyActionId === action.id}
                      onConfirm={(nextAction) =>
                        handleConfirmAction(message.id, nextAction)
                      }
                      onDismiss={(nextAction) =>
                        handleDismissAction(message.id, nextAction)
                      }
                    />
                  ))}
                  {message.citations?.length ? (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {message.citations.map((paper) => (
                        <p key={paper.id} className="text-xs font-semibold text-slate-500">
                          {paper.title}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <form
            className="border-t border-slate-200 bg-white p-4"
            onSubmit={handleSubmit}
          >
            <label className="flex items-end gap-2 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="添加论文"
              >
                <Paperclip size={17} aria-hidden="true" />
              </button>
              <span className="sr-only">向 Agent 提问</span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows="2"
                placeholder="例如：哪个方向更适合做毕业设计？"
                className="min-h-10 flex-1 resize-none border-0 bg-transparent px-1 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!draft.trim() || generating}
                className="grid size-9 shrink-0 place-items-center rounded-md bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="发送消息"
              >
                <CornerDownLeft size={17} aria-hidden="true" />
              </button>
            </label>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Sparkles size={13} aria-hidden="true" />
              {status || "Enter 发送，Shift + Enter 换行"}
              <button
                type="button"
                onClick={stopGeneration}
                disabled={!generating}
                className="ml-auto inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Square size={12} aria-hidden="true" />
                停止
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <Surface className="p-4">
            <h2 className="text-sm font-black text-slate-950">当前论文上下文</h2>
            {selectedPapers.length ? (
              <div className="mt-3 space-y-2">
                {selectedPapers.slice(0, 5).map((paper) => (
                  <p key={paper.id} className="text-xs leading-5 text-slate-600">
                    {paper.title}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-slate-600">
                还没有选中论文。先到检索页收藏论文，再回来提问。
              </p>
            )}
          </Surface>
          <Surface className="p-4">
            <h2 className="text-sm font-black text-slate-950">可能调用的工具</h2>
            <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
              <p>searchPapers</p>
              <p>comparePapers</p>
              <p>searchChunks</p>
              <p>saveEvidence</p>
            </div>
          </Surface>
          <Surface className="p-4">
            <h2 className="text-sm font-black text-slate-950">引用来源</h2>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              后续流式回答会在消息下方展示论文标题、年份、DOI 和命中片段。
            </p>
          </Surface>
        </aside>
      </div>
    </div>
  );
}
