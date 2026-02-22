# ScrollSpark

[![npm version](https://img.shields.io/npm/v/scrollspark.svg)](https://www.npmjs.com/package/scrollspark) [![license](https://img.shields.io/npm/l/scrollspark.svg)](LICENSE)

A lightweight scroll-trigger animation utility using IntersectionObserver. Designed to be small, dependency-free and easy to integrate in modern web projects.

## Features

- Animate elements on scroll with built-in effects (`fade`, `zoom`, `flip-x`, etc.)
- Staggered animations for groups of siblings
- Add/remove custom classes or toggle via attributes
- Progress callbacks and navigation tracking helpers
- Auto-initialize based on `ss-` attributes in markup

## Installation

```bash
npm install scrollspark
```

or include via CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/scrollspark/dist/scrollspark.css">
<script src="https://unpkg.com/scrollspark/dist/scrollspark.umd.js"></script>
```

## Usage

```js
import ScrollSpark from 'scrollspark';

const ss = ScrollSpark.init({ threshold: 0.2 });
ss.on('.card', { animate: 'fade-up', delay: 100 });
```

### Attribute API

```html
<div ss-animate="fade-left" ss-delay="200">Content</div>
```

### API Methods

- `ss.on(selector, options)`
- `ss.addClass(selector, className, options)`
- `ss.stagger(selector, options)`
- `ss.progress(selector, callback)`
- `ss.trackNav(navSelector, activeClass[, scrollRoot])`
- `ss.off(selector)`
- `ss.refresh()`
- `ss.destroy()`
- `ss.onChange(fn)`

See `docs/index.html` for a quick demo.

## Development

The repository uses Rollup for bundling. Run `npm install` then:

```bash
npm run build          # produce dist builds
npm run dev            # start a live server serving the docs
```

Tests are not yet configured.

## License

MIT &copy; 2026
