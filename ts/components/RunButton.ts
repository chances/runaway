module Runaway {

    export class RunButton extends Component {
        private _disabled: boolean;

        constructor () {
            super('#run');

            this._disabled = false;

            this.e.click(function () {
                app.run();
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
}
