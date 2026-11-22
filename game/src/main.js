// The Gilded Gallery — the game loop and the rules of the heist.
// One job: own the state, step it forward, and hand it to the renderer.
// Vision lives in vision.js, drawing in render.js, levels in levels.js.
import {
  VIEW_W, VIEW_H, ROOM, PLAYER, GUARD, CAMERA, ALARM, TOOLS,
  DIAMOND_CHANNEL_SECONDS, DIAMOND_CHANNEL_RADIUS, LOOT_PICKUP_RADIUS,
} from './config.js';
import { LEVELS } from './levels.js';
import { insideCone, resolveCircleRect } from './vision.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const input = new Input(canvas);
const sounds = new SoundBank();
input.onAnyKey = () => sounds.ensure();

const DIAMOND_VALUE = 2500;

function buildGuards(level) {
  return level.guards.map((g) => {
    const [sx, sy] = g.path[0];
    const [tx, ty] = g.path[1] ?? g.path[0];
    return {
      x: sx,
      y: sy,
      facing: Math.atan2(ty - sy, tx - sx),
      walkFacing: Math.atan2(ty - sy, tx - sx),
      state: 'patrol',
      waypointIndex: 1,
      direction: 1,
      pauseLeft: 0,
      pauseSeconds: g.pauseSeconds,
      scanPhase: Math.random() * 6,
      spot: 0,
      lastSeen: { x: sx, y: sy },
      returnTimer: 0,
    };
  });
}

function freshLevel(levelIndex) {
  const level = LEVELS[levelIndex];
  return {
    screen: 'brief',
    levelIndex,
    level,
    player: { x: level.start.x, y: level.start.y, facing: -Math.PI / 2, sneaking: false, moving: false },
    guards: buildGuards(level),
    cameras: level.cameras.map((c) => ({ ...c, angle: c.base, disabled: false })),
    loot: level.loot.map((l) => ({ ...l, taken: false })),
    diamondTaken: false,
    diamondChannel: 0,
    alarm: 0,
    lockdownLeft: 0,
    timeLeft: level.timeSeconds,
    smokes: [],
    empLeft: 0,
    smokeCount: 2,
    empCount: 1,
    message: '',
    messageLeft: 0,
    caughtReason: '',
    heistTimeText: '',
    frozen: false,
    elapsed: 0,
    lastAlarmTick: 0,
  };
}

const state = freshLevel(0);
state.screen = 'title';
state.lootTotal = 0;
state.lootAtLevelStart = 0;
state.heistSeconds = 0;

function toast(message) {
  state.message = message;
  state.messageLeft = 2.4;
}

function blockers() {
  return [...state.level.walls, ...state.level.covers];
}

function moveWithCollision(entity, dx, dy, radius) {
  let { x, y } = entity;
  x += dx;
  for (const b of blockers()) {
    const fixed = resolveCircleRect(x, y, radius, b);
    x = fixed.x;
    y = fixed.y;
  }
  y += dy;
  for (const b of blockers()) {
    const fixed = resolveCircleRect(x, y, radius, b);
    x = fixed.x;
    y = fixed.y;
  }
  x = Math.max(ROOM.x + 16 + radius, Math.min(ROOM.x + ROOM.w - 16 - radius, x));
  y = Math.max(ROOM.y + 16 + radius, Math.min(ROOM.y + ROOM.h - 16 - radius, y));
  entity.x = x;
  entity.y = y;
}

function turnToward(current, target, maxStep) {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

function guardSeesPlayer(g, range) {
  return insideCone(g.x, g.y, g.facing, range, GUARD.viewHalfAngle,
    state.player.x, state.player.y, blockers(), state.smokes, state.player.sneaking);
}

function cameraSeesPlayer(cam) {
  if (cam.disabled) return false;
  return insideCone(cam.x, cam.y, cam.angle, CAMERA.viewRange, CAMERA.viewHalfAngle,
    state.player.x, state.player.y, blockers(), state.smokes, state.player.sneaking);
}

function startChase(g) {
  if (g.state !== 'chase') {
    g.state = 'chase';
    g.lastSeen = { x: state.player.x, y: state.player.y };
    g.returnTimer = 0;
  }
}

function updateGuards(dt) {
  for (const g of state.guards) {
    const seen = guardSeesPlayer(g, GUARD.viewRange);
    if (seen) {
      g.spot = Math.min(1, g.spot + dt / GUARD.spotSecondsToChase);
      g.lastSeen = { x: state.player.x, y: state.player.y };
      if (g.spot >= 1 || state.alarm >= ALARM.chaseAt) startChase(g);
    } else {
      g.spot = Math.max(0, g.spot - dt * 0.8);
    }
    if (g.state === 'chase') {
      const speed = state.lockdownLeft > 0 ? GUARD.lockdownSpeed : GUARD.chaseSpeed;
      const dx = g.lastSeen.x - g.x;
      const dy = g.lastSeen.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const step = Math.min(dist, speed * dt);
        g.facing = turnToward(g.facing, Math.atan2(dy, dx), 8 * dt);
        moveWithCollision(g, (dx / dist) * step, (dy / dist) * step, GUARD.radius);
      }
      if (seen) {
        g.returnTimer = 0;
      } else {
        g.returnTimer += dt;
        if (g.returnTimer > 1.4) {
          g.state = 'patrol';
          g.spot = 0;
          const path = state.level.guards[state.guards.indexOf(g)].path;
          let best = 0;
          let bestDist = Infinity;
          path.forEach((wp, i) => {
            const d = Math.hypot(wp[0] - g.x, wp[1] - g.y);
            if (d < bestDist) { bestDist = d; best = i; }
          });
          g.waypointIndex = best;
        }
      }
    } else if (g.state === 'pause') {
      g.pauseLeft -= dt;
      g.scanPhase += dt * 2.2;
      g.facing = g.walkFacing + Math.sin(g.scanPhase) * 0.95;
      if (g.pauseLeft <= 0) {
        g.state = 'patrol';
        const path = state.level.guards[state.guards.indexOf(g)].path;
        g.waypointIndex += g.direction;
        if (g.waypointIndex >= path.length) {
          g.waypointIndex = path.length - 2;
          g.direction = -1;
        } else if (g.waypointIndex < 0) {
          g.waypointIndex = 1;
          g.direction = 1;
        }
      }
    } else {
      const path = state.level.guards[state.guards.indexOf(g)].path;
      const target = path[g.waypointIndex];
      const dx = target[0] - g.x;
      const dy = target[1] - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 5) {
        g.state = 'pause';
        g.pauseLeft = g.pauseSeconds;
        g.scanPhase = 0;
      } else {
        const step = Math.min(dist, GUARD.patrolSpeed * dt);
        const angle = Math.atan2(dy, dx);
        g.walkFacing = angle;
        g.facing = turnToward(g.facing, angle, 6 * dt);
        moveWithCollision(g, (dx / dist) * step, (dy / dist) * step, GUARD.radius);
      }
    }
    if (g.state === 'chase' && Math.hypot(g.x - state.player.x, g.y - state.player.y) < PLAYER.catchRadius) {
      endCaught('A guard grabbed you under the gallery lights.');
    }
  }
}

function updateCameras(dt) {
  for (const cam of state.cameras) {
    if (state.empLeft > 0) cam.disabled = true;
    else if (cam.disabled) cam.disabled = false;
    cam.angle = cam.base + cam.sweep * Math.sin(state.elapsed * cam.speed);
  }
}

function updateAlarm(dt) {
  let seenByGuard = false;
  let seenByCamera = false;
  for (const g of state.guards) {
    if (guardSeesPlayer(g, GUARD.viewRange)) seenByGuard = true;
  }
  for (const cam of state.cameras) {
    if (cameraSeesPlayer(cam)) seenByCamera = true;
  }
  if (state.lockdownLeft > 0) {
    state.lockdownLeft -= dt;
    state.alarm = 100;
    if (state.lockdownLeft <= 0) state.alarm = 82;
    return;
  }
  if (seenByCamera) state.alarm += ALARM.cameraRise * dt;
  else if (seenByGuard) {
    const chasing = state.guards.some((g) => g.state === 'chase');
    state.alarm += (chasing ? ALARM.chaseRise : ALARM.guardRise) * dt;
  } else {
    state.alarm -= ALARM.decay * dt;
  }
  state.alarm = Math.max(0, Math.min(100, state.alarm));
  if (state.alarm >= ALARM.lockdownAt) {
    state.lockdownLeft = ALARM.lockdownSeconds;
    for (const g of state.guards) startChase(g);
    toast('LOCKDOWN — every guard is coming for you!');
    sounds.alarmTick();
  }
  if (state.alarm > 60 && state.elapsed - state.lastAlarmTick > 0.9) {
    state.lastAlarmTick = state.elapsed;
    sounds.alarmTick();
  }
}

function updatePlayer(dt) {
  const p = state.player;
  const mv = input.moveVector();
  p.sneaking = input.isSneaking();
  const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  p.moving = mv.x !== 0 || mv.y !== 0;
  if (p.moving) {
    p.facing = Math.atan2(mv.y, mv.x);
    moveWithCollision(p, mv.x * speed * dt, mv.y * speed * dt, PLAYER.radius);
  }
  // Loot pickup.
  for (const item of state.loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - p.x, item.y - p.y) < LOOT_PICKUP_RADIUS) {
      item.taken = true;
      state.lootTotal += item.value;
      sounds.pickup();
      toast(`+$${item.value} — ${item.kind === 'gem' ? 'loose gem' : 'small painting'} pocketed`);
    }
  }
  // Diamond channel: stand close and still.
  if (!state.diamondTaken) {
    const d = state.level.diamond;
    const near = Math.hypot(d.x - p.x, d.y - p.y) < DIAMOND_CHANNEL_RADIUS;
    if (near && !p.moving) {
      state.diamondChannel += dt / DIAMOND_CHANNEL_SECONDS;
      if (state.diamondChannel >= 1) {
        state.diamondTaken = true;
        state.lootTotal += DIAMOND_VALUE;
        sounds.diamond();
        toast('AURORA DIAMOND secured — get to the EXIT!');
      }
    } else {
      state.diamondChannel = Math.max(0, state.diamondChannel - dt * 2);
    }
  }
  // Getaway: with the Diamond, step into the service doorway at the
  // bottom wall (the gap at x 600..680, reached at the floor's edge).
  if (state.diamondTaken) {
    const e = state.level.exit;
    if (p.x > e.x - 4 && p.x < e.x + e.w + 4 && p.y > 700) {
      endLevel();
    }
  }
}

function useSmoke() {
  if (state.smokeCount <= 0) {
    toast('No smoke bombs left');
    return;
  }
  if (state.lootTotal < TOOLS.smokeCost) {
    toast(`Smoke costs $${TOOLS.smokeCost} of loot — you have $${state.lootTotal}`);
    return;
  }
  state.lootTotal -= TOOLS.smokeCost;
  state.smokeCount -= 1;
  state.smokes.push({ x: state.player.x, y: state.player.y, r: TOOLS.smokeRadius, left: TOOLS.smokeSeconds });
  sounds.tool();
  toast('Smoke out — their cones cannot see through it');
}

function useEmp() {
  if (state.empCount <= 0) {
    toast('No EMP charges left');
    return;
  }
  if (state.lootTotal < TOOLS.empCost) {
    toast(`EMP costs $${TOOLS.empCost} of loot — you have $${state.lootTotal}`);
    return;
  }
  state.lootTotal -= TOOLS.empCost;
  state.empCount -= 1;
  state.empLeft = TOOLS.empSeconds;
  sounds.tool();
  toast('EMP burst — cameras blind for 6 seconds');
}

function endCaught(reason) {
  if (state.screen !== 'playing') return;
  state.screen = 'caught';
  state.caughtReason = reason;
  sounds.caught();
}

function endLevel() {
  sounds.getaway();
  if (state.levelIndex >= LEVELS.length - 1) {
    state.screen = 'won';
    const total = Math.floor(state.heistSeconds);
    state.heistTimeText = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  } else {
    state.screen = 'leveldone';
  }
}

function nextLevel() {
  const keep = state.lootTotal;
  const seconds = state.heistSeconds;
  const next = freshLevel(state.levelIndex + 1);
  Object.assign(state, next);
  state.screen = 'brief';
  state.lootTotal = keep;
  state.lootAtLevelStart = keep;
  state.heistSeconds = seconds;
}

function retryLevel() {
  const keep = state.lootAtLevelStart;
  const seconds = state.heistSeconds;
  const retry = freshLevel(state.levelIndex);
  Object.assign(state, retry);
  state.screen = 'playing';
  state.lootTotal = keep;
  state.lootAtLevelStart = keep;
  state.heistSeconds = seconds;
}

function restartHeist() {
  const fresh = freshLevel(0);
  Object.assign(state, fresh);
  state.screen = 'brief';
  state.lootTotal = 0;
  state.lootAtLevelStart = 0;
  state.heistSeconds = 0;
}

function update(dt) {
  state.elapsed += dt;
  if (state.messageLeft > 0) state.messageLeft -= dt;
  for (const s of state.smokes) s.left -= dt;
  state.smokes = state.smokes.filter((s) => s.left > 0);
  if (state.empLeft > 0) state.empLeft -= dt;
  if (state.screen !== 'playing') return;
  state.timeLeft -= dt;
  state.heistSeconds += dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endCaught('Dawn broke — the morning patrol walked in on you.');
    return;
  }
  updatePlayer(dt);
  if (state.screen !== 'playing') return;
  updateGuards(dt);
  if (state.screen !== 'playing') return;
  updateCameras(dt);
  updateAlarm(dt);
}

function handleKeys() {
  if (input.wasPressed('m')) {
    const muted = sounds.toggleMute();
    toast(muted ? 'Sound off' : 'Sound on');
  }
  if (state.screen === 'title') {
    if (input.wasPressed('enter') || input.wasPressed(' ')) state.screen = 'brief';
  } else if (state.screen === 'brief') {
    if (input.wasPressed('enter') || input.wasPressed(' ')) state.screen = 'playing';
  } else if (state.screen === 'playing') {
    if (input.wasPressed('p') || input.wasPressed('escape')) state.screen = 'paused';
    if (input.wasPressed('q')) useSmoke();
    if (input.wasPressed('e')) useEmp();
  } else if (state.screen === 'paused') {
    if (input.wasPressed('p') || input.wasPressed('escape')) state.screen = 'playing';
  } else if (state.screen === 'caught') {
    if (input.wasPressed('r')) retryLevel();
    if (input.wasPressed('enter')) restartHeist();
  } else if (state.screen === 'leveldone') {
    if (input.wasPressed('enter') || input.wasPressed(' ')) nextLevel();
  } else if (state.screen === 'won') {
    if (input.wasPressed('r') || input.wasPressed('enter')) restartHeist();
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  sounds.ensure();
  handleKeys();
  if (!state.frozen) update(dt);
  drawGame(ctx, state, now);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Screenshot staging (?shot=start|cover|caught|getaway) freezes a chosen
// moment so the maker's screenshots are real renders of this code.
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  applyShot(state, shot, { freshLevel, DIAMOND_VALUE });
}

window.__heist = state;
requestAnimationFrame(frame);
