import {
  DURATION,
  EASE,
  EASE_OUT,
  REDUCED_MOTION_QUERY,
  TOUCH_DECIDE_PX,
  TRANSITION_END_PAD_MS,
} from "./constants";
import { Emitter } from "./emitter";
import {
  canScroll,
  cosineEase,
  jumpDuration,
  keyDirection,
  scrollDuration,
  smoothVelocity,
  touchOffset,
  touchOutcome,
  wheelAction,
  type Direction,
  type WheelState,
} from "./math";
import { isOverlayOpen } from "./overlay";
import { forceReflow, isScrollSlide, resetSlide, slideMetrics, translateY } from "./slide";

export interface DeckEvents {
  /** A slide starts moving in; fired at the start of the transition. */
  arrive: HTMLElement;
  /** A transition finished (or the slides were laid out again). */
  settle: undefined;
  /** A scrolling slide scrolled internally. */
  scroll: undefined;
}

interface GoOptions {
  /** Current drag offset in px. */
  from?: number;
  dur?: number;
  ease?: string;
}

interface TouchState {
  y0: number;
  x0: number;
  decided: boolean;
  drag: boolean;
  lastY: number;
  lastT: number;
  /** Smoothed px/ms, positive = forward. */
  v: number;
  dir: Direction;
  off: number | null;
  el: HTMLElement | null;
}

const SLIDE_SELECTOR = ".slide, .half";
const DESKTOP_SLIDES = ".slide";
const PHONE_SLIDES = ".slide:not(.pair), .half";
/** Keys typed into these (or inside a `data-deck-ignore` element) are not slide navigation. */
const IGNORED_KEY_TARGETS = "input, textarea, select, [data-deck-ignore]";

/**
 * Full-screen slide paging, moved with transforms (like Swiper). Framework-free: it owns the
 * slide list, the current index and every native listener. `mount` and `destroy` are idempotent
 * so React Strict Mode can run them twice.
 */
export class DeckController {
  private deck: HTMLElement | null = null;
  private slides: HTMLElement[] = [];
  private cur = 0;
  private busy = false;
  private wheel: WheelState = { quiet: false, lastWheel: 0, lastAbs: 0 };
  private touch: TouchState | null = null;
  private phone = false;
  private listeners: AbortController | null = null;
  private timeouts = new Set<number>();
  private frames = new Set<number>();
  private events = new Emitter<DeckEvents>();

  on<K extends keyof DeckEvents>(type: K, listener: (payload: DeckEvents[K]) => void): () => void {
    return this.events.on(type, listener);
  }

  /** Switches between the desktop and the phone slide lists, keeping the visible position. */
  setPhone(phone: boolean): void {
    if (phone === this.phone) return;
    this.phone = phone;
    if (this.deck) this.collect();
  }

  mount(deck: HTMLElement): void {
    this.destroy();
    this.deck = deck;
    this.listeners = new AbortController();
    const { signal } = this.listeners;
    window.addEventListener("wheel", this.onWheel, { passive: false, signal });
    deck.addEventListener("touchstart", this.onTouchStart, { passive: true, signal });
    deck.addEventListener("touchmove", this.onTouchMove, { passive: false, signal });
    deck.addEventListener("touchend", this.onTouchEnd, { passive: true, signal });
    deck.addEventListener("touchcancel", this.onTouchEnd, { passive: true, signal });
    document.addEventListener("keydown", this.onKeyDown, { signal });
    document.addEventListener("click", this.onClick, { signal });
    // header colour/blur follows content while a screen scrolls internally
    deck.addEventListener("scroll", this.onScroll, { capture: true, passive: true, signal });
    this.collect();
  }

  destroy(): void {
    this.listeners?.abort();
    this.listeners = null;
    this.timeouts.forEach((id) => window.clearTimeout(id));
    this.timeouts.clear();
    this.frames.forEach((id) => window.cancelAnimationFrame(id));
    this.frames.clear();
    this.deck?.querySelectorAll<HTMLElement>(SLIDE_SELECTOR).forEach(resetSlide);
    this.deck = null;
    this.slides = [];
    this.cur = 0;
    this.busy = false;
    this.wheel = { quiet: false, lastWheel: 0, lastAbs: 0 };
    this.touch = null;
  }

  step(dir: Direction): boolean {
    return this.go(this.cur + dir);
  }

  /** Moves to the screen that holds `el`, scrolling inside it if needed. */
  goToEl(el: Element): void {
    let idx = this.slides.findIndex((s) => s === el || s.contains(el));
    if (idx === -1) idx = this.slides.findIndex((s) => el.contains(s));
    if (idx === -1) return;
    const slide = this.slides[idx];
    let y = 0;
    if (isScrollSlide(slide) && el !== slide) {
      y =
        el.getBoundingClientRect().top -
        slide.getBoundingClientRect().top +
        slide.scrollTop -
        (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
    }
    if (idx === this.cur) {
      if (isScrollSlide(slide)) this.scrollInner(slide, y);
      return;
    }
    if (isScrollSlide(slide)) slide.scrollTop = y; // land already in place
    this.go(idx, { dur: jumpDuration(Math.abs(idx - this.cur)) });
  }

  /* ---- timing helpers (everything is cleared in destroy) ---- */

  private later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      fn();
    }, ms);
    this.timeouts.add(id);
  }

  private frame(fn: FrameRequestCallback): void {
    const id = window.requestAnimationFrame((now) => {
      this.frames.delete(id);
      fn(now);
    });
    this.frames.add(id);
  }

  private reducedMotion(): boolean {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  }

  private height(): number {
    return this.deck ? this.deck.clientHeight : 0;
  }

  private currentSlide(): HTMLElement | undefined {
    return this.slides[this.cur];
  }

  private canScrollCurrent(dir: Direction): boolean {
    const slide = this.currentSlide();
    return slide ? canScroll(slideMetrics(slide), dir) : false;
  }

  /* ---- slide list and layout ---- */

  private layout(): void {
    this.slides.forEach((s, i) => {
      s.style.transition = "";
      s.style.transform = "";
      s.style.visibility = "";
      s.style.zIndex = String(i + 1);
      s.classList.toggle("is-current", i === this.cur);
      s.classList.toggle("is-under", i < this.cur);
      s.classList.toggle("is-far", i < this.cur - 1 || i > this.cur + 1);
      s.classList.remove("moving");
      if (i === this.cur) s.classList.remove("pre");
      else if (i === this.cur + 1) s.classList.add("pre");
    });
    this.events.emit("settle", undefined);
  }

  private collect(): void {
    const deck = this.deck;
    if (!deck) return;
    const prev = this.slides[this.cur];
    deck.querySelectorAll<HTMLElement>(SLIDE_SELECTOR).forEach(resetSlide);
    this.slides = Array.from(
      deck.querySelectorAll<HTMLElement>(this.phone ? PHONE_SLIDES : DESKTOP_SLIDES),
    );
    this.cur = 0;
    if (prev) {
      const keep = this.slides.findIndex((s) => s === prev || s.contains(prev) || prev.contains(s));
      if (keep !== -1) this.cur = keep;
    }
    this.layout();
  }

  /* ---- movement ---- */

  private slideTo(el: HTMLElement, y: number, dur: number, ease: string, done: () => void): void {
    let finished = false;
    const end = (): void => {
      if (finished) return;
      finished = true;
      el.removeEventListener("transitionend", onEnd);
      done();
    };
    const onEnd = (e: TransitionEvent): void => {
      if (e.target === el && e.propertyName === "transform") end();
    };
    if (!dur || this.reducedMotion()) {
      el.style.transition = "none";
      el.style.transform = translateY(y);
      end();
      return;
    }
    el.addEventListener("transitionend", onEnd, { signal: this.listeners?.signal });
    el.style.transition = `transform ${dur}ms ${ease}`;
    el.style.transform = translateY(y);
    this.later(end, dur + TRANSITION_END_PAD_MS);
  }

  private arrived(to: number): void {
    this.cur = to;
    this.busy = false;
    this.wheel.quiet = true;
    this.layout();
  }

  /** Moves to slide `to`; `opt.from` is the current drag offset, `dur`/`ease` override timing. */
  private go(to: number, opt: GoOptions = {}): boolean {
    const { slides, cur } = this;
    if (this.busy || to < 0 || to >= slides.length || to === cur) return false;
    this.busy = true;
    const dir: Direction = to > cur ? 1 : -1;
    const height = this.height();
    const dur = opt.dur ?? DURATION;
    const ease = opt.ease ?? EASE;
    if (dir > 0) {
      const incoming = slides[to];
      incoming.classList.remove("is-far");
      incoming.style.visibility = "visible";
      incoming.style.transition = "none";
      incoming.style.transform = translateY(opt.from ?? height);
      forceReflow(incoming); // commit start position
      incoming.classList.remove("pre");
      incoming.classList.add("moving");
      this.events.emit("arrive", incoming);
      this.slideTo(incoming, 0, dur, ease, () => this.arrived(to));
    } else {
      const leaving = slides[cur];
      const target = slides[to];
      for (let i = to + 1; i < cur; i++) slides[i].style.visibility = "hidden"; // skip screens in between
      target.classList.remove("is-far");
      target.style.visibility = "visible";
      leaving.style.transition = "none";
      leaving.style.transform = translateY(opt.from ?? 0);
      forceReflow(leaving);
      leaving.classList.add("moving");
      this.events.emit("arrive", target);
      this.slideTo(leaving, height, dur, ease, () => this.arrived(to));
    }
    return true;
  }

  private scrollInner(slide: HTMLElement, to: number): void {
    const start = slide.scrollTop;
    const dist = to - start;
    if (Math.abs(dist) < 1 || this.reducedMotion()) {
      slide.scrollTop = to;
      return;
    }
    const dur = scrollDuration(dist);
    const t0 = performance.now();
    const frame = (now: number): void => {
      const t = Math.min(1, (now - t0) / dur);
      slide.scrollTop = start + dist * cosineEase(t);
      if (t < 1) this.frame(frame);
    };
    frame(t0);
  }

  /* ---- input: wheel / trackpad ---- */

  private onWheel = (e: WheelEvent): void => {
    if (isOverlayOpen() || !this.currentSlide()) return;
    const result = wheelAction(
      { deltaY: e.deltaY, deltaMode: e.deltaMode, now: performance.now(), busy: this.busy },
      this.wheel,
      (dir) => this.canScrollCurrent(dir),
    );
    this.wheel = result.state;
    if (result.kind === "ignore" || result.kind === "native") return;
    e.preventDefault();
    if (result.kind === "step") this.step(result.dir);
  };

  /* ---- input: touch (the screen follows the finger 1:1, then finishes on release) ---- */

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1 || this.busy || isOverlayOpen()) {
      this.touch = null;
      return;
    }
    const point = e.touches[0];
    this.touch = {
      y0: point.clientY,
      x0: point.clientX,
      decided: false,
      drag: false,
      lastY: point.clientY,
      lastT: performance.now(),
      v: 0,
      dir: 1,
      off: null,
      el: null,
    };
  };

  private onTouchMove = (e: TouchEvent): void => {
    const t = this.touch;
    const current = this.currentSlide();
    if (!t || !current) return;
    const { clientX: x, clientY: y } = e.touches[0];
    const now = performance.now();
    let dy = t.y0 - y; // >0: finger moving up = forward
    if (!t.decided) {
      if (Math.abs(dy) < TOUCH_DECIDE_PX) {
        if (!isScrollSlide(current)) e.preventDefault();
        return;
      }
      t.decided = true;
      if (Math.abs(x - t.x0) > Math.abs(dy)) return; // sideways (e.g. the tab strip)
      const dir: Direction = dy > 0 ? 1 : -1;
      if (this.canScrollCurrent(dir)) return; // let the screen scroll itself
      if ((dir > 0 && this.cur === this.slides.length - 1) || (dir < 0 && this.cur === 0)) return;
      t.drag = true;
      t.dir = dir;
      t.y0 = y;
      dy = 0;
      const el = dir > 0 ? this.slides[this.cur + 1] : current;
      t.el = el;
      if (dir > 0) {
        el.classList.remove("is-far");
        el.style.visibility = "visible";
      } else {
        this.slides[this.cur - 1].classList.remove("is-far");
      }
      el.style.transition = "none";
      el.classList.add("moving");
    }
    if (!t.drag || !t.el) return;
    e.preventDefault();
    t.off = touchOffset(t.dir, this.height(), dy);
    t.el.style.transform = translateY(t.off);
    t.v = smoothVelocity(t.v, t.lastY, y, now - t.lastT);
    t.lastY = y;
    t.lastT = now;
  };

  private onTouchEnd = (): void => {
    const t = this.touch;
    this.touch = null;
    if (!t || !t.drag || !t.el) return;
    const outcome = touchOutcome({
      dir: t.dir,
      off: t.off,
      height: this.height(),
      velocity: t.v,
      sinceLastMoveMs: performance.now() - t.lastT,
    });
    if (outcome.commit) {
      this.go(this.cur + t.dir, { from: outcome.from, dur: outcome.duration, ease: EASE_OUT });
      return;
    }
    this.busy = true;
    this.slideTo(t.el, outcome.settleTo, outcome.duration, EASE_OUT, () => {
      this.busy = false;
      this.layout();
    });
  };

  /* ---- input: keys and in-page links ---- */

  private onKeyDown = (e: KeyboardEvent): void => {
    if (isOverlayOpen()) return;
    const target = e.target;
    if (target instanceof Element && target.closest(IGNORED_KEY_TARGETS)) return;
    const dir = keyDirection(e.key, e.shiftKey);
    if (dir === null) return;
    if (!this.busy && this.canScrollCurrent(dir)) return;
    e.preventDefault();
    if (!this.busy) this.step(dir);
  };

  private onClick = (e: MouseEvent): void => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href^="#"]');
    if (!link) return;
    const id = (link.getAttribute("href") ?? "").slice(1);
    const el = id === "top" ? (this.slides[0] ?? null) : document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    this.goToEl(el);
  };

  private onScroll = (e: Event): void => {
    const target = e.target;
    if (target instanceof Element && target.matches(".slide.scroll")) {
      this.events.emit("scroll", undefined);
    }
  };
}
