// The Gilded Gallery — every number the rest of the game agrees on.
// One job: tuning, palette and shared constants. Nothing here draws or moves.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 76;

// Interior floor of the gallery hall. Border walls sit on these edges.
export const ROOM = { x: 40, y: 104, w: 1200, h: 648 };
export const EXIT_GAP = { x: 600, y: 752, w: 80, h: 16 };

export const PLAYER = {
  radius: 13,
  walkSpeed: 182,
  sneakSpeed: 100,
  catchRadius: 27,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 74,
  chaseSpeed: 154,
  lockdownSpeed: 170,
  viewRange: 232,
  viewHalfAngle: 0.56,
  spotSecondsToChase: 0.9,
};

export const CAMERA = { viewRange: 268, viewHalfAngle: 0.44 };

export const ALARM = {
  guardRise: 30,
  cameraRise: 55,
  chaseRise: 42,
  decay: 10,
  chaseAt: 60,
  lockdownAt: 100,
  lockdownSeconds: 4,
};

export const TOOLS = {
  smokeCost: 150,
  smokeRadius: 96,
  smokeSeconds: 4,
  empCost: 300,
  empSeconds: 6,
};

export const DIAMOND_CHANNEL_SECONDS = 1.5;
export const LOOT_PICKUP_RADIUS = 42;
export const SNEAK_RANGE_FACTOR = 0.7;

export const PALETTE = {
  wall: '#232a45',
  wallTrim: '#c9a227',
  floorA: '#171a26',
  floorB: '#1b1f30',
  floorInlay: '#2a2f47',
  caseGlass: '#8fb7d9',
  caseFrame: '#c9a227',
  statue: '#5d6b8a',
  pillar: '#39415f',
  carpet: '#3d1f2b',
  guardBody: '#2e4a7a',
  guardTrim: '#d8dee9',
  coneGuard: 'rgba(255, 214, 90, 0.20)',
  coneGuardEdge: 'rgba(255, 214, 90, 0.55)',
  coneChase: 'rgba(255, 84, 64, 0.28)',
  coneCamera: 'rgba(255, 70, 90, 0.20)',
  coneCameraEdge: 'rgba(255, 70, 90, 0.55)',
  thief: '#2fd6c8',
  thiefDark: '#0f8a80',
  lootGold: '#ffd94a',
  diamond: '#aef3ff',
  exitGlow: '#58e08a',
  smoke: 'rgba(180, 188, 205, 0.55)',
  alarmLow: '#58e08a',
  alarmMid: '#ffb02e',
  alarmHigh: '#ff4d3d',
  text: '#f2ead8',
  textDim: '#9aa3bd',
};
export const DIAMOND_CHANNEL_RADIUS = 82;
