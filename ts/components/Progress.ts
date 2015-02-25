module Runaway {

    export class Progress extends Component {
        private _runButton: RunButton;
        private _runningLabel: RunningLabel;
        private _hostCountElem: Component;
        private _hostIndex: Component;
        private _hostName: Component;
        private _progressBar: Component;
        private _icon: Component;

        private _progress: number;
        private _hostCount: number;
        private _currentHostIndex: number;
        private _currentHostName: string;

        constructor () {
            super('#progress');

            this._runButton = new RunButton();
            this._runningLabel = new RunningLabel();
            this._hostCountElem = new Component('#hostCount');
            this._hostIndex = new Component('#curHostIndex');
            this._hostName = new Component('#hostName');
            this._progressBar = new Component('#progressBar');
            this._icon = new Component('#icon');

            this._progress = 0.0;
            this._hostCount = 0;
            this._currentHostIndex = 0;
            this._currentHostName = '';

            this.hide(false);

            this.layout();
            this.e.addClass('fixed');

            this.e.click(() => {
                this.hide(true, $.fx.speeds.fast);
                app.results.isDirty = false;
            });
        }

        public get progress(): number {
            return this._progress;
        }

        public get hostCount(): number {
            return this._hostCount;
        }
        public set hostCount(value: number) {
            this._hostCount = value;
            this._hostCountElem.e.text(value.toString());
            if (value > 0) {
                this.updateProgress(this._currentHostIndex / this._hostCount);
            }
        }

        public get currentHostIndex(): number {
            return this._currentHostIndex;
        }
        public set currentHostIndex(value: number) {
            this._currentHostIndex = value;
            this._hostIndex.e.text(value.toString());
            if (this.hostCount > 0) {
                this.updateProgress(this._currentHostIndex / this._hostCount);
            }
        }

        public get currentHostName(): string {
            return this._currentHostName;
        }
        public set currentHostName(value: string) {
            this._currentHostName = value;
            this._hostName.e.text(value);
        }

        public set errorText(value: string) {
            this.e.find('.text-danger').text(value);
        }

        public setStatus(status: ProgressStatus) {
            this.e.find('p').hide();
            this._progressBar.e.removeClass('progress-bar-danger progress-bar-success');
            this._progressBar.e.parent().show();
            this._icon.e.find('span').removeClass('glyphicon-refresh glyphicon-ok-circle glyphicon-exclamation-sign');

            switch (status) {
                case ProgressStatus.ERROR:
                    this.e.find('.text-danger').show();
                    this._progressBar.e.addClass('progress-bar-danger');
                    this._progressBar.e.parent().hide();
                    this._icon.e.find('.glyphicon').addClass('glyphicon-exclamation-sign');
                    break;
                case ProgressStatus.SUCCESS:
                    this.e.find('.text-success').show();
                    this._progressBar.e.addClass('progress-bar-success');
                    this._progressBar.e.parent().hide();
                    this._icon.e.find('.glyphicon').addClass('glyphicon-ok-circle');
                    break;
                case ProgressStatus.RUNNING:
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
                trackProgress: Interval,
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

            if (app.isRunawayCheckRunning && !app.initByUser) {
                trackProgress = interval(function () {
                    doUpdateProgress();
                }, 2000);
                doUpdateProgress();

                this._runButton.hide();
                this._runningLabel.show();
            } else if (app.isRunawayCheckRunning) {
                this._runButton.hide();
                this._runningLabel.show();
                delay(250).then(() => {
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
            this._progress = 0.0;
            this._hostCount = 0;
            this._currentHostIndex = 0;
            this._currentHostName = '';
            this._runningLabel.progress = this._progress;
            this._progressBar.e.css('width','0%');
        }

        private updateProgress(progress: number) {
            this._progress = progress;
            this._runningLabel.progress = progress;
            this._progressBar.e.css('width','' + (progress * 100).toFixed(0) + '%');
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

    export enum ProgressStatus {
        RUNNING,
        SUCCESS,
        ERROR
    }
}
