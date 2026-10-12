import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">404 / A DIFFERENT PATH</span>
      <h1>Let’s get you back on track.</h1>
      <Link className="btn btn-primary" href="/">
        Back to home
      </Link>
    </main>
  );
}
