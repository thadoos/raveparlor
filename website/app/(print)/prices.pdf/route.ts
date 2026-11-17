// Dev-only price list PDF export: renders /print/prices in local headless Chrome and returns it as a PDF.
// Works only where Chrome is installed (local dev); returns 404 in production.
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Fixed origin so the rendered URL can never come from the request's Host header.
const PRINT_URL = `http://127.0.0.1:${process.env.PORT ?? "3000"}/print/prices`;

export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const dir = await mkdtemp(join(tmpdir(), "prices-pdf-"));
  const file = join(dir, "price-list.pdf");
  try {
    await run(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--virtual-time-budget=5000",
      `--user-data-dir=${join(dir, "profile")}`,
      `--print-to-pdf=${file}`,
      PRINT_URL,
    ]);
    const pdf = await readFile(file);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="price-list.pdf"',
      },
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
