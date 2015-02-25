module Runaway {

    export class Application {
        private _progress: Progress;
        private _results: Results;

        private _running: boolean;
        private _initByUser: boolean;

        constructor () {
            $(() => {
                this._progress = new Progress();
                this._results = new Results();

                this.getRunStatus().then((status: RunStatus) => {
                    if (status === RunStatus.RUNNING) {
                        this._running = true;
                        this._initByUser = false;
                        this._progress.reset();
                        this._progress.update().then(() => {
                            this._running = false;
                            this._progress.update();
                            this._results.hide(true);
                            delay(250).then(() => {
                                this._results.update();
                            });
                        }, () => {
                            this._running = false;
                            this._progress.update();
                            this._results.hide(true);
                            delay(250).then(() => {
                                this._results.update();
                            });
                        });
                        this._results.update();
                    } else if (status === RunStatus.NO_HOSTS) {
                        //TODO: Show no hosts error
                        this._progress.setStatus(ProgressStatus.ERROR);
                    } else {
                        this._results.update();
                    }
                });
            });

            this._running = false;
            this._initByUser = false;
        }

        public get progress() {
            return this._progress;
        }

        public get results() {
            return this._results;
        }

        public get isRunawayCheckRunning() {
            return this._running;
        }

        public get initByUser() {
            return this._initByUser;
        }

        public run() {
            this._running = true;
            this._initByUser = true;
            this._progress.reset();
            this._results.isDirty = true;

            this.getRunStatus().then((status: RunStatus) => {
                if (status === RunStatus.RUNNING) {
                    this._progress.errorText = 'Runaway! is currently performing a runaway check.';
                    this._progress.setStatus(ProgressStatus.ERROR);
                    this._progress.update().then(() => {
                        this._initByUser = false;
                        this._progress.update().then(() => {
                            this._running = false;
                            this._progress.setStatus(ProgressStatus.SUCCESS);
                            this._progress.update();
                            this._results.hide(true);
                            delay(250).then(() => {
                                this._results.update();
                            });
                        });
                    });
                } else if (status === RunStatus.NO_HOSTS) {
                    this._progress.errorText = 'There are no hosts to check.';
                    this._progress.setStatus(ProgressStatus.ERROR);
                    this._progress.update();
                } else {
                    Title.change('Running...');

                    this._progress.setStatus(ProgressStatus.RUNNING);
                    this._progress.update();

                    //Do request
                    var request = new XMLHttpRequest();
                    //Completed handler
                    request.onload = () => {
                        this.checkCompleted();
                    };
                    request.onprogress = () => {
                        //Parse progress
                        var response = request.responseText;
                        var lines = response.split('\n');
                        //Remove junk line
                        lines.pop();
                        //Update metadata if needed
                        if (!this._progress.hostCount) {
                            var meta = lines[0].split('|');
                            this._progress.hostCount = parseInt(meta[0]);
                            this._results.lastRunDate = meta[1];
                        }
                        //Update progress
                        if (lines.length > 2) {
                            this._progress.currentHostName = lines[lines.length - 1];
                            if (lines.length > 3) {
                                this._progress.currentHostIndex += 1.0;
                            }
                        }
                    };
                    request.open("get", "runaway.script", true);
                    request.send();
                    //delay(function () {
                    //    request.send();
                    //}, 200);
                }
            });
        }

        public checkCompleted() {
            this._progress.setStatus(ProgressStatus.SUCCESS);
            this._progress.currentHostIndex = this._progress.hostCount;
            delay(700).then(() => {
                this._results.hide(true, 300);
                delay(500).then(() => {
                    this._progress.layout();
                    this._results.update().then(() => {
                        this._running = false;
                        this._progress.update();
                        this._progress.layout();
                    });
                });
            });
            Title.change();
        }

        public getRunStatus(): PinkySwear.GenericPromise<RunStatus> {
            var promise = pinkySwear<RunStatus>();

            $.ajax({
                url: 'run.script',
                success: function(response) {
                    response = response.split('\n');
                    response = response[0];
                    if (response === "error: running") {
                        promise(true, [RunStatus.RUNNING]);
                    } else if (response === "error: no hosts") {
                        promise(true, [RunStatus.NO_HOSTS]);
                    } else {
                        promise(true, [RunStatus.NOT_RUNNING]);
                    }
                },
                dataType: 'text'});

            return promise;
        }
    }

    export enum RunStatus {
        NOT_RUNNING,
        RUNNING,
        NO_HOSTS
    }

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
}
