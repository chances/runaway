// Type definitions for Zepto FX
// Project: http://zeptojs.com/
// Definitions by: Chance Snow <https://github.com/chances/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

interface ZeptoFxCollection extends ZeptoCollection {

    anim(properties: any, duration?: number, ease?: string, callback?: () => void, delay?: number): ZeptoFxCollection;

    show(speed?: number, callback?: () => void): ZeptoFxCollection;

    hide(speed?: number, callback?: () => void): ZeptoFxCollection;

    //toggle(speed?: number, callback?: () => void): ZeptoFxCollection;

    fadeTo(speed?: number, opacity?: number, callback?: () => void): ZeptoFxCollection;

    fadeIn(speed?: number, callback?: () => void): ZeptoFxCollection;

    fadeOut(speed?: number, callback?: () => void): ZeptoFxCollection;

    fadeToggle(speed?: number, callback?: () => void): ZeptoFxCollection;
}
