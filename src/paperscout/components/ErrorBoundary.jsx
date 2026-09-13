import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("PaperScout UI error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#f4f6f8] px-6">
          <div className="max-w-lg rounded-lg border border-rose-200 bg-white p-6 text-center">
            <h1 className="text-xl font-black text-slate-950">页面暂时无法显示</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              前端组件发生异常。刷新页面可以重新尝试。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
