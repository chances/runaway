import ProgressService = require('../services/Progress');
import Component = require('./Component');

class RunningLabel extends Component {
    private _percentElem: Component;

    private _progressService: ProgressService;

    constructor (progressService: ProgressService) {
        super('#running');

        this._progressService = progressService;
        this._progressService.addEventListener('propertyChanged', (data) => {
            if (data.property === 'progress') {
                if (this._progressService.progress === 0.0) {
                    this._percentElem.hide();
                } else {
                    if (!this._progressService.initByUser) {
                        this._percentElem.show();
                        this._percentElem.e.text('(' + (this._progressService.progress * 100).toFixed(0) + '%)');
                    } else {
                        this._percentElem.hide();
                    }
                }
            }
        });

        this._percentElem = new Component('#runningPercent');
        this._percentElem.hide();

        this.hide();
    }
}

export = RunningLabel;
