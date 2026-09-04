import { useEffect } from "react";

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function useKeyboardShortcut(key, callback, options = {}) {
  const { allowWhileTyping = false } = options;

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.key.toLowerCase() !== key.toLowerCase() ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (!allowWhileTyping && isTypingTarget(event.target)) {
        return;
      }

      callback(event);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [allowWhileTyping, callback, key]);
}
