"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
function parseArgs() {
    const argv = process.argv.slice(2);
    const args = { days: 7, dryRun: false };
    for (const a of argv) {
        if (a.startsWith("--dir="))
            args.dir = a.split("=").slice(1).join("=");
        if (a.startsWith("--days="))
            args.days = Number(a.split("=").slice(1).join("=")) || 7;
        if (a === "--dry-run")
            args.dryRun = true;
    }
    return args;
}
function pathExists(p) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, promises_1.stat)(p);
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
function walkAndCleanup(dir, cutoffMs, dryRun) {
    return __awaiter(this, void 0, void 0, function* () {
        const entries = yield (0, promises_1.readdir)(dir, { withFileTypes: true });
        for (const e of entries) {
            const full = path_1.default.join(dir, e.name);
            try {
                if (e.isDirectory()) {
                    yield walkAndCleanup(full, cutoffMs, dryRun);
                }
                else if (e.isFile()) {
                    const s = yield (0, promises_1.stat)(full);
                    if (s.mtimeMs < cutoffMs) {
                        if (dryRun) {
                            console.log(`[DRY] would delete: ${full} (mtime: ${s.mtime.toISOString()})`);
                        }
                        else {
                            try {
                                yield (0, promises_1.unlink)(full);
                                console.log(`deleted: ${full}`);
                            }
                            catch (err) {
                                console.error(`failed to delete ${full}:`, err.message);
                            }
                        }
                    }
                }
            }
            catch (err) {
                console.error(`error processing ${full}:`, err.message);
            }
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const { dir, days, dryRun } = parseArgs();
        const defaultUploads = path_1.default.resolve(process.cwd(), "uploads");
        const targetDir = dir
            ? path_1.default.resolve(dir)
            : (yield pathExists(defaultUploads))
                ? defaultUploads
                : os_1.default.tmpdir();
        console.log(`cleanup target: ${targetDir}`);
        console.log(`delete files older than ${days} day(s). dryRun=${dryRun}`);
        if (!(yield pathExists(targetDir))) {
            console.error(`target directory does not exist: ${targetDir}`);
            process.exit(1);
        }
        const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
        yield walkAndCleanup(targetDir, cutoffMs, dryRun);
        console.log("cleanup finished");
    });
}
if (require.main === module) {
    main().catch((err) => {
        console.error("cleanup failed:", err);
        process.exit(1);
    });
}
