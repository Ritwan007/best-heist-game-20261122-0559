// The Gilded Gallery — keyboard (and click-to-start) input.
// One job: turn raw key events into a small, honest state object the
// game loop reads. No game logic lives here.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.sneak = false;
    this.pressed = new Set();
    this.onAnyKey = null;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
      if (this.onAnyKey) this.onAnyKey(e.key);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    canvas.addEventListener('mousedown', () => {
      if (this.onAnyKey) this.onAnyKey('click');
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  // Movement vector, normalised, from WASD or arrow keys.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  isSneaking() {
    return this.keys.has('shift');
  }

  // True once for the frame the key went down; main.js clears it each tick.
  wasPressed(key) {
    return this.pressed.has(key.toLowerCase());
  }

  endFrame() {
    this.pressed.clear();
  }
}
