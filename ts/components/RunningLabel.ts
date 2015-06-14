import Component = require('./Component');

class RunningLabel extends Component {
    private _percentElem: Component;

    private _progress: number;

    constructor () {
        super('#running');

        this._percentElem = new Component('#runningPercent');
        this._percentElem.hide();

        this._progress = 0.0;

        this.hide();
    }

    public get progress() {
        return this._progress;
    }
    public set progress(value: number) {
        this._progress = value;
        if (value === 0.0) {
            this._percentElem.hide();
        } else {
            if (!app.initByUser) {
                this._percentElem.show();
                console.log(value);
                this._percentElem.e.text('(' + (value * 100).toFixed(0) + '%)');
            } else {
                this._percentElem.hide();
            }
        }
    }
}

export = RunningLabel;
