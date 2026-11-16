// Keyboard and mouse input for Glowtide Keep. The game reads one Input
// object per frame; clicks are queued so a fast click is never lost
// between frames. Coordinates are converted to logical game space.

export class Input {
  constructor(canvas, toLogical) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 480;
    this.mouseY = 240;
    this.mouseDown = false;
    this.rightDown = false;
    this.clicks = [];
    this.canvas = canvas;
    this.toLogical = toLogical;
    this.onFirstGesture = null;
    this.gestureFired = false;
    this.attach(canvas);
  }

  fireGesture() {
    if (this.gestureFired) return;
    this.gestureFired = true;
    if (this.onFirstGesture) this.onFirstGesture();
  }

  updateMouse(event) {
    const rect = this.canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const p = this.toLogical(px, py, rect.width, rect.height);
    this.mouseX = p.x;
    this.mouseY = p.y;
  }

  attach(canvas) {
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
      this.fireGesture();
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseDown = false;
      this.rightDown = false;
    });
    canvas.addEventListener('mousemove', (event) => this.updateMouse(event));
    canvas.addEventListener('mousedown', (event) => {
      this.updateMouse(event);
      this.fireGesture();
      if (event.button === 0) {
        this.mouseDown = true;
        this.clicks.push({ x: this.mouseX, y: this.mouseY, button: 0 });
      } else if (event.button === 2) {
        this.rightDown = true;
        this.clicks.push({ x: this.mouseX, y: this.mouseY, button: 2 });
      }
    });
    window.addEventListener('mouseup', (event) => {
      if (event.button === 0) this.mouseDown = false;
      if (event.button === 2) this.rightDown = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    canvas.addEventListener('touchstart', (event) => {
      const t = event.changedTouches[0];
      const fake = { clientX: t.clientX, clientY: t.clientY, button: 0, preventDefault: () => {} };
      this.updateMouse(fake);
      this.fireGesture();
      this.mouseDown = true;
      this.clicks.push({ x: this.mouseX, y: this.mouseY, button: 0 });
      event.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', (event) => {
      const t = event.changedTouches[0];
      this.updateMouse({ clientX: t.clientX, clientY: t.clientY });
      event.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', () => { this.mouseDown = false; });
  }

  down(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  moveAxis() {
    let x = 0;
    let y = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  endFrame() {
    this.pressed.clear();
    this.clicks.length = 0;
  }
}
