import Application = require('../Application');

import Component = require('./Component');

class RunButton extends Component {
    private _app: Application;
    private _disabled: boolean;

    constructor (app: Application) {
        super('#run');

        this._app = app;

        this._disabled = false;

        this.e.click(() => {
            this._app.run();
        });
    }

    public get disabled() {
        return this._disabled;
    }
    public set disabled(value: boolean) {
        this._disabled = value;
        if (value) {
            this.e.attr('disabled', '');
        } else {
            this.e.removeAttr('disabled');
        }
    }
}

export = RunButton;
