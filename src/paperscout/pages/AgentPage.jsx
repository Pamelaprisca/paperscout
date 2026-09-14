import {
  Bot,
  Copy,
  CornerDownLeft,
  Paperclip,
  RotateCcw,
  Square,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { confirmAgentAction, streamAgentChat } from "../api/agent.js";
import { ActionConfirmCard, ToolCallCard } from "../components/AgentToolCard.jsx";
import { EvidencePanel } from "../components/EvidencePanel.jsx";
import { useToast } from "../components/Toast.jsx";
import { PageHeader, Pill, Surface } from "../components/ui.jsx";
import { buildAgentHistory } from "../lib/agentHistory.js";
import { getSelectedPapers } from "../lib/selectedPapers.js";

const initialMessages = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "我是 PaperScout Agent。你可以让我检索论文、比较观点、总结某篇论文，或者为一段论述寻找可引用证据。",
  },
];

function toPlainText(value) {
  return String(value ?? "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ");
}

export default function AgentPage() {
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [busyActionId, setBusyActionId] = useState("");
  const [selectedPapers] = useState(() => getSelectedPapers());
  const abortRef = useRef(null);
  const activeAssistantIdRef = useRef("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages, status]);

  function updateMessage(messageId, updater) {
    setMessages((current) =>
      current.map((item) =>
        item.id === messageId ? updater(item) : item,
      ),
    );
  }

  async function sendMessage({
    text = draft,
    appendUserMessage = true,
  } = {}) {
    const message = text.trim();
    if (!message || generating) return;

    const history = buildAgentHistory(messages);
    const assistantId = `assistant-${Date.now()}`;

    if (appendUserMessage) setDraft("");
    activeAssistantIdRef.current = assistantId;
    setMessages((current) => [
      ...current,
      ...(appendUserMessage
        ? [{ id: `user-${Date.now()}`, role: "user", content: message }]
        : []),
      {
        id: assistantId,
        role: "assistant",
        content: "",
        citations: [],
        evidence: [],
        evidenceClaim: "",
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
          if (controller.signal.aborted) return;

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

          if (event.type === "evidence") {
            updateMessage(assistantId, (item) => ({
              ...item,
              evidence: event.items ?? [],
              evidenceClaim: event.claim ?? "",
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
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      if (activeAssistantIdRef.current === assistantId) {
        activeAssistantIdRef.current = "";
      }
    }
  }

  function stopGeneration() {
    const assistantId = activeAssistantIdRef.current;
    abortRef.current?.abort();
    if (assistantId) {
      updateMessage(assistantId, (item) => ({
        ...item,
        status: "cancelled",
      }));
    }
    activeAssistantIdRef.current = "";
    setGenerating(false);
    setStatus("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  async function copyMessage(content) {
    await navigator.clipboard.writeText(toPlainText(content));
    showToast("回答已复制");
  }

  function regenerateAnswer(messageId) {
    const messageIndex = messages.findIndex((item) => item.id === messageId);
    const previousUserMessage = messages
      .slice(0, messageIndex)
      .reverse()
      .find((item) => item.role === "user");

    if (previousUserMessage) {
      sendMessage({
        text: previousUserMessage.content,
        appendUserMessage: false,
      });
    }
  }

  const lastAssistantId = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.id;

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
    <div className="flex h-[calc(100vh-7rem)] min-h-[560px] flex-col gap-5 overflow-hidden">
      <div className="shrink-0">
        <PageHeader
          eyebrow="Agent"
          title="对文献库进行提问"
          description={`当前选中 ${selectedPapers.length} 篇论文。Agent 会在这些论文的摘要片段中检索证据，并返回引用来源。`}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-md bg-slate-950 text-white">
              <Bot size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">Research Agent</p>
              <p className="text-xs text-slate-500">Streaming plain text</p>
            </div>
            <Pill tone="teal">Agent preview</Pill>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {messages.map((message, index) => (
              <div
                key={message.id ?? `${message.role}-${index}`}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-3xl rounded-lg bg-slate-950 px-4 py-3 text-sm leading-6 text-white"
                      : message.status === "cancelled"
                        ? "max-w-3xl rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-500"
                      : "max-w-3xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                  }
                >
                  <p className="whitespace-pre-wrap">
                    {toPlainText(message.content) ||
                      (message.status === "cancelled"
                        ? "本次回答已取消"
                        : generating
                          ? ""
                          : "...")}
                    {generating && message.id === lastAssistantId ? (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-teal-700 align-[-2px]" />
                    ) : null}
                  </p>
                  {message.role === "assistant" && message.content ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={() => copyMessage(message.content)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
                      >
                        <Copy size={13} aria-hidden="true" />
                        复制
                      </button>
                      {!generating ? (
                        <button
                          type="button"
                          onClick={() => regenerateAnswer(message.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
                        >
                          <RotateCcw size={13} aria-hidden="true" />
                          重新回答
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {message.evidence?.length ? (
                    <EvidencePanel
                      claim={message.evidenceClaim}
                      items={message.evidence}
                    />
                  ) : null}
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
            <div ref={endRef} />
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

        <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
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
