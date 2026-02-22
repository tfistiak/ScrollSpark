// ScrollSpark core logic
// This file is the entry point for the bundle. It exports a small
// factory object with `init` and `create` methods and carries the
// same behavior that used to live inside the demo HTML file.

// ── Default config ────────────────────────────────────────
const DEFAULTS = {
  threshold:   0.15,
  rootMargin:  '0px',
  delay:       0,
  repeat:      false,
  stagger:     80,
  duration:    700,
};

// ── Effect names that use ss-visible for animation ────────
const BUILT_IN_EFFECTS = new Set([
  'fade','fade-up','fade-down','fade-left','fade-right',
  'zoom','zoom-out','flip-x','flip-y','blur','reveal-up','reveal-left'
]);

// ── Utility ───────────────────────────────────────────────
function $(sel, ctx = document) {
  if (!sel) return [];
  if (sel instanceof Element || sel === document.body) return [sel];
  if (sel instanceof NodeList || Array.isArray(sel)) return [...sel];
  return [...ctx.querySelectorAll(sel)];
}

function parseOpts(el) {
  return {
    animate:    el.getAttribute('ss-animate')   || null,
    cls:        el.getAttribute('ss-class')      || null,
    clsTarget:  el.getAttribute('ss-class-target') || null,
    delay:      parseInt(el.getAttribute('ss-delay'))     || 0,
    threshold:  parseFloat(el.getAttribute('ss-threshold')) || DEFAULTS.threshold,
    margin:     el.getAttribute('ss-margin')     || DEFAULTS.rootMargin,
    repeat:     el.hasAttribute('ss-repeat'),
    duration:   parseInt(el.getAttribute('ss-duration'))   || DEFAULTS.duration,
  };
}

function log(instance, el, direction) {
  instance._listeners.forEach(fn => fn(el, direction));
}

// ── Core class ───────────────────────────────────────────
function createInstance() {
  const _obs  = [];           // all IntersectionObserver instances
  const _prog = [];           // { element, observer, callback }
  const _nav  = [];           // { navEl, links, activeClass, observer }
  const _map  = new WeakMap(); // element → { observer, opts }
  const inst  = { _listeners: [] };

  // ── Activate / Deactivate an element ────────────────────
  function activate(el, opts, delay) {
    const run = () => {
      // Animation effects
      if (opts.animate && BUILT_IN_EFFECTS.has(opts.animate)) {
        el.classList.add('ss-visible');
      }
      // Custom class
      if (opts.cls) {
        const targets = opts.clsTarget ? $(opts.clsTarget) : [el];
        opts.cls.split(' ').forEach(c => targets.forEach(t => t.classList.add(c.trim())));
      }
      if (typeof opts.onEnter === 'function') opts.onEnter(el);
      log(inst, el, 'enter');
    };
    clearTimeout(el._ssTimer);
    el._ssTimer = delay > 0 ? setTimeout(run, delay) : (run(), undefined);
  }

  function deactivate(el, opts) {
    clearTimeout(el._ssTimer);
    if (opts.animate && BUILT_IN_EFFECTS.has(opts.animate)) {
      el.classList.remove('ss-visible');
    }
    if (opts.cls) {
      const targets = opts.clsTarget ? $(opts.clsTarget) : [el];
      opts.cls.split(' ').forEach(c => targets.forEach(t => t.classList.remove(c.trim())));
    }
    if (typeof opts.onLeave === 'function') opts.onLeave(el);
    log(inst, el, 'leave');
  }

  // ── Create an IntersectionObserver for one element ───────
  function observe(el, opts) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activate(el, opts, opts.delay);
          if (!opts.repeat) observer.unobserve(el);
        } else if (opts.repeat) {
          deactivate(el, opts);
        }
      });
    }, { threshold: opts.threshold, rootMargin: opts.margin || opts.rootMargin || '0px' });

    observer.observe(el);
    _map.set(el, { observer, opts });
    _obs.push(observer);
  }

  // ── PUBLIC: on(selector, options) ────────────────────────
  inst.on = function(selector, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    $(selector).forEach(el => {
      if (_map.has(el)) return;
      if (opts.animate && BUILT_IN_EFFECTS.has(opts.animate)) {
        el.setAttribute('ss-animate', opts.animate);
      }
      if (opts.duration !== DEFAULTS.duration) {
        el.style.setProperty('--ss-duration', opts.duration + 'ms');
      }
      observe(el, opts);
    });
    return inst;
  };

  // ── PUBLIC: addClass(selector, class, options) ───────────
  inst.addClass = function(selector, cls, options = {}) {
    const opts = { ...DEFAULTS, ...options, cls };
    $(selector).forEach(el => {
      if (_map.has(el)) return;
      observe(el, opts);
    });
    return inst;
  };

  // ── PUBLIC: stagger(selector, options) ───────────────────
  inst.stagger = function(selector, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const staggerMs = options.stagger ?? DEFAULTS.stagger;
    const baseDelay = options.delay   ?? 0;

    // Use a single observer for the parent to batch children
    const els = $(selector);

    // Group by parent to stagger siblings properly
    const parents = new Map();
    els.forEach(el => {
      const parent = el.parentElement;
      if (!parents.has(parent)) parents.set(parent, []);
      parents.get(parent).push(el);
    });

    parents.forEach(children => {
      children.forEach((child, i) => {
        if (_map.has(child)) return;
        const childOpts = { ...opts, delay: baseDelay + i * staggerMs };
        if (opts.animate && BUILT_IN_EFFECTS.has(opts.animate)) {
          child.setAttribute('ss-animate', opts.animate);
        }
        observe(child, childOpts);
      });
    });

    return inst;
  };

  // ── PUBLIC: progress(selector, callback) ─────────────────
  // Fires callback(ratio: 0–1) as the element is scrolled through
  inst.progress = function(selector, callback) {
    const els = $(selector);
    els.forEach(el => {
      const target = el === document.body ? document.documentElement : el;

      const update = () => {
        let ratio;
        if (el === document.body) {
          const scrolled  = window.scrollY;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          ratio = Math.min(1, Math.max(0, scrolled / maxScroll));
        } else {
          const rect      = target.getBoundingClientRect();
          const wh        = window.innerHeight;
          ratio = Math.min(1, Math.max(0, (wh - rect.top) / (wh + rect.height)));
        }
        callback(ratio);
      };

      // Use both scroll and IntersectionObserver
      window.addEventListener('scroll', update, { passive: true });
      update(); // init
      _prog.push({ el, callback, update });
    });
    return inst;
  };

  // ── PUBLIC: trackNav(navSelector, activeClass, root?) ────
  // Adds activeClass to nav links whose #target section is in view
  inst.trackNav = function(navSelector, activeClass, scrollRoot) {
    const navEls = $(navSelector);
    navEls.forEach(navEl => {
      const links = [...navEl.querySelectorAll('a[href^="#"], [data-section-link]')];
      if (!links.length) return;

      links.forEach(link => {
        const id   = link.getAttribute('data-section-link') || link.getAttribute('href').slice(1);
        const sect = document.getElementById(id);
        if (!sect) return;

        const root = scrollRoot ? document.querySelector(scrollRoot) : null;

        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              links.forEach(l => l.classList.remove(activeClass));
              link.classList.add(activeClass);
            }
          });
        }, {
          root,
          threshold: 0.3,
          rootMargin: root ? '0px' : '-20% 0px -60% 0px',
        });

        observer.observe(sect);
        _obs.push(observer);
      });

      _nav.push({ navEl, links, activeClass });
    });
    return inst;
  };

  // ── PUBLIC: off(selector) ────────────────────────────────
  inst.off = function(selector) {
    $(selector).forEach(el => {
      const data = _map.get(el);
      if (!data) return;
      data.observer.unobserve(el);
      clearTimeout(el._ssTimer);
      if (data.opts.animate) el.classList.remove('ss-visible');
      if (data.opts.cls) data.opts.cls.split(' ').forEach(c => el.classList.remove(c.trim()));
      _map.delete(el);
    });
    return inst;
  };

  // ── PUBLIC: refresh() ────────────────────────────────────
  inst.refresh = function() { return _init(inst); };

  // ── PUBLIC: destroy() ────────────────────────────────────
  inst.destroy = function() {
    _obs.forEach(o => o.disconnect());
    _obs.length = 0;
    _prog.forEach(({ update }) => window.removeEventListener('scroll', update));
    _prog.length = 0;
  };

  // ── PUBLIC: onChange(fn) — global trigger listener ───────
  inst.onChange = function(fn) {
    inst._listeners.push(fn);
    return inst;
  };

  return inst;
}

// ── DOM scan & auto-init ─────────────────────────────────
function _init(inst) {
  // 1. ss-animate & ss-class on single elements
  document.querySelectorAll('[ss-animate], [ss-class]').forEach(el => {
    if (el._ssRegistered) return;
    const opts = parseOpts(el);
    observe_private(inst, el, opts);
    el._ssRegistered = true;
  });

  // 2. ss-group (stagger children)
  document.querySelectorAll('[ss-group]').forEach(parent => {
    if (parent._ssGroupRegistered) return;
    const effect   = parent.getAttribute('ss-group') || 'fade-up';
    const staggerN = parseInt(parent.getAttribute('ss-stagger')) || DEFAULTS.stagger;
    const delay    = parseInt(parent.getAttribute('ss-delay'))   || 0;
    const repeat   = parent.hasAttribute('ss-repeat');
    const thresh   = parseFloat(parent.getAttribute('ss-threshold')) || DEFAULTS.threshold;

    [...parent.children].forEach((child, i) => {
      if (child._ssRegistered) return;
      const childOpts = {
        animate: effect, delay: delay + i * staggerN,
        repeat, threshold: thresh, rootMargin: '0px',
      };
      child.setAttribute('ss-animate', effect);
      observe_private(inst, child, childOpts);
      child._ssRegistered = true;
    });
    parent._ssGroupRegistered = true;
  });

  // 3. ss-nav
  document.querySelectorAll('[ss-nav]').forEach(navEl => {
    if (navEl._ssNavRegistered) return;
    const activeClass = navEl.getAttribute('ss-nav');
    inst.trackNav(navEl, activeClass);
    navEl._ssNavRegistered = true;
  });

  return inst;
}

// Private observe that works on the instance's internal maps
function observe_private(inst, el, opts) {
  // re-use inst.on path
  if (opts.animate && BUILT_IN_EFFECTS.has(opts.animate)) {
    // css attr already set from DOM or we set it
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const run = () => {
          if (opts.animate && BUILT_IN_EFFECTS.has(opts.animate)) el.classList.add('ss-visible');
          if (opts.cls) {
            const targets = opts.clsTarget ? $(opts.clsTarget) : [el];
            opts.cls.split(' ').forEach(c => targets.forEach(t => t.classList.add(c.trim())));
          }
          if (typeof opts.onEnter === 'function') opts.onEnter(el);
          log(inst, el, 'enter');
        };
        clearTimeout(el._ssTimer);
        el._ssTimer = opts.delay > 0 ? setTimeout(run, opts.delay) : (run(), undefined);
        if (!opts.repeat) observer.unobserve(el);
      } else if (opts.repeat) {
        clearTimeout(el._ssTimer);
        if (opts.animate && BUILT_IN_EFFECTS.has(opts.animate)) el.classList.remove('ss-visible');
        if (opts.cls) {
          const targets = opts.clsTarget ? $(opts.clsTarget) : [el];
          opts.cls.split(' ').forEach(c => targets.forEach(t => t.classList.remove(c.trim())));
        }
        if (typeof opts.onLeave === 'function') opts.onLeave(el);
        log(inst, el, 'leave');
      }
    });
  }, { threshold: opts.threshold, rootMargin: opts.margin || '0px' });

  observer.observe(el);
  inst._listeners; // just to reference inst
  // Store on inst's internal _obs array
  inst._obs_internal = inst._obs_internal || [];
  inst._obs_internal.push(observer);
}

// ── Public factory ───────────────────────────────────────
const ScrollSpark = {
  version: '2.0.0',

  init(globalOptions = {}) {
    Object.assign(DEFAULTS, globalOptions);
    const inst = createInstance();
    inst._obs_internal = [];
    return _init(inst);
  },

  create() {
    const inst = createInstance();
    inst._obs_internal = [];
    return inst;
  },
};

export default ScrollSpark;
export { DEFAULTS, BUILT_IN_EFFECTS, createInstance };
