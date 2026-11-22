// The Gilded Gallery — everything the eye sees, drawn on one canvas.
// One job: draw the current state. No updates, no input, no rules here.
// The canvas is always 1280x800; main.js scales it to the window.
import { VIEW_W, VIEW_H, HUD_H, PALETTE, ROOM } from './config.js';

const TITLE_FONT = 'Georgia, "Times New Roman", serif';
const UI_FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
}

function drawFloor(ctx, level) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  // Parquet tiles.
  ctx.fillStyle = PALETTE.floorB;
  const tile = 64;
  for (let ty = ROOM.y; ty < ROOM.y + ROOM.h; ty += tile) {
    for (let tx = ROOM.x; tx < ROOM.x + ROOM.w; tx += tile) {
      if (((tx / tile) + (ty / tile)) % 2 === 0) {
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
  }
  // Gold inlay border just inside the walls.
  ctx.strokeStyle = PALETTE.floorInlay;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + 26, ROOM.y + 26, ROOM.w - 52, ROOM.h - 52);
  // Deep-red carpet runner down the middle of the hall.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(ROOM.x + ROOM.w / 2 - 55, ROOM.y + 16, 110, ROOM.h - 32);
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + ROOM.w / 2 - 55, ROOM.y + 16, 110, ROOM.h - 32);
  // Wall paintings.
  for (const p of level.paintings) {
    ctx.fillStyle = '#0c0e18';
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    ctx.fillStyle = p.hue;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = PALETTE.caseFrame;
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(p.x + 6, p.y + 6, p.w / 3, p.h / 3);
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
}

function drawCovers(ctx, level) {
  for (const c of level.covers) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#10131f';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(143, 183, 217, 0.30)';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.strokeStyle = PALETTE.caseFrame;
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(c.x + 8, c.y + 6, c.w - 30, 5);
    } else if (c.kind === 'statue') {
      ctx.fillStyle = PALETTE.statue;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a97b5';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#c8d0e2';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = PALETTE.pillar;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = PALETTE.wallTrim;
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(c.x + 6, c.y + 6, 6, c.h - 12);
    }
  }
}

function drawExit(ctx, level, diamondTaken, now) {
  const e = level.exit;
  const pulse = diamondTaken ? 0.55 + 0.35 * Math.sin(now / 260) : 0.22;
  ctx.fillStyle = `rgba(88, 224, 138, ${pulse})`;
  ctx.fillRect(e.x - 8, e.y - 6, e.w + 16, e.h + 14);
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.font = `bold 15px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(diamondTaken ? 'EXIT — GO!' : 'EXIT', e.x + e.w / 2, e.y - 12);
  ctx.textAlign = 'left';
}

function drawLoot(ctx, state, now) {
  for (const item of state.loot) {
    if (item.taken) continue;
    const bob = Math.sin(now / 380 + item.x) * 2;
    if (item.kind === 'gem') {
      ctx.save();
      ctx.shadowColor = PALETTE.lootGold;
      ctx.shadowBlur = 14;
      ctx.fillStyle = PALETTE.lootGold;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 10 + bob);
      ctx.lineTo(item.x + 8, item.y + bob);
      ctx.lineTo(item.x, item.y + 10 + bob);
      ctx.lineTo(item.x - 8, item.y + bob);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(item.x, item.y + bob);
      ctx.rotate(-0.12);
      ctx.fillStyle = '#0c0e18';
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillStyle = '#b0703a';
      ctx.fillRect(-13, -9, 26, 18);
      ctx.strokeStyle = PALETTE.caseFrame;
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -12, 32, 24);
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 12px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`$${item.value}`, item.x, item.y + 26 + bob);
    ctx.textAlign = 'left';
  }
}

function drawDiamond(ctx, state, now) {
  if (state.diamondTaken) return;
  const d = state.level.diamond;
  const pulse = 1 + 0.12 * Math.sin(now / 300);
  ctx.save();
  ctx.translate(d.x, d.y);
  // Pedestal.
  ctx.fillStyle = '#2a2f47';
  ctx.fillRect(-16, 8, 32, 14);
  ctx.strokeStyle = PALETTE.caseFrame;
  ctx.lineWidth = 2;
  ctx.strokeRect(-16, 8, 32, 14);
  // Halo.
  ctx.shadowColor = PALETTE.diamond;
  ctx.shadowBlur = 26;
  ctx.fillStyle = PALETTE.diamond;
  ctx.beginPath();
  ctx.moveTo(0, -16 * pulse);
  ctx.lineTo(12 * pulse, 0);
  ctx.lineTo(0, 16 * pulse);
  ctx.lineTo(-12 * pulse, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = PALETTE.diamond;
  ctx.font = `bold 14px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('◆ AURORA DIAMOND', d.x, d.y - 30);
  ctx.textAlign = 'left';
  if (state.diamondChannel > 0) {
    ctx.strokeStyle = PALETTE.diamond;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 30, -Math.PI / 2, -Math.PI / 2 + state.diamondChannel * Math.PI * 2);
    ctx.stroke();
  }
}

function drawSmoke(ctx, state) {
  for (const s of state.smokes) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 216, 230, 0.35)';
    ctx.beginPath();
    ctx.arc(s.x - s.r * 0.3, s.y - s.r * 0.2, s.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    if (!cam.disabled) {
      drawCone(ctx, cam.x, cam.y, cam.angle, 268, 0.44, PALETTE.coneCamera, PALETTE.coneCameraEdge);
    }
    ctx.fillStyle = cam.disabled ? '#4a5068' : '#c22a3a';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8ecf5';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = cam.disabled ? '#7a8098' : '#ff5b6e';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2ead8';
    ctx.font = `bold 11px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(cam.disabled ? 'OFF' : 'CAM', cam.x, cam.y + 24);
    ctx.textAlign = 'left';
  }
}

function drawGuards(ctx, state, now) {
  for (const g of state.guards) {
    const chasing = g.state === 'chase';
    const colour = chasing ? PALETTE.coneChase : PALETTE.coneGuard;
    const edge = chasing ? 'rgba(255, 84, 64, 0.6)' : PALETTE.coneGuardEdge;
    drawCone(ctx, g.x, g.y, g.facing, 232, 0.56, colour, edge);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 10, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = chasing ? '#7a2e2e' : PALETTE.guardBody;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.guardTrim;
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing) * 7, g.y + Math.sin(g.facing) * 7, 4, 0, Math.PI * 2);
    ctx.fill();
    if (chasing) {
      ctx.strokeStyle = `rgba(255, 77, 61, ${0.5 + 0.4 * Math.sin(now / 140)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = chasing ? '#ff6b5e' : '#ffd65a';
    ctx.font = `bold 20px ${UI_FONT}`;
    ctx.textAlign = 'center';
    if (chasing) ctx.fillText('!', g.x, g.y - 22);
    else if (g.spot > 0.25) ctx.fillText('?', g.x, g.y - 22);
    ctx.textAlign = 'left';
  }
}

function drawThief(ctx, state, now) {
  const p = state.player;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (p.sneaking) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(47, 214, 200, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.thiefDark;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 6, p.y + Math.sin(p.facing) * 6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 12px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('WREN', p.x, p.y - 20);
  ctx.textAlign = 'left';
}

function alarmColour(alarm) {
  if (alarm >= 75) return PALETTE.alarmHigh;
  if (alarm >= 40) return PALETTE.alarmMid;
  return PALETTE.alarmLow;
}

function drawHUD(ctx, state, now) {
  ctx.fillStyle = '#10131f';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);
  // Left: room + objective.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 19px ${UI_FONT}`;
  ctx.fillText(state.level.name, 20, 30);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = `14px ${UI_FONT}`;
  const objective = state.diamondTaken
    ? 'Diamond secured — reach the EXIT door'
    : 'Steal the Aurora Diamond, then escape';
  ctx.fillText(objective, 20, 55);
  // Centre: alarm meter.
  const barX = 470;
  const barW = 300;
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 17px ${UI_FONT}`;
  ctx.textAlign = 'center';
  const alarmLabel = state.lockdownLeft > 0 ? 'LOCKDOWN!' : 'ALARM';
  ctx.fillStyle = state.lockdownLeft > 0 && Math.sin(now / 120) > 0 ? '#ff4d3d' : PALETTE.text;
  ctx.fillText(alarmLabel, barX + barW / 2, 26);
  ctx.fillStyle = '#0a0c14';
  roundRect(ctx, barX, 34, barW, 24, 5);
  ctx.fill();
  ctx.fillStyle = alarmColour(state.alarm);
  const fillW = Math.max(0, Math.min(1, state.alarm / 100)) * barW;
  if (fillW > 2) {
    roundRect(ctx, barX, 34, fillW, 24, 5);
    ctx.fill();
  }
  ctx.strokeStyle = '#3a415f';
  ctx.lineWidth = 2;
  roundRect(ctx, barX, 34, barW, 24, 5);
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${UI_FONT}`;
  ctx.fillText(`${Math.round(state.alarm)}%`, barX + barW / 2, 52);
  ctx.textAlign = 'left';
  // Right: loot, time, tools.
  ctx.fillStyle = PALETTE.lootGold;
  ctx.font = `bold 21px ${UI_FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`LOOT $${state.lootTotal}`, VIEW_W - 20, 30);
  ctx.fillStyle = state.timeLeft < 30 ? '#ff4d3d' : PALETTE.text;
  ctx.font = `bold 18px ${UI_FONT}`;
  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, VIEW_W - 20, 56);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = `15px ${UI_FONT}`;
  const diamondMark = state.diamondTaken ? '◆ AURORA ✓' : '◆ AURORA —';
  ctx.fillText(`${diamondMark}   SMOKE ×${state.smokeCount}   EMP ×${state.empCount}`, VIEW_W - 150, 56);
  ctx.textAlign = 'left';
  // Controls hint along the bottom margin.
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = `13px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move   ·   SHIFT sneak   ·   Q smoke ($150)   ·   E EMP ($300)   ·   P pause   ·   M mute', VIEW_W / 2, VIEW_H - 10);
  ctx.textAlign = 'left';
  // Toast message.
  if (state.messageLeft > 0 && state.message) {
    ctx.fillStyle = 'rgba(16, 19, 31, 0.92)';
    const tw = ctx.measureText(state.message).width + 28;
    roundRect(ctx, VIEW_W / 2 - tw / 2, 88, tw, 34, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 15px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, 111);
    ctx.textAlign = 'left';
  }
}

function overlay(ctx, title, lines, accent, footer) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.86)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = `bold 54px ${TITLE_FONT}`;
  ctx.fillText(title, VIEW_W / 2, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `18px ${UI_FONT}`;
  let y = 310;
  for (const line of lines) {
    ctx.fillText(line, VIEW_W / 2, y);
    y += 32;
  }
  if (footer) {
    ctx.fillStyle = PALETTE.lootGold;
    ctx.font = `bold 19px ${UI_FONT}`;
    ctx.fillText(footer, VIEW_W / 2, y + 22);
  }
  ctx.textAlign = 'left';
}

function drawOverlays(ctx, state) {
  if (state.screen === 'title') {
    overlay(ctx, 'THE GILDED GALLERY', [
      'One night. One gallery. One impossible diamond.',
      '',
      'You are Wren, thief-for-hire. Cross the Meridian Gallery,',
      'read the guards’ cones, dodge the cameras, lift the Aurora Diamond,',
      'and slip out the service door before the alarm hits 100%.',
      '',
      'WASD / arrows — move      SHIFT — sneak (harder to spot)',
      'Q — smoke bomb ($150 of loot)      E — EMP, cameras off 6s ($300)',
      'Grab gems and paintings on the way. Three rooms. One getaway.',
    ], PALETTE.lootGold, 'Press ENTER or click to begin the heist');
  } else if (state.screen === 'brief') {
    overlay(ctx, state.level.name, [
      state.level.briefing,
      '',
      `Guards: ${state.level.guards.length}    Cameras: ${state.level.cameras.length}    Time: ${Math.floor(state.level.timeSeconds / 60)}:${String(state.level.timeSeconds % 60).padStart(2, '0')}`,
      '',
      'Smoke and EMP cost loot — spend it only when the cone leaves no choice.',
    ], PALETTE.text, 'Press ENTER to slip inside');
  } else if (state.screen === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      state.caughtReason,
      '',
      `Loot kept: $${state.lootTotal}    Rooms cleared: ${state.levelIndex}`,
      '',
      'The guards knew the room better than you did. Read the cones,',
      'use the cover, and spend a smoke when the patrol turns.',
    ], '#ff4d3d', 'Press R to retry this room — ENTER to restart the heist');
  } else if (state.screen === 'leveldone') {
    overlay(ctx, 'ROOM CLEARED', [
      `${state.level.name} — the Diamond is yours.`,
      '',
      `Loot so far: $${state.lootTotal}`,
      `Time to spare: ${Math.floor(Math.max(0, state.timeLeft))}s`,
      '',
      'One room down. The next one watches closer.',
    ], PALETTE.exitGlow, 'Press ENTER for the next room');
  } else if (state.screen === 'won') {
    overlay(ctx, 'CLEAN GETAWAY', [
      'Three rooms. Three patrols outplayed. The Aurora Diamond is gone',
      'before the Meridian Gallery even knew it was missing.',
      '',
      `Total loot: $${state.lootTotal}`,
      `Heist time: ${state.heistTimeText}`,
    ], PALETTE.lootGold, 'Press R to run it again');
  } else if (state.screen === 'paused') {
    overlay(ctx, 'PAUSED', [
      'The gallery waits. The guards do not — not while you are gone.',
    ], PALETTE.text, 'Press P to keep moving');
  }
}

export function drawGame(ctx, state, now) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === 'title') {
    drawFloor(ctx, state.level);
    drawWalls(ctx, state.level);
    drawCovers(ctx, state.level);
    drawDiamond(ctx, state, now);
    drawLoot(ctx, state, now);
    drawHUD(ctx, state, now);
    drawOverlays(ctx, state);
    return;
  }
  drawFloor(ctx, state.level);
  drawCovers(ctx, state.level);
  drawWalls(ctx, state.level);
  drawExit(ctx, state.level, state.diamondTaken, now);
  drawLoot(ctx, state, now);
  drawDiamond(ctx, state, now);
  drawSmoke(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state, now);
  drawThief(ctx, state, now);
  // Alarm vignette: the room itself turns red as the alarm climbs.
  if (state.alarm > 55 && state.screen === 'playing') {
    const a = Math.min(0.35, (state.alarm - 55) / 100 * (0.7 + 0.3 * Math.sin(now / 160)));
    ctx.strokeStyle = `rgba(255, 60, 45, ${a})`;
    ctx.lineWidth = 26;
    ctx.strokeRect(13, HUD_H + 13, VIEW_W - 26, VIEW_H - HUD_H - 26);
  }
  drawHUD(ctx, state, now);
  drawOverlays(ctx, state);
}
