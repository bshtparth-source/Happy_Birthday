/**
 * DOM utility functions ensuring strict separation, textContent safety, and SVG sprite usage.
 */

/**
 * Creates an element with optional class, text, and attributes.
 * Always sets text using textContent to prevent XSS.
 * @param {string} tag
 * @param {{ className?: string, text?: string, attrs?: Record<string, string> }} [opts]
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
  const element = document.createElement(tag);
  if (opts.className) {
    element.className = opts.className;
  }
  if (opts.text != null) {
    element.textContent = opts.text;
  }
  if (opts.attrs) {
    Object.entries(opts.attrs).forEach(([key, val]) => {
      element.setAttribute(key, val);
    });
  }
  return element;
}

/**
 * Safely queries a selector inside a root container.
 * @param {Element|Document} root
 * @param {string} selector
 * @returns {Element|null}
 */
export function qs(root, selector) {
  return root.querySelector(selector);
}

/**
 * Safely queries all matching elements inside a root container.
 * @param {Element|Document} root
 * @param {string} selector
 * @returns {Element[]}
 */
export function qsa(root, selector) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Safely updates element text content.
 * @param {Element|null} element
 * @param {string|number} text
 */
export function setText(element, text) {
  if (element) {
    element.textContent = text != null ? String(text) : '';
  }
}

/**
 * Creates an SVG icon instance referencing the centralized SVG sprite.
 * @param {string} iconId - ID of the symbol without the 'icon-' prefix
 * @param {string} [className] - Optional CSS classes to attach
 * @returns {SVGSVGElement}
 */
export function useIcon(iconId, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (className) {
    svg.setAttribute('class', className);
  }

  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${iconId}`);
  svg.appendChild(use);
  return svg;
}
