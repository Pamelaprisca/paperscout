import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main className="page-shell narrow-page not-found">
      <p className="eyebrow">404</p>
      <h1>这个页面不存在</h1>
      <p className="page-intro">当前地址没有对应的 TinyBoard 页面。</p>
      <Link className="button button-primary" to="/">
        返回看板
      </Link>
    </main>
  );
}
