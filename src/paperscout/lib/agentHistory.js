export function buildAgentHistory(messages) {
  const history = [];

  for (const item of messages) {
    if (item.role === "assistant" && item.status === "cancelled") {
      if (history.at(-1)?.role === "user") {
        history.pop();
      }
      continue;
    }

    history.push({
      role: item.role,
      content: item.content,
    });
  }

  return history;
}
