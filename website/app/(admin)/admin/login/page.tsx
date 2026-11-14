import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSiteView } from "@/lib/content/published";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  "not-admin": "This account doesn't have admin access.",
};

/** Reads the query string, so it streams in behind its own boundary and the rest stays static. */
async function LoginNotice({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { error } = await searchParams;
  const notice = typeof error === "string" ? NOTICES[error] : undefined;
  return notice ? <p className="admin-error">{notice}</p> : null;
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { images, site } = await getSiteView();
  const hero = images.heroLeft;
  return (
    <main className={styles.page}>
      <div className={styles.media}>
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          sizes="(max-width: 820px) 100vw, 50vw"
          style={{ objectPosition: hero.position }}
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className={styles.panel}>
        <div className={styles.inner}>
          <p className="admin-label">{site.brandName}</p>
          <h1 className={styles.title}>Admin</h1>
          <LoginForm
            notice={
              <Suspense fallback={null}>
                <LoginNotice searchParams={searchParams} />
              </Suspense>
            }
          />
        </div>
      </div>
    </main>
  );
}
