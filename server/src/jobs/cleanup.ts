/**
 * Cleanup script for multer/temp upload files.
 *
 * Usage (from repository root):
 *   # dry run, look at default uploads folder or provide --dir
 *   node ./server/jobs/cleanup.ts --days=7 --dir="C:\path\to\uploads" --dry-run
 *
 * Options:
 *   --dir=PATH    Directory to clean (defaults to ./uploads, falls back to OS temp dir)
 *   --days=N      Delete files older than N days (default: 7)
 *   --dry-run     Show files that would be deleted without removing them
 */

import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import os from "os";

type Args = {
  dir?: string;
  days: number;
  dryRun: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: any = { days: 7, dryRun: false };
  for (const a of argv) {
    if (a.startsWith("--dir=")) args.dir = a.split("=").slice(1).join("=");
    if (a.startsWith("--days="))
      args.days = Number(a.split("=").slice(1).join("=")) || 7;
    if (a === "--dry-run") args.dryRun = true;
  }
  return args;
}

async function pathExists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walkAndCleanup(dir: string, cutoffMs: number, dryRun: boolean) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    try {
      if (e.isDirectory()) {
        await walkAndCleanup(full, cutoffMs, dryRun);
      } else if (e.isFile()) {
        const s = await stat(full);
        if (s.mtimeMs < cutoffMs) {
          if (dryRun) {
            console.log(
              `[DRY] would delete: ${full} (mtime: ${s.mtime.toISOString()})`
            );
          } else {
            try {
              await unlink(full);
              console.log(`deleted: ${full}`);
            } catch (err) {
              console.error(
                `failed to delete ${full}:`,
                (err as Error).message
              );
            }
          }
        }
      }
    } catch (err) {
      console.error(`error processing ${full}:`, (err as Error).message);
    }
  }
}

async function main() {
  const { dir, days, dryRun } = parseArgs();

  const defaultUploads = path.resolve(process.cwd(), "uploads");
  const targetDir = dir
    ? path.resolve(dir)
    : (await pathExists(defaultUploads))
    ? defaultUploads
    : os.tmpdir();

  console.log(`cleanup target: ${targetDir}`);
  console.log(`delete files older than ${days} day(s). dryRun=${dryRun}`);

  if (!(await pathExists(targetDir))) {
    console.error(`target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  await walkAndCleanup(targetDir, cutoffMs, dryRun);
  console.log("cleanup finished");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("cleanup failed:", err);
    process.exit(1);
  });
}

export {};
