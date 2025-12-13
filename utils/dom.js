/**
 * DOM Utility Functions
 * 
 * Helper functions for DOM manipulation and queries.
 */

import { escapeHTML, sanitizeHTML } from './security.js';

/**
 * Safely set innerHTML with automatic sanitization
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content
 * @param {Object} options - Options
 */
export function safeSetHTML(element, html, options = {}) {
    const { allowHTML = false, sanitize = true } = options;

    if (!element) {
        console.warn('[DOM] Element is null or undefined');
        return;
    }

    if (!allowHTML) {
        // Escape all HTML - safest option
        element.textContent = html;
    } else if (sanitize) {
        // Sanitize but allow some HTML
        element.innerHTML = sanitizeHTML(html);
    } else {
        // Use as-is (dangerous, only for trusted content)
        element.innerHTML = html;
    }
}

/**
 * Debounced loading state helper
 * @param {Function} callback - Callback to set loading state
 * @param {number} delay - Delay in ms
 * @returns {Object} - Control object
 */
export function debouncedLoading(callback, delay = 300) {
    let timeout;

    return {
        start() {
            timeout = setTimeout(() => {
                callback(true);
            }, delay);
        },
        stop() {
            clearTimeout(timeout);
            callback(false);
        }
    };
}

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {Array|string} children - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.slice(2).toLowerCase();
            element.addEventListener(event, value);
        } else {
            element.setAttribute(key, value);
        }
    });

    // Add children
    const childArray = Array.isArray(children) ? children : [children];
    childArray.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Query selector with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element
 * @returns {HTMLElement|null}
 */
export function $(selector, context = document) {
    try {
        return context.querySelector(selector);
    } catch (error) {
        console.error(`Invalid selector: ${selector}`, error);
        return null;
    }
}

/**
 * Query selector all with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element
 * @returns {NodeList}
 */
export function $$(selector, context = document) {
    try {
        return context.querySelectorAll(selector);
    } catch (error) {
        console.error(`Invalid selector: ${selector}`, error);
        return [];
    }
}

/**
 * Add class to element
 * @param {HTMLElement} element - Element
 * @param {string|Array} classes - Class name(s)
 */
export function addClass(element, classes) {
    const classArray = Array.isArray(classes) ? classes : [classes];
    element.classList.add(...classArray);
}

/**
 * Remove class from element
 * @param {HTMLElement} element - Element
 * @param {string|Array} classes - Class name(s)
 */
export function removeClass(element, classes) {
    const classArray = Array.isArray(classes) ? classes : [classes];
    element.classList.remove(...classArray);
}

/**
 * Toggle class on element
 * @param {HTMLElement} element - Element
 * @param {string} className - Class name
 * @param {boolean} force - Force add/remove
 */
export function toggleClass(element, className, force) {
    return element.classList.toggle(className, force);
}

/**
 * Check if element has class
 * @param {HTMLElement} element - Element
 * @param {string} className - Class name
 * @returns {boolean}
 */
export function hasClass(element, className) {
    return element.classList.contains(className);
}

/**
 * Set multiple attributes
 * @param {HTMLElement} element - Element
 * @param {Object} attrs - Attributes object
 */
export function setAttributes(element, attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
}

/**
 * Remove element from DOM
 * @param {HTMLElement} element - Element to remove
 */
export function removeElement(element) {
    element?.parentNode?.removeChild(element);
}

/**
 * Empty element (remove all children)
 * @param {HTMLElement} element - Element to empty
 */
export function emptyElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Insert element after another element
 * @param {HTMLElement} newElement - New element
 * @param {HTMLElement} referenceElement - Reference element
 */
export function insertAfter(newElement, referenceElement) {
    referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
}

/**
 * Get element offset from document
 * @param {HTMLElement} element - Element
 * @returns {Object} Offset {top, left}
 */
export function getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset
    };
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element
 * @returns {boolean}
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element - Element
 * @param {Object} options - Scroll options
 */
export function scrollIntoView(element, options = {}) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
    });
}

/**
 * Delegate event listener
 * @param {HTMLElement} parent - Parent element
 * @param {string} selector - Child selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function delegate(parent, selector, event, handler) {
    parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target) {
            handler.call(target, e);
        }
    });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
