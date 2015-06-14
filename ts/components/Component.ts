class Component {
    private _element: ZeptoFxCollection;

    public get e(): ZeptoFxCollection {
        return this._element;
    }

    constructor (elementSelector: string);
    constructor (element: HTMLElement);
    constructor (element: any) {
        this._element = <ZeptoFxCollection>$(element);
    }

    public show(fade: boolean = false, duration: number = $.fx.speeds._default) {
        if (fade) {
            this.e.fadeIn(duration);
        } else {
            this.e.show();
        }
    }

    public hide(fade: boolean = false, duration: number = $.fx.speeds._default) {
        if (fade) {
            this.e.fadeOut(duration);
        } else {
            this.e.hide();
        }
    }
}

export = Component;
