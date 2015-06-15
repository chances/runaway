import Helpers = require('../Helpers');
import Constants = require('../RunawayConstants');

import Application = require('../Application');
import ProgressService = require('../services/Progress');
import Component = require('./Component');
import RunButton = require('./RunButton');
import RunningLabel = require('./RunningLabel');

class Progress extends Component {
    private app: Application;

    private _runButton: RunButton;
    private _runningLabel: RunningLabel;
    private _hostCountElem: Component;
    private _hostIndex: Component;
    private _hostName: Component;
    private _progressBar: Component;
    private _icon: Component;

    private _progressService: ProgressService;

    constructor (app: Application, progressService: ProgressService) {
        super('#progress');

        this.app = app;
        this._progressService = progressService;

        this._runButton = new RunButton();
        this._runningLabel = new RunningLabel();
        this._hostCountElem = new Component('#hostCount');
        this._hostIndex = new Component('#curHostIndex');
        this._hostName = new Component('#hostName');
        this._progressBar = new Component('#progressBar');
        this._icon = new Component('#icon');

        this._progressService.addEventListener('propertyChanged', (data) => {
            switch (data.property) {
                case 'isRunawayCheckRunning':
                    break;
                case 'initByUser':
                    break;
                case 'currentHostName':
                    this._hostName.e.text(this._progressService.currentHostName);
                    break;
                case 'hostCount':
                case 'currentHostIndex':
                case 'progress':
                    this._hostCountElem.e.text(this._progressService.hostCount.toString());
                    this._hostIndex.e.text(this._progressService.currentHostIndex.toString());
                    if (this._progressService.hostCount > 0) {
                        this.updateProgress();
                    }
                    break;
                default:
                    return;
            }
        });

        this.hide();

        this.layout();
        this.e.addClass('fixed');

        this.e.click(() => {
            this.hide(true, $.fx.speeds.fast);
            this.app.results.isDirty = false;
        });
    }

    public set errorText(value: string) {
        this.e.find('.text-danger').text(value);
    }

    public setStatus(status: Constants.ProgressStatus) {
        this.e.find('p').hide();
        this._progressBar.e.removeClass('progress-bar-danger progress-bar-success');
        this._progressBar.e.parent().show();
        this._icon.e.find('span').removeClass('glyphicon-refresh glyphicon-ok-circle glyphicon-exclamation-sign');

        switch (status) {
            case Constants.ProgressStatus.ERROR:
                this.e.find('.text-danger').show();
                this._progressBar.e.addClass('progress-bar-danger');
                this._progressBar.e.parent().hide();
                this._icon.e.find('.glyphicon').addClass('glyphicon-exclamation-sign');
                break;
            case Constants.ProgressStatus.SUCCESS:
                this.e.find('.text-success').show();
                this._progressBar.e.addClass('progress-bar-success');
                this._progressBar.e.parent().hide();
                this._icon.e.find('.glyphicon').addClass('glyphicon-ok-circle');
                break;
            case Constants.ProgressStatus.RUNNING:
                this.e.find('p').first().show();
                this._icon.e.find('.glyphicon').addClass('glyphicon-refresh');
                break;
        }
    }

    public layout() {
        //Center progress well horizontally
        if (!this.e.hasClass('fixed')) {
            this.e.addClass('fixed').show();
            var left = $(window).width() / 2 - this.e.width() / 2;
            this.e.css('left',left + 'px').hide();
        }
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

        if (this._progressService.isRunawayCheckRunning && !this._progressService.initByUser) {
            trackProgress = Helpers.interval(function () {
                doUpdateProgress();
            }, 2000);
            doUpdateProgress();

            this._runButton.hide();
            this._runningLabel.show();
        } else if (this._progressService.isRunawayCheckRunning) {
            this._runButton.hide();
            this._runningLabel.show();
            Helpers.delay(250).then(() => {
                this.show(true, $.fx.speeds.fast);
            });
            promise(true, []);
        } else {
            this._runButton.show();
            this._runningLabel.hide();
            this.hide(true, 300);
            promise(true, []);
        }

        return promise;
    }

    public reset() {
        this._progressService.reset();
        this.updateProgress();
    }

    private updateProgress() {
        this._runningLabel.progress = this._progressService.progress;
        this._progressBar.e.css('width','' + (this._progressService.progress * 100).toFixed(0) + '%');
    }

    private getProgress(): PinkySwear.GenericPromise<number> {
        var promise = pinkySwear<number>();

        $.ajax({
            url: 'progress.txt',
            success: (response) => {
                response = response.split('\n')[0].split(' ');
                if (response[1] === "done") {
                    this._progressService.hostCount = parseInt(response[0]);
                    this._progressService.currentHostIndex = this._progressService.hostCount;

                    promise(true, [1.0]);
                } else {
                    this._progressService.currentHostName = response[1];
                    response = response[0].split('/');
                    this._progressService.hostCount = parseInt(response[1]);
                    this._progressService.currentHostIndex = parseInt(response[0]);

                    promise(true, [this._progressService.progress]);
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
