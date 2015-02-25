module Runaway.Helpers {

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
