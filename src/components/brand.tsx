import Link from "next/link";
export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Anant Tattva home"
    >
      <span className="brand-mark">ॐ</span>
      <span>
        <strong>ANANT</strong>
        <small>TATTVA</small>
      </span>
    </Link>
  );
}
