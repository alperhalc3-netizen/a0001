import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="meta">404</p>
        <h1>Not found</h1>
        <p>This page is not in the archive.</p>
        <p>
          <Link href="/">Return home</Link>
        </p>
      </header>
    </div>
  );
}
