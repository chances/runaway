module Helpers {

    export function delay(time: number): PinkySwear.Promise {
        var promise = pinkySwear();
        window.setTimeout(function () {
            promise(true);
        }, time);
        return promise;
    }

    export interface Interval {
        intervalId: number;
        clear: () => void;
    }

    //Interval utility function
    export function interval(func: () => void, time: number): Interval {
        var interval = window.setInterval(func, time);
        return {
            intervalId: interval,
            clear: function () { window.clearInterval(interval); }
        };
    }

    export function randomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    export function objectIsA(object: any, type: any) {
        if (type.hasOwnProperty("prototype")) {
            return object.constructor.name === type.prototype.constructor.name;
        } else {
            return false;
        }
    }
}

export = Helpers;
