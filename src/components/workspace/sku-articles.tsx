"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import PackagingArticles from "./packaging-articles";
import SkuArticle6Assessment from "./sku-article-6-assessment";
import styles from "./sku-analysis.module.css";

export default function SkuArticles({
  importId,
  rowNumber,
  productName,
  article,
}: {
  importId: string;
  rowNumber: number;
  productName: string;
  article?: number;
}) {
  const router = useRouter();
  const overview = `/dashboard/packaging/${importId}/${rowNumber}/analyse`;
  const selection = `${overview}?view=sku-assessment`;
  if (article === 6)
    return (
      <SkuArticle6Assessment productName={productName} backHref={selection} />
    );
  if (article)
    return (
      <div className={styles.page}>
        <header className={styles.heading}>
          <div>
            <span>SKU ANALYSE · ARTICLE {article}</span>
            <h1>Article {article} assessment</h1>
            <p>{productName}</p>
          </div>
          <Link className={styles.back} href={selection}>
            <ArrowLeft size={15} /> Back to Articles
          </Link>
        </header>
        <div className={styles.empty}>
          <Clock3 size={36} />
          <h2>Coming soon</h2>
          <p>The SKU assessment for Article {article} is not available yet.</p>
          <Link href={selection}>Choose another article</Link>
        </div>
      </div>
    );
  return (
    <div className={styles.page}>
      <PackagingArticles
        scope="sku"
        componentName={productName}
        importId={importId}
        rowNumber={rowNumber}
        onBack={() => router.push(overview)}
        articleHref={(number) => `${selection}&article=${number}`}
      />
    </div>
  );
}
