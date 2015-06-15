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
    private _progressStatus: Constants.ProgressStatus;

    constructor (app: Application, progressService: ProgressService) {
        super('#progress');

        this.app = app;
        this._progressService = progressService;
        this._progressStatus = Constants.ProgressStatus.NOT_RUNNING;

        this._runButton = new RunButton(app);
        this._runningLabel = new RunningLabel(progressService);
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
                    this.updateProgress();
                    break;
                default:
                    return;
            }
        });

        this.hide();

        this.layout();
        this.e.addClass('fixed');

        this.e.click(() => {
            this.hide(true);
            this.app.results.isDirty = false;
        });
    }

    public set errorText(value: string) {
        this.e.find('.text-danger').text(value);
    }

    public show() {
        if (!this.visible) {
            super.show();
        } else {
            this.e.css({
                'display': 'block',
                'opacity': 1
            });
        }
    }

    public hide(fast: boolean = false) {
        super.hide(true, fast ? $.fx.speeds.fast : 300);
    }

    public setStatus(status: Constants.ProgressStatus) {
        this.e.find('p').hide();
        this._progressBar.e.removeClass('progress-bar-danger progress-bar-success');
        this._progressBar.e.parent().show();
        this._icon.e.find('span').removeClass('glyphicon-refresh glyphicon-ok-circle glyphicon-exclamation-sign');

        this._progressStatus = status;

        switch (status) {
            case Constants.ProgressStatus.ERROR:
                this.e.find('.text-danger').show();
                this._progressBar.e.addClass('progress-bar-danger');
                this._progressBar.e.parent().hide();
                this._icon.e.find('.glyphicon').addClass('glyphicon-exclamation-sign');
                this.show();
                break;
            case Constants.ProgressStatus.SUCCESS:
                this._progressService.isRunawayCheckRunning = false;
                this.e.find('.text-success').show();
                this._progressBar.e.addClass('progress-bar-success');
                this._progressBar.e.parent().hide();
                this._icon.e.find('.glyphicon').addClass('glyphicon-ok-circle');
                break;
            case Constants.ProgressStatus.RUNNING:
                this._progressService.isRunawayCheckRunning = true;
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

    public reset() {
        this._progressService.reset();
    }

    private updateProgress() {
        this._progressBar.e.css('width','' + (this._progressService.progress * 100).toFixed(0) + '%');

        if (this._progressService.isRunawayCheckRunning && !this._progressService.initByUser) {
            this._runButton.hide();
            this._runningLabel.show();
        } else if (this._progressService.isRunawayCheckRunning) {
            this._runButton.hide();
            this._runningLabel.show();
        } else {
            this._runButton.show();
            this._runningLabel.hide();
        }
    }
}

export = Progress;
