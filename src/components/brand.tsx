import Link from "next/link";
import Image from "next/image";
export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Anant Tattva home"
    >
      <Image
        src={
          light ? "/brand/anant-tattva-light.svg" : "/brand/anant-tattva.svg"
        }
        alt="ANANT TATTVA"
        width={283}
        height={90}
        className={`brand-image ${light ? "" : "brand-day"}`}
        priority
      />
      {!light && (
        <Image
          src="/brand/anant-tattva-light.svg"
          alt=""
          width={283}
          height={90}
          className="brand-image brand-night"
          priority
        />
      )}
    </Link>
  );
}
