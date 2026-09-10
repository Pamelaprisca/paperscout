import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

class MemoryStorage {
  #store = new Map();

  clear() {
    this.#store.clear();
  }

  getItem(key) {
    return this.#store.has(String(key)) ? this.#store.get(String(key)) : null;
  }

  key(index) {
    return [...this.#store.keys()][index] ?? null;
  }

  get length() {
    return this.#store.size;
  }

  removeItem(key) {
    this.#store.delete(String(key));
  }

  setItem(key, value) {
    this.#store.set(String(key), String(value));
  }
}

if (!window.localStorage) {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
}

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
}

afterEach(() => {
  cleanup();
});
