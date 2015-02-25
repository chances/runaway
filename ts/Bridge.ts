module Runaway {
    export class Bridge {

        private handlers: BridgeHandler[];

        constructor () {
            this.handlers = [];
        }

        /**
         * Add and subscribe to an event
         * @param event Type of bridge event to handle
         * @param callback Handling callback delegate
         * @return Unique id representing this event
         */
        on(event: string, callback: BridgeCallback): number {
            Math.random();
            var handler: BridgeHandler = {
                event: event,
                id: Runaway.Helpers.randomNumber(0, Date.now()),
                callback: callback
            };
            this.handlers.push(handler);
            return handler.id;
        }

        /**
         * Remove an event handler
         * @param id Unique id representing the event to remove
         */
        off(id: number): Bridge {
            var index = -1;
            for (var i = 0; i < this.handlers.length; i++) {
                if (this.handlers[i].id === id) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
            return this;
        }

        /**
         * Dispatch an event
         * @param event Type of bridge event to dispatch
         * @param data Data to pass along to event handlers
         * @param context=window Context in which to execute handling callback delegates
         */
        trigger(event: string, data: any = null, context = window): Bridge {
            this.handlers.forEach(function (handler: BridgeHandler) {
                if (handler.event === event) {
                    if (data === null) {
                        handler.callback.call(context);
                    } else {
                        handler.callback.call(context, data);
                    }
                }
            });
            return this;
        }
    }

    declare class BridgeHandler {
        event: string;
        id: number;
        callback: BridgeCallback;
    }

    export interface BridgeCallback {
        (data: any): void;
    }
}
