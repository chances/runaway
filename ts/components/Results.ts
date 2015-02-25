module Runaway {

    export class Results extends Component {
        private _noResults: Component;
        private _runTime: Component;

        private _runDate: string;
        private _isDirty: boolean;

        constructor () {
            super('#results');

            this._noResults = new Component('#noResults');
            this._runTime = new Component('#runTime');

            this._runDate = '';
            this._isDirty = false;

            this.hide(false);
        }

        public get lastRunDate() {
            return this._runDate;
        }
        public set lastRunDate(value: string) {
            this._runDate = value;
            this._runTime.e.text(value);
        }

        public get isDirty() {
            return this._isDirty;
        }
        public set isDirty(value: boolean) {
            this._isDirty = value;
            if (value) {
                this.e.addClass('dirty');
                this._noResults.hide(true, $.fx.speeds.fast);
            } else {
                this.e.removeClass('dirty');
                if (app.progress.hostCount === 0) {
                    this._noResults.show(true, $.fx.speeds.fast);
                }
            }
        }

        public update(): PinkySwear.Promise {
            var promise = pinkySwear();

            this.isDirty = true;
            this.getResults().then((results: string) => {
                this.parse(results);
                this.isDirty = false;
                delay(225).then(() => {
                    this.show(true);
                    promise(true, []);
                });
            });

            return promise;
        }

        private getResults(): PinkySwear.GenericPromise<string> {
            var promise = pinkySwear<string>();

            $.get('results.txt', function(response: string) {
                promise(true, [response]);
            }, 'text/plain');

            return promise;
        }

        private parse(results: string) {
            var hosts: string[] = results.split('\n\n'),
                date: string = hosts.shift();

            if (this._runTime.e.text() === 'never') {
                this._runTime.e.text(date);
            }

            //Clear results
            this.e.empty();

            for (var h = 0; h < hosts.length; h++) {
                var lines: string[] = hosts[h].split('\n'),
                    meta: string[] = lines.shift().split(' ');

                var host: ZeptoCollection = $('<div>').addClass('host well');
                var header: ZeptoCollection = $('<h3>').text(meta[0] + ' ').append($('<small>').text(meta[1]));
                var processes: ZeptoCollection = $('<div>').addClass('processes table-responsive');
                if (lines.length > 1) {
                    //Make table
                    var table: ZeptoCollection = $('<table>').addClass('table table-striped'),
                        thead: ZeptoCollection = $('<thead>'),
                        tbody: ZeptoCollection = $('<tbody>');
                    thead.append($('<tr>').append('<td>PID</td>').append('<td>Command</td>')
                        .append('<td>User</td>').append('<td>CPU Usage</td>')
                        .append('<td>RAM Usage</td>').append('<td>CPU Time</td>'));
                    //Whether or not to show a warning
                    var warning = false,
                        warningRed = false;
                    //Parse rows
                    for (var i = 0; i < lines.length; i++) {
                        var row: ZeptoCollection = $('<tr>');
                        var cols: string[] = lines[i].split(' ');
                        var colCount: number = 0;
                        for (var v = 0; v < cols.length; v++) {
                            if (cols[v].length > 0) {
                                colCount++;
                                var col: ZeptoCollection = $('<td>');
                                var content: string = cols[v];
                                var contentVal: number;
                                var text = true;
                                //Format CPU usage
                                if (colCount === 4) {
                                    contentVal = parseFloat(cols[v]);
                                    if (contentVal >= 20.0)
                                        warning = true;
                                    if (contentVal >= 40.0)
                                        warningRed = true;
                                    if (contentVal % 1 === 0.0) {
                                        content = '' + contentVal.toFixed(0) + '%';
                                    } else {
                                        content = '' + contentVal.toFixed(1) + '%';
                                    }
                                }
                                //Format RAM usage
                                else if (colCount === 5) {
                                    contentVal = parseFloat(cols[v]);
                                    if (contentVal === 0.0)
                                        content = "";
                                }
                                col.text(content);
                                row.append(col);
                            }
                        }
                        tbody.append(row);
                    }
                    //Show warning if necessary
                    if (warning) {
                        var glyph: ZeptoCollection = $('<span>');
                        glyph.addClass('glyphicon glyphicon-warning-sign pull-right');
                        if (warningRed)
                            glyph.toggleClass('glyphicon-warning-sign glyphicon-exclamation-sign');
                        header.append(glyph);
                    }

                    table.append(thead);
                    table.append(tbody);
                    processes.append(table);
                    host.append(header);
                    host.append(processes);
                    this.e.append(host);
                }
            }

            //Remove empty rows
            this.e.find('tr:empty').remove();

            //Count dangers and warnings
            var numDangers: number = this.e.find('.glyphicon-exclamation-sign').size();
            var numWarnings: number = this.e.find('.glyphicon-warning-sign').size();
            if (numWarnings > 0) {
                var warningAlert = $('<div class="alert alert-warning">');
                var content: string = "<strong>Heads up!</strong> There";
                content += (numWarnings === 1 ? "'s something fishy" : " are " + numWarnings +
                    " (or more) resource hogs") + " out there.";
                warningAlert.html(content);
                this.e.prepend(warningAlert);
            }
            if (numDangers > 0) {
                var dangerAlert: ZeptoCollection = $('<div>').addClass('alert alert-danger');
                var content: string = "<strong>Oh snap!</strong> There ";
                content += (numDangers === 1 ? "is one danger " : "are " + numDangers + " dangers ") + " lurking.";
                dangerAlert.html(content);
                this.e.prepend(dangerAlert);
            }

            //Give the user's names
            this.e.find('tbody > tr > td:nth-child(3)').mouseenter(function () {
                var elem: ZeptoCollection = $(this);
                if (!elem.attr('title') && !elem.attr('data-unknown')) {
                    $.get('finger.script?user=' + elem.text(), function (response) {
                        response = (response ? response : false);
                        var matchingUsernames = $('td:nth-child(3)').filter(function () {
                            return $(this).text() === elem.text();}
                        );
                        if (response) {
                            matchingUsernames.attr('title', response);
                        } else {
                            var blip = $('<span>');
                            blip.addClass('glyphicon glyphicon-question-sign pull-right');
                            blip.attr('title','Unknown user, probably specific to an application');
                            matchingUsernames.attr('data-unknown', 'true').append(blip);
                        }
                    }, 'text/plain');
                }
            });
        }
    }
}
