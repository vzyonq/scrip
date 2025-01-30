// ==UserScript==
// @name         User Agent Modifier
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Change the browser's user agent
// @author       Your Name
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const generateNoise = (level = 1) => (Math.random() - 0.5) * level;

    const createConsistentNoiseMap = () => {
        const noiseMap = new WeakMap();
        return {
            get: (rect) => {
                if (!noiseMap.has(rect)) {
                    noiseMap.set(rect, {
                        x: generateNoise(2),
                        y: generateNoise(2),
                        width: generateNoise(2),
                        height: generateNoise(2),
                        top: generateNoise(2),
                        right: generateNoise(2),
                        bottom: generateNoise(2),
                        left: generateNoise(2)
                    });
                }
                return noiseMap.get(rect);
            }
        };
    };

    const noiseMap = createConsistentNoiseMap();

    const addNoiseToRect = (rect) => {
        const noise = noiseMap.get(rect);
        return new DOMRect(
            rect.x + noise.x,
            rect.y + noise.y,
            rect.width + noise.width,
            rect.height + noise.height
        );
    };

    const addNoiseToReadOnly = (rect) => {
        const noise = noiseMap.get(rect);
        return {
            top: rect.top + noise.top,
            right: rect.right + noise.right,
            bottom: rect.bottom + noise.bottom,
            left: rect.left + noise.left
        };
    };

    const overrideElementPrototype = (prototype) => {
        const originalGetClientRects = prototype.getClientRects;
        prototype.getClientRects = function () {
            const originalRects = originalGetClientRects.call(this);
            const noisyRects = Array.from(originalRects).map((rect) => addNoiseToRect(rect));
            console.warn('Manipulated getClientRects:', noisyRects);
            return noisyRects;
        };

        const originalGetBoundingClientRect = prototype.getBoundingClientRect;
        prototype.getBoundingClientRect = function () {
            const originalRect = originalGetBoundingClientRect.call(this);
            const noisyRect = addNoiseToRect(originalRect);
            console.warn('Manipulated getBoundingClientRect:', noisyRect);
            return noisyRect;
        };
    };

    const overrideReadOnlyPrototype = (prototype) => {
        ["top", "right", "bottom", "left"].forEach((metric) => {
            try {
                Object.defineProperty(prototype, metric, {
                    get: new Proxy(Object.getOwnPropertyDescriptor(prototype, metric).get, {
                        apply(target, self, args) {
                            const result = Reflect.apply(target, self, args);
                            const noisyResult = result + generateNoise(2);
                            console.warn(`Manipulated ${metric}:`, noisyResult);
                            return noisyResult;
                        }
                    })
                });
            } catch (e) {
                console.error(`Error overriding ${metric}:`, e);
            }
        });
    };

    const applyManipulations = () => {
        overrideElementPrototype(Element.prototype);
        overrideReadOnlyPrototype(DOMRectReadOnly.prototype);
    };

    const applyToIframes = () => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
            try {
                const iframeWindow = iframe.contentWindow;
                overrideElementPrototype(iframeWindow.Element.prototype);
                overrideReadOnlyPrototype(iframeWindow.DOMRectReadOnly.prototype);
                console.log(`Manipulation applied to iframe: ${iframe.src}`);
            } catch (error) {
                console.warn(`Failed to manipulate iframe: ${iframe.src}`, error);
            }
        });
    };

    const observeDynamicChanges = () => {
        const observer = new MutationObserver(() => {
            applyToIframes();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    const initialize = () => {
        applyManipulations();
        applyToIframes();

        document.addEventListener('DOMContentLoaded', () => {
            observeDynamicChanges();
        });
    };

    initialize();

    console.log('Enhanced ClientRects and DOMRectReadOnly Manipulation Script is active.');

    const getRandom = (min, max) => Math.random() * (max - min) + min;

    // WebRTC Manipulation
    if (navigator.mediaDevices) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = function (constraints) {
            console.warn('Randomized WebRTC data');
            return new Promise((resolve, reject) => {
                resolve({
                    getTracks: () => [],
                    getVideoTracks: () => [],
                    getAudioTracks: () => [],
                    id: Math.random().toString(36).substr(2, 9),
                });
            });
        };
    }

    // AudioContext Manipulation
    if (window.AudioContext || window.webkitAudioContext) {
        const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;

        class FakeAudioContext extends OriginalAudioContext {
            constructor() {
                super();
                console.warn('AudioContext manipulated');
            }

            createAnalyser() {
                const analyser = super.createAnalyser();
                const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;

                analyser.getFloatFrequencyData = function (array) {
                    console.warn('Randomizing AudioContext frequency data');
                    for (let i = 0; i < array.length; i++) {
                        array[i] = getRandom(-100, 0);
                    }
                };

                return analyser;
            }

            createOscillator() {
                const oscillator = super.createOscillator();
                console.warn('Oscillator randomized');
                return oscillator;
            }
        }

        window.AudioContext = FakeAudioContext;
        window.webkitAudioContext = FakeAudioContext;
    }

    // WebGL Manipulation
    const randomizeWebGL = (target) => {
       const proto = target.prototype || Object.getPrototypeOf(target);

        proto.getParameter = new Proxy(proto.getParameter, {
            apply(target, self, args) {
                const param = args[0];
                const randomValues = {
                    37445: `RandomVendor-${Math.random().toString(36).substr(2, 5)}`,
                    37446: `RandomRenderer-${Math.random().toString(36).substr(2, 5)}`,
                };

                if (param in randomValues) {
                    console.warn(`WebGL randomized parameter: ${param}`);
                    return randomValues[param];
                }

                return Reflect.apply(target, self, args);
            },
        });

        proto.getExtension = new Proxy(proto.getExtension, {
            apply(target, self, args) {
                console.warn(`WebGL extension requested: ${args[0]}`);
                return Reflect.apply(target, self, args);
            },
        });
    };

    if (window.WebGLRenderingContext) {
        randomizeWebGL(WebGLRenderingContext);
    }

    if (window.WebGL2RenderingContext) {
        randomizeWebGL(WebGL2RenderingContext);
    }

    console.warn('WebRTC, AudioContext, and WebGL randomization active');
})();
