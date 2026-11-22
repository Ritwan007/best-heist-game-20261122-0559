// The Gilded Gallery — the hand-in program (Node 22, standard library only).
//
// It copies this repository's game/ and screenshots/ into /output and writes
// /output/dossier.json with the vendored make.fun library, so the sealed
// scorer can check the entry and the judge can read it. The game itself is
// plain static files: game/index.html opens in a desktop browser and plays
// with no network request.
//
// Run it outside the grader's container with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsDir = join(repoRoot, 'screenshots');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the scorer's own limits, so a hand-in this program writes is
// one the scorer accepts: at most 4 screenshots of 256 KiB, at most 993
// game files totalling 48 MiB, no game path over 1000 bytes, and the
// dossier text capped at 160 KiB.
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Read back what was written: the dossier must exist, parse, and name the
// screenshots that were copied, or the hand-in is not worth submitting.
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
const shotCount = readdirSync(join(outputDir, 'screenshots')).filter((f) => !f.startsWith('.')).length;
console.log(`handed in ${shotCount} screenshot(s), dossier ${dossierPath} (${readFileSync(dossierPath).length} bytes)`);
if (shotCount < 3 || shotCount > 4) throw new Error(`expected 3-4 screenshots, found ${shotCount}`);
if (typeof dossier !== 'object' || dossier === null) throw new Error('dossier did not parse');
