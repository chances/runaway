/// <reference path="../Application.ts" />
import Helpers = require('../Helpers');
import Bridge = require('../Bridge');

class Progress {
    private _app: Application;
    private events: Bridge;
    private _progress: number;
    private _hostCount: number;
    private _currentHostIndex: number;
    private _currentHostName: string;

    constructor() {
        this._app = null;
        this.events = new Bridge();
        this._progress = 0.0;
        this._hostCount = 0;
        this._currentHostIndex = 0;
        this._currentHostName = "";
    }

    set app(value: Application) {
        this._app = value;
    }

    get progress(): number {
        return this._progress;
    }
    set progress(value: number) {
        this._progress = value;
        this.events.trigger("propertyChanged", {property: "progress"});
    }

    public get hostCount(): number {
        return this._hostCount;
    }
    public set hostCount(value: number) {
        this._hostCount = value;
        this.events.trigger("propertyChanged", {property: "hostCount"});
    }

    public get currentHostIndex(): number {
        return this._currentHostIndex;
    }
    public set currentHostIndex(value: number) {
        this._currentHostIndex = value;
        this.events.trigger("propertyChanged", {property: "currentHostIndex"});
    }

    public get currentHostName(): string {
        return this._currentHostName;
    }
    public set currentHostName(value: string) {
        this._currentHostName = value;
        this.events.trigger("propertyChanged", {property: "currentHostName"});
    }

    addEventListener(event: string, callback: BridgeCallback) {
        this.events.on(event, callback);
    }

    public reset() {
        this._progress = 0.0;
        this._hostCount = 0;
        this._currentHostIndex = 0;
        this._currentHostName = '';

        this.events.trigger("propertyChanged", {property: "progress"});
        this.events.trigger("propertyChanged", {property: "hostCount"});
        this.events.trigger("propertyChanged", {property: "currentHostIndex"});
        this.events.trigger("propertyChanged", {property: "currentHostName"});
    }

    public update(): PinkySwear.Promise {
        var promise = pinkySwear(),
            trackProgress: Helpers.Interval,
            doUpdateProgress = () => {
                this.getProgress().then((progress) => {
                    if (progress === 1.0) {
                        trackProgress.clear();
                        promise(true, []);
                    }
                }, function () {
                    trackProgress.clear();
                    promise(false, []);
                });
            };

        if (this._app.isRunawayCheckRunning && !this._app.initByUser) {
            trackProgress = Helpers.interval(function () {
                doUpdateProgress();
            }, 2000);
            doUpdateProgress();
        }

        return promise;
    }

    private getProgress(): PinkySwear.GenericPromise<number> {
        var promise = pinkySwear<number>();

        $.ajax({
            url: 'progress.txt',
            success: (response) => {
                response = response.split('\n')[0].split(' ');
                if (response[1] === "done") {
                    this.hostCount = parseInt(response[0]);
                    this.currentHostIndex = this.hostCount;

                    promise(true, [1.0]);
                } else {
                    this.currentHostName = response[1];
                    response = response[0].split('/');
                    this._hostCount = parseInt(response[1]);
                    this.currentHostIndex = parseInt(response[0]);

                    promise(true, [this.progress]);
                }
            },
            error: function() {
                promise(false, [0.0]);
            },
            dataType: 'text'
        });

        return promise;
    }
}

export = Progress;
