// The Gilded Gallery — seeing and being seen.
// One job: answer "can this watcher see the thief?" with pure geometry.
// A wall, a display case, a statue, a pillar or a smoke cloud blocks sight.
import { SNEAK_RANGE_FACTOR } from './config.js';

function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

function segmentHitsCircle(x1, y1, x2, y2, c) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(x1 - c.x, y1 - c.y) <= c.r;
  let t = ((c.x - x1) * dx + (c.y - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return Math.hypot(px - c.x, py - c.y) <= c.r;
}

// True when nothing between the watcher and the thief blocks the view.
export function hasLineOfSight(wx, wy, px, py, blockers, smokes) {
  for (const b of blockers) {
    if (segmentHitsRect(wx, wy, px, py, b)) return false;
  }
  for (const s of smokes) {
    if (segmentHitsCircle(wx, wy, px, py, s)) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the thief stands inside a watcher's cone and sight line.
export function insideCone(wx, wy, facing, range, halfAngle, px, py, blockers, smokes, sneaking) {
  const dx = px - wx;
  const dy = py - wy;
  const dist = Math.hypot(dx, dy);
  const effectiveRange = sneaking ? range * SNEAK_RANGE_FACTOR : range;
  if (dist > effectiveRange) return false;
  if (dist < 1) return true;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(toThief, facing)) > halfAngle) return false;
  return hasLineOfSight(wx, wy, px, py, blockers, smokes);
}

// Circle (a walker) against a rect: push the circle out, return corrected pos.
export function resolveCircleRect(cx, cy, radius, r) {
  const nearestX = Math.max(r.x, Math.min(cx, r.x + r.w));
  const nearestY = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= radius * radius) return { x: cx, y: cy, hit: false };
  if (distSq === 0) {
    // Centre inside the rect: push out along the smallest penetration.
    const left = cx - r.x;
    const right = r.x + r.w - cx;
    const top = cy - r.y;
    const bottom = r.y + r.h - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: r.x - radius, y: cy, hit: true };
    if (m === right) return { x: r.x + r.w + radius, y: cy, hit: true };
    if (m === top) return { x: cx, y: r.y - radius, hit: true };
    return { x: cx, y: r.y + r.h + radius, hit: true };
  }
  const dist = Math.sqrt(distSq);
  const push = (radius - dist) / dist;
  return { x: cx + dx * push, y: cy + dy * push, hit: true };
}
