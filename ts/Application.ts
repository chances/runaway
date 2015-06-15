import Helpers = require('./Helpers');
import Constants = require('./RunawayConstants');
import Title = require('./Title');

import Progress = require('./services/Progress');
import ProgressComponent = require('./components/Progress');
import Results = require('./components/Results');

class Application {
    private _progress: ProgressComponent;
    private _results: Results;

    private _progressService: Progress;

    constructor (progress: Progress) {
        this._progressService = progress;

        $(() => {
            this._progress = new ProgressComponent(this, this._progressService);
            this._results = new Results(this._progressService);

            this.getRunStatus().then((status: Constants.RunStatus) => {
                if (status === Constants.RunStatus.RUNNING) {
                    this._progressService.isRunawayCheckRunning = true;
                    this._progressService.initByUser = false;
                    this._progress.reset();
                    this._progress.update().then(() => {
                        this._progressService.isRunawayCheckRunning = false;
                        this._progress.update();
                        this._results.hide(true);
                        Helpers.delay(250).then(() => {
                            this._results.update();
                        });
                    }, () => {
                        this._progressService.isRunawayCheckRunning = false;
                        this._progress.update();
                        this._results.hide(true);
                        Helpers.delay(250).then(() => {
                            this._results.update();
                        });
                    });
                    this._results.update();
                } else if (status === Constants.RunStatus.NO_HOSTS) {
                    //FIXME: Show no hosts error
                    this._progress.errorText = 'There are no hosts to check.';
                    this._progress.setStatus(Constants.ProgressStatus.ERROR);
                } else {
                    this._results.update();
                }
            });
        });

        this._progressService.isRunawayCheckRunning = false;
        this._progressService.initByUser = false;
    }

    public get progress() {
        return this._progress;
    }

    public get results() {
        return this._results;
    }

    public run() {
        this._progressService.isRunawayCheckRunning = true;
        this._progressService.initByUser = true;
        this._progress.reset();
        this._results.isDirty = true;

        this.getRunStatus().then((status: Constants.RunStatus) => {
            if (status === Constants.RunStatus.RUNNING) {
                this._progress.errorText = 'Runaway! is currently performing a runaway check.';
                this._progress.setStatus(Constants.ProgressStatus.ERROR);
                this._progress.update().then(() => {
                    this._progressService.initByUser = false;
                    this._progress.update().then(() => {
                        this._progressService.isRunawayCheckRunning = false;
                        this._progress.setStatus(Constants.ProgressStatus.SUCCESS);
                        this._progress.update();
                        this._results.hide(true);
                        Helpers.delay(250).then(() => {
                            this._results.update();
                        });
                    });
                });
            } else if (status === Constants.RunStatus.NO_HOSTS) {
                this._progress.errorText = 'There are no hosts to check.';
                this._progress.setStatus(Constants.ProgressStatus.ERROR);
                this._progress.update();
            } else {
                Title.change('Running...');

                this._progress.setStatus(Constants.ProgressStatus.RUNNING);
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
                    if (!this._progressService.hostCount) {
                        var meta = lines[0].split('|');
                        this._progressService.hostCount = parseInt(meta[0]);
                        this._results.lastRunDate = meta[1];
                    }
                    //Update progress
                    if (lines.length > 2) {
                        this._progressService.currentHostName = lines[lines.length - 1];
                        if (lines.length > 3) {
                            this._progressService.currentHostIndex += 1.0;
                        }
                    }
                };
                request.open("get", "runaway.script", true);
                request.send();
                //Helpers.delay(function () {
                //    request.send();
                //}, 200);
            }
        });
    }

    public checkCompleted() {
        this._progress.setStatus(Constants.ProgressStatus.SUCCESS);
        this._progressService.currentHostIndex = this._progressService.hostCount;
        Helpers.delay(700).then(() => {
            this._results.hide(true, 300);
            Helpers.delay(500).then(() => {
                this._progress.layout();
                this._results.update().then(() => {
                    this._progressService.isRunawayCheckRunning = false;
                    this._progress.update();
                    this._progress.layout();
                });
            });
        });
        Title.change();
    }

    public getRunStatus(): PinkySwear.GenericPromise<Constants.RunStatus> {
        var promise = pinkySwear<Constants.RunStatus>();

        $.ajax({
            url: 'run.script',
            success: function(response) {
                response = response.split('\n');
                response = response[0];
                if (response === "error: running") {
                    promise(true, [Constants.RunStatus.RUNNING]);
                } else if (response === "error: no hosts") {
                    promise(true, [Constants.RunStatus.NO_HOSTS]);
                } else {
                    promise(true, [Constants.RunStatus.NOT_RUNNING]);
                }
            },
            dataType: 'text'});

        return promise;
    }
}

export = Application;
