// The Gilded Gallery — the three rooms of the heist.
// One job: level data only. No logic, no drawing. Every room is the same
// gallery hall; the walls, cover, patrols and cameras change, and the routes
// through each room change with them.
//
// Coordinates live in the 1280x800 canvas. The HUD occupies y < 76 and the
// floor runs from y = 104 to y = 768, with the getaway door in the bottom
// wall at x = 600..680. A `cover` rect blocks movement and line of sight.
// A `wall` rect does the same. Guards walk straight lines between waypoints,
// so every patrol path below is drawn clear of cover and walls.
import { ROOM } from './config.js';

function borderWalls() {
  return [
    { x: ROOM.x, y: ROOM.y, w: ROOM.w, h: 16 },
    { x: ROOM.x, y: ROOM.y, w: 16, h: ROOM.h },
    { x: ROOM.x + ROOM.w - 16, y: ROOM.y, w: 16, h: ROOM.h },
    { x: ROOM.x, y: ROOM.y + ROOM.h - 16, w: 560, h: 16 },
    { x: ROOM.x + ROOM.w - 576, y: ROOM.y + ROOM.h - 16, w: 560, h: 16 },
  ];
}

export const LEVELS = [
  {
    name: 'I — The Grand Hall',
    briefing: 'Lift the Aurora Diamond from its pedestal, then slip out the service door.',
    timeSeconds: 200,
    start: { x: 640, y: 716 },
    exit: { x: 600, y: 752, w: 80, h: 16 },
    diamond: { x: 640, y: 400 },
    walls: borderWalls(),
    covers: [
      { x: 230, y: 250, w: 110, h: 56, kind: 'case' },
      { x: 940, y: 250, w: 110, h: 56, kind: 'case' },
      { x: 230, y: 560, w: 110, h: 56, kind: 'case' },
      { x: 940, y: 560, w: 110, h: 56, kind: 'case' },
      { x: 618, y: 330, w: 44, h: 44, kind: 'pillar' },
      { x: 420, y: 470, w: 36, h: 36, kind: 'pillar' },
      { x: 824, y: 470, w: 36, h: 36, kind: 'pillar' },
    ],
    guards: [
      { path: [[280, 190], [1000, 190]], pauseSeconds: 1.4 },
      { path: [[1000, 640], [280, 640]], pauseSeconds: 1.4 },
    ],
    cameras: [
      { x: 640, y: 122, base: Math.PI / 2, sweep: 0.7, speed: 0.5 },
    ],
    loot: [
      { x: 285, y: 332, kind: 'gem', value: 250 },
      { x: 995, y: 332, kind: 'gem', value: 250 },
      { x: 285, y: 534, kind: 'gem', value: 250 },
      { x: 995, y: 534, kind: 'gem', value: 250 },
      { x: 150, y: 430, kind: 'painting', value: 400 },
      { x: 1130, y: 430, kind: 'painting', value: 400 },
    ],
    paintings: [
      { x: 180, y: 122, w: 90, h: 52, hue: '#7a4a8a' },
      { x: 1010, y: 122, w: 90, h: 52, hue: '#3f7a5a' },
      { x: 56, y: 300, w: 52, h: 90, hue: '#8a5a3a' },
      { x: 1172, y: 300, w: 52, h: 90, hue: '#4a6a8a' },
    ],
  },
  {
    name: 'II — The Vault Corridor',
    briefing: 'Three lanes, three patrols. The Diamond waits at the far vault door.',
    timeSeconds: 220,
    start: { x: 640, y: 716 },
    exit: { x: 600, y: 752, w: 80, h: 16 },
    diamond: { x: 640, y: 168 },
    walls: [
      ...borderWalls(),
      { x: 380, y: 240, w: 18, h: 280 },
      { x: 882, y: 240, w: 18, h: 280 },
    ],
    covers: [
      { x: 520, y: 260, w: 90, h: 50, kind: 'case' },
      { x: 700, y: 260, w: 90, h: 50, kind: 'case' },
      { x: 520, y: 520, w: 90, h: 50, kind: 'case' },
      { x: 700, y: 520, w: 90, h: 50, kind: 'case' },
      { x: 200, y: 380, w: 50, h: 50, kind: 'statue' },
      { x: 1030, y: 380, w: 50, h: 50, kind: 'statue' },
    ],
    guards: [
      { path: [[170, 200], [170, 660]], pauseSeconds: 1.2 },
      { path: [[1110, 660], [1110, 200]], pauseSeconds: 1.2 },
      { path: [[640, 640], [640, 340]], pauseSeconds: 1.6 },
    ],
    cameras: [
      { x: 120, y: 122, base: 0.9, sweep: 0.5, speed: 0.45 },
      { x: 1160, y: 730, base: -2.25, sweep: 0.5, speed: 0.45 },
    ],
    loot: [
      { x: 180, y: 300, kind: 'gem', value: 250 },
      { x: 1100, y: 300, kind: 'gem', value: 250 },
      { x: 180, y: 560, kind: 'gem', value: 250 },
      { x: 1100, y: 560, kind: 'gem', value: 250 },
      { x: 300, y: 160, kind: 'painting', value: 400 },
      { x: 640, y: 700, kind: 'gem', value: 250 },
    ],
    paintings: [
      { x: 500, y: 122, w: 90, h: 52, hue: '#8a3a4a' },
      { x: 700, y: 122, w: 90, h: 52, hue: '#3a5a8a' },
      { x: 56, y: 560, w: 52, h: 90, hue: '#7a7a3a' },
      { x: 1172, y: 560, w: 52, h: 90, hue: '#5a3a7a' },
    ],
  },
  {
    name: 'III — The Vault',
    briefing: 'The Aurora Diamond sleeps behind the vault doors. Three cameras. No mistakes.',
    timeSeconds: 240,
    start: { x: 640, y: 716 },
    exit: { x: 600, y: 752, w: 80, h: 16 },
    diamond: { x: 640, y: 172 },
    walls: [
      ...borderWalls(),
      { x: 520, y: 120, w: 16, h: 140 },
      { x: 744, y: 120, w: 16, h: 140 },
    ],
    covers: [
      { x: 300, y: 300, w: 110, h: 56, kind: 'case' },
      { x: 870, y: 300, w: 110, h: 56, kind: 'case' },
      { x: 300, y: 540, w: 110, h: 56, kind: 'case' },
      { x: 870, y: 540, w: 110, h: 56, kind: 'case' },
      { x: 618, y: 380, w: 44, h: 44, kind: 'pillar' },
      { x: 440, y: 460, w: 36, h: 36, kind: 'pillar' },
      { x: 804, y: 460, w: 36, h: 36, kind: 'pillar' },
    ],
    guards: [
      { path: [[420, 280], [860, 280]], pauseSeconds: 1.2 },
      { path: [[980, 640], [300, 640]], pauseSeconds: 1.2 },
      { path: [[500, 640], [500, 320]], pauseSeconds: 1.5 },
    ],
    cameras: [
      { x: 640, y: 122, base: Math.PI / 2, sweep: 0.65, speed: 0.55 },
      { x: 120, y: 730, base: -0.9, sweep: 0.5, speed: 0.5 },
      { x: 1160, y: 730, base: -2.25, sweep: 0.5, speed: 0.5 },
    ],
    loot: [
      { x: 355, y: 362, kind: 'gem', value: 250 },
      { x: 925, y: 362, kind: 'gem', value: 250 },
      { x: 355, y: 600, kind: 'gem', value: 250 },
      { x: 925, y: 600, kind: 'gem', value: 250 },
      { x: 180, y: 430, kind: 'painting', value: 400 },
      { x: 1100, y: 430, kind: 'painting', value: 400 },
    ],
    paintings: [
      { x: 180, y: 122, w: 90, h: 52, hue: '#3a7a6a' },
      { x: 1010, y: 122, w: 90, h: 52, hue: '#8a6a3a' },
      { x: 56, y: 300, w: 52, h: 90, hue: '#7a3a5a' },
      { x: 1172, y: 300, w: 52, h: 90, hue: '#4a8a3a' },
    ],
  },
];
