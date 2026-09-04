import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe("TinyBoard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the seeded board", () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: /任务看板/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("修复移动端导航栏重叠"),
    ).toBeInTheDocument();
  });

  it("filters issues using search", async () => {
    const user = userEvent.setup();
    renderApp();

    const search = screen.getByLabelText("搜索");
    await user.type(search, "快捷键");

    await waitFor(
      () => {
        expect(
          screen.getByText("支持 N 快捷键新建任务"),
        ).toBeInTheDocument();
        expect(
          screen.queryByText("修复移动端导航栏重叠"),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("creates a new issue", async () => {
    const user = userEvent.setup();
    renderApp("/issues/new");

    await user.type(screen.getByLabelText("标题"), "修复键盘焦点顺序");
    await user.type(
      screen.getByLabelText("描述"),
      "键盘焦点应该按照合理的顺序在页面中移动。",
    );
    await user.type(screen.getByLabelText("负责人"), "Mia");
    await user.type(screen.getByLabelText("Tags"), "无障碍, 前端");

    await user.click(
      screen.getByRole("button", { name: /创建任务/i }),
    );

    expect(
      await screen.findByRole("heading", { name: "修复键盘焦点顺序" }),
    ).toBeInTheDocument();
  });

  it("edits an existing issue", async () => {
    const user = userEvent.setup();
    renderApp("/issues/101/edit");

    const title = screen.getByLabelText("标题");
    await user.clear(title);
    await user.type(title, "修复响应式头部布局");

    await user.click(
      screen.getByRole("button", { name: /保存修改/i }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "修复响应式头部布局",
      }),
    ).toBeInTheDocument();
  });

  it("validates the create form before submitting", async () => {
    const user = userEvent.setup();
    renderApp("/issues/new");

    await user.click(
      screen.getByRole("button", { name: /创建任务/i }),
    );

    expect(
      screen.getByText(/标题至少需要 3 个字/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/请补充更多上下文/i),
    ).toBeInTheDocument();
  });

  it("deletes an issue after confirmation", async () => {
    const user = userEvent.setup();
    renderApp("/issues/101");

    await user.click(
      screen.getByRole("button", { name: "删除任务" }),
    );

    await user.click(
      screen.getByRole("button", { name: /确认删除/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /任务看板/i }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("修复移动端导航栏重叠"),
    ).not.toBeInTheDocument();
  });
});
