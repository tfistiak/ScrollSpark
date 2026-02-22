interface ScrollSparkOptions {
  animate?: string;
  cls?: string;
  clsTarget?: string;
  delay?: number;
  threshold?: number;
  margin?: string;
  repeat?: boolean;
  duration?: number;
  stagger?: number;
  onEnter?: (el: Element) => void;
  onLeave?: (el: Element) => void;
}

type ScrollCallback = (ratio: number) => void;

interface ScrollSparkInstance {
  on(selector: string | Element | Element[], options?: ScrollSparkOptions): this;
  addClass(selector: string | Element | Element[], cls: string, options?: ScrollSparkOptions): this;
  stagger(selector: string | Element | Element[], options?: ScrollSparkOptions): this;
  progress(selector: string | Element | Element[], callback: ScrollCallback): this;
  trackNav(navSelector: string | Element, activeClass: string, scrollRoot?: string): this;
  off(selector: string | Element | Element[]): this;
  refresh(): this;
  destroy(): void;
  onChange(fn: (el: Element, direction: 'enter'|'leave') => void): this;
}

default interface ScrollSpark {
  version: string;
  init(globalOptions?: Partial<ScrollSparkOptions>): ScrollSparkInstance;
  create(): ScrollSparkInstance;
}

export default ScrollSpark;
export { ScrollSpark, ScrollSparkInstance, ScrollSparkOptions, ScrollCallback };
