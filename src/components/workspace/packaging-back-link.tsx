"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { packagingWorkspaceHref } from "@/lib/packaging-navigation";
export default function PackagingBackLink({
  importId,
  rowNumber,
  label = "Packaging workspace",
}: {
  importId: string;
  rowNumber: number;
  label?: string;
}) {
  const router = useRouter();
  return (
    <Link
      className="gallery-analyse-link"
      href={packagingWorkspaceHref(importId, rowNumber)}
      onNavigate={(event) => {
        if (window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
