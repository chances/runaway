var Runaway;
(function (Runaway) {
    var Bridge = (function () {
        function Bridge() {
            this.handlers = [];
        }
        /**
         * Add and subscribe to an event
         * @param event Type of bridge event to handle
         * @param callback Handling callback delegate
         * @return Unique id representing this event
         */
        Bridge.prototype.on = function (event, callback) {
            Math.random();
            var handler = {
                event: event,
                id: Runaway.Helpers.randomNumber(0, Date.now()),
                callback: callback
            };
            this.handlers.push(handler);
            return handler.id;
        };
        /**
         * Remove an event handler
         * @param id Unique id representing the event to remove
         */
        Bridge.prototype.off = function (id) {
            var index = -1;
            for (var i = 0; i < this.handlers.length; i++) {
                if (this.handlers[i].id === id) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
            return this;
        };
        /**
         * Dispatch an event
         * @param event Type of bridge event to dispatch
         * @param data Data to pass along to event handlers
         * @param context=window Context in which to execute handling callback delegates
         */
        Bridge.prototype.trigger = function (event, data, context) {
            if (data === void 0) { data = null; }
            if (context === void 0) { context = window; }
            this.handlers.forEach(function (handler) {
                if (handler.event === event) {
                    if (data === null) {
                        handler.callback.call(context);
                    }
                    else {
                        handler.callback.call(context, data);
                    }
                }
            });
            return this;
        };
        return Bridge;
    })();
    Runaway.Bridge = Bridge;
})(Runaway || (Runaway = {}));

var Runaway;
(function (Runaway) {
    var Helpers;
    (function (Helpers) {
        function randomNumber(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }
        Helpers.randomNumber = randomNumber;
        function objectIsA(object, type) {
            if (type.hasOwnProperty("prototype")) {
                return object.constructor.name === type.prototype.constructor.name;
            }
            else {
                return false;
            }
        }
        Helpers.objectIsA = objectIsA;
    })(Helpers = Runaway.Helpers || (Runaway.Helpers = {}));
})(Runaway || (Runaway = {}));

var Runaway;
(function (Runaway) {
    var Application = (function () {
        function Application() {
            var _this = this;
            $(function () {
                _this._progress = new Runaway.Progress();
                _this._results = new Runaway.Results();
                _this.getRunStatus().then(function (status) {
                    if (status === 1 /* RUNNING */) {
                        _this._running = true;
                        _this._initByUser = false;
                        _this._progress.reset();
                        _this._progress.update().then(function () {
                            _this._running = false;
                            _this._progress.update();
                            _this._results.hide(true);
                            delay(250).then(function () {
                                _this._results.update();
                            });
                        }, function () {
                            _this._running = false;
                            _this._progress.update();
                            _this._results.hide(true);
                            delay(250).then(function () {
                                _this._results.update();
                            });
                        });
                        _this._results.update();
                    }
                    else if (status === 2 /* NO_HOSTS */) {
                        //TODO: Show no hosts error
                        _this._progress.setStatus(2 /* ERROR */);
                    }
                    else {
                        _this._results.update();
                    }
                });
            });
            this._running = false;
            this._initByUser = false;
        }
        Object.defineProperty(Application.prototype, "progress", {
            get: function () {
                return this._progress;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Application.prototype, "results", {
            get: function () {
                return this._results;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Application.prototype, "isRunawayCheckRunning", {
            get: function () {
                return this._running;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Application.prototype, "initByUser", {
            get: function () {
                return this._initByUser;
            },
            enumerable: true,
            configurable: true
        });
        Application.prototype.run = function () {
            var _this = this;
            this._running = true;
            this._initByUser = true;
            this._progress.reset();
            this._results.isDirty = true;
            this.getRunStatus().then(function (status) {
                if (status === 1 /* RUNNING */) {
                    _this._progress.errorText = 'Runaway! is currently performing a runaway check.';
                    _this._progress.setStatus(2 /* ERROR */);
                    _this._progress.update().then(function () {
                        _this._initByUser = false;
                        _this._progress.update().then(function () {
                            _this._running = false;
                            _this._progress.setStatus(1 /* SUCCESS */);
                            _this._progress.update();
                            _this._results.hide(true);
                            delay(250).then(function () {
                                _this._results.update();
                            });
                        });
                    });
                }
                else if (status === 2 /* NO_HOSTS */) {
                    _this._progress.errorText = 'There are no hosts to check.';
                    _this._progress.setStatus(2 /* ERROR */);
                    _this._progress.update();
                }
                else {
                    Runaway.Title.change('Running...');
                    _this._progress.setStatus(0 /* RUNNING */);
                    _this._progress.update();
                    //Do request
                    var request = new XMLHttpRequest();
                    //Completed handler
                    request.onload = function () {
                        _this.checkCompleted();
                    };
                    request.onprogress = function () {
                        //Parse progress
                        var response = request.responseText;
                        var lines = response.split('\n');
                        //Remove junk line
                        lines.pop();
                        //Update metadata if needed
                        if (!_this._progress.hostCount) {
                            var meta = lines[0].split('|');
                            _this._progress.hostCount = parseInt(meta[0]);
                            _this._results.lastRunDate = meta[1];
                        }
                        //Update progress
                        if (lines.length > 2) {
                            _this._progress.currentHostName = lines[lines.length - 1];
                            if (lines.length > 3) {
                                _this._progress.currentHostIndex += 1.0;
                            }
                        }
                    };
                    request.open("get", "runaway.script", true);
                    request.send();
                }
            });
        };
        Application.prototype.checkCompleted = function () {
            var _this = this;
            this._progress.setStatus(1 /* SUCCESS */);
            this._progress.currentHostIndex = this._progress.hostCount;
            delay(700).then(function () {
                _this._results.hide(true, 300);
                delay(500).then(function () {
                    _this._progress.layout();
                    _this._results.update().then(function () {
                        _this._running = false;
                        _this._progress.update();
                        _this._progress.layout();
                    });
                });
            });
            Runaway.Title.change();
        };
        Application.prototype.getRunStatus = function () {
            var promise = pinkySwear();
            $.ajax({
                url: 'run.script',
                success: function (response) {
                    response = response.split('\n');
                    response = response[0];
                    if (response === "error: running") {
                        promise(true, [1 /* RUNNING */]);
                    }
                    else if (response === "error: no hosts") {
                        promise(true, [2 /* NO_HOSTS */]);
                    }
                    else {
                        promise(true, [0 /* NOT_RUNNING */]);
                    }
                },
                dataType: 'text'
            });
            return promise;
        };
        return Application;
    })();
    Runaway.Application = Application;
    (function (RunStatus) {
        RunStatus[RunStatus["NOT_RUNNING"] = 0] = "NOT_RUNNING";
        RunStatus[RunStatus["RUNNING"] = 1] = "RUNNING";
        RunStatus[RunStatus["NO_HOSTS"] = 2] = "NO_HOSTS";
    })(Runaway.RunStatus || (Runaway.RunStatus = {}));
    var RunStatus = Runaway.RunStatus;
    function delay(time) {
        var promise = pinkySwear();
        window.setTimeout(function () {
            promise(true);
        }, time);
        return promise;
    }
    Runaway.delay = delay;
    //Interval utility function
    function interval(func, time) {
        var interval = window.setInterval(func, time);
        return {
            intervalId: interval,
            clear: function () {
                window.clearInterval(interval);
            }
        };
    }
    Runaway.interval = interval;
})(Runaway || (Runaway = {}));

var Runaway;
(function (Runaway) {
    var Title = (function () {
        function Title() {
        }
        Title.change = function (newTitle) {
            newTitle = (newTitle === undefined ? Title.oldTitle : newTitle);
            $('title').text(newTitle);
        };
        Title.oldTitle = $('title').text();
        return Title;
    })();
    Runaway.Title = Title;
})(Runaway || (Runaway = {}));

var services = {
    progress: new Runaway.Services.Progress()
};
var app = new Runaway.Application();

var Runaway;
(function (Runaway) {
    var Component = (function () {
        function Component(element) {
            this._element = $(element);
        }
        Object.defineProperty(Component.prototype, "e", {
            get: function () {
                return this._element;
            },
            enumerable: true,
            configurable: true
        });
        Component.prototype.show = function (fade, duration) {
            if (fade === void 0) { fade = false; }
            if (duration === void 0) { duration = $.fx.speeds._default; }
            if (fade) {
                this.e.fadeIn(duration);
            }
            else {
                this.e.show();
            }
        };
        Component.prototype.hide = function (fade, duration) {
            if (fade === void 0) { fade = false; }
            if (duration === void 0) { duration = $.fx.speeds._default; }
            if (fade) {
                this.e.fadeOut(duration);
            }
            else {
                this.e.hide();
            }
        };
        return Component;
    })();
    Runaway.Component = Component;
})(Runaway || (Runaway = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Runaway;
(function (Runaway) {
    var Progress = (function (_super) {
        __extends(Progress, _super);
        function Progress() {
            var _this = this;
            _super.call(this, '#progress');
            this._runButton = new Runaway.RunButton();
            this._runningLabel = new Runaway.RunningLabel();
            this._hostCountElem = new Runaway.Component('#hostCount');
            this._hostIndex = new Runaway.Component('#curHostIndex');
            this._hostName = new Runaway.Component('#hostName');
            this._progressBar = new Runaway.Component('#progressBar');
            this._icon = new Runaway.Component('#icon');
            this._progress = 0.0;
            this._hostCount = 0;
            this._currentHostIndex = 0;
            this._currentHostName = '';
            this.hide(false);
            this.layout();
            this.e.addClass('fixed');
            this.e.click(function () {
                _this.hide(true, $.fx.speeds.fast);
                app.results.isDirty = false;
            });
        }
        Object.defineProperty(Progress.prototype, "progress", {
            get: function () {
                return this._progress;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Progress.prototype, "hostCount", {
            get: function () {
                return this._hostCount;
            },
            set: function (value) {
                this._hostCount = value;
                this._hostCountElem.e.text(value.toString());
                if (value > 0) {
                    this.updateProgress(this._currentHostIndex / this._hostCount);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Progress.prototype, "currentHostIndex", {
            get: function () {
                return this._currentHostIndex;
            },
            set: function (value) {
                this._currentHostIndex = value;
                this._hostIndex.e.text(value.toString());
                if (this.hostCount > 0) {
                    this.updateProgress(this._currentHostIndex / this._hostCount);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Progress.prototype, "currentHostName", {
            get: function () {
                return this._currentHostName;
            },
            set: function (value) {
                this._currentHostName = value;
                this._hostName.e.text(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Progress.prototype, "errorText", {
            set: function (value) {
                this.e.find('.text-danger').text(value);
            },
            enumerable: true,
            configurable: true
        });
        Progress.prototype.setStatus = function (status) {
            this.e.find('p').hide();
            this._progressBar.e.removeClass('progress-bar-danger progress-bar-success');
            this._progressBar.e.parent().show();
            this._icon.e.find('span').removeClass('glyphicon-refresh glyphicon-ok-circle glyphicon-exclamation-sign');
            switch (status) {
                case 2 /* ERROR */:
                    this.e.find('.text-danger').show();
                    this._progressBar.e.addClass('progress-bar-danger');
                    this._progressBar.e.parent().hide();
                    this._icon.e.find('.glyphicon').addClass('glyphicon-exclamation-sign');
                    break;
                case 1 /* SUCCESS */:
                    this.e.find('.text-success').show();
                    this._progressBar.e.addClass('progress-bar-success');
                    this._progressBar.e.parent().hide();
                    this._icon.e.find('.glyphicon').addClass('glyphicon-ok-circle');
                    break;
                case 0 /* RUNNING */:
                    this.e.find('p').first().show();
                    this._icon.e.find('.glyphicon').addClass('glyphicon-refresh');
                    break;
            }
        };
        Progress.prototype.layout = function () {
            //Center progress well horizontally
            if (!this.e.hasClass('fixed')) {
                this.e.addClass('fixed').show();
                var left = $(window).width() / 2 - this.e.width() / 2;
                this.e.css('left', left + 'px').hide();
            }
        };
        Progress.prototype.update = function () {
            var _this = this;
            var promise = pinkySwear(), trackProgress, doUpdateProgress = function () {
                _this.getProgress().then(function (progress) {
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
                trackProgress = Runaway.interval(function () {
                    doUpdateProgress();
                }, 2000);
                doUpdateProgress();
                this._runButton.hide();
                this._runningLabel.show();
            }
            else if (app.isRunawayCheckRunning) {
                this._runButton.hide();
                this._runningLabel.show();
                Runaway.delay(250).then(function () {
                    _this.show(true, $.fx.speeds.fast);
                });
                promise(true, []);
            }
            else {
                this._runButton.show();
                this._runningLabel.hide();
                this.hide(true, 300);
                promise(true, []);
            }
            return promise;
        };
        Progress.prototype.reset = function () {
            this._progress = 0.0;
            this._hostCount = 0;
            this._currentHostIndex = 0;
            this._currentHostName = '';
            this._runningLabel.progress = this._progress;
            this._progressBar.e.css('width', '0%');
        };
        Progress.prototype.updateProgress = function (progress) {
            this._progress = progress;
            this._runningLabel.progress = progress;
            this._progressBar.e.css('width', '' + (progress * 100).toFixed(0) + '%');
        };
        Progress.prototype.getProgress = function () {
            var _this = this;
            var promise = pinkySwear();
            $.ajax({
                url: 'progress.txt',
                success: function (response) {
                    response = response.split('\n')[0].split(' ');
                    if (response[1] === "done") {
                        _this.hostCount = parseInt(response[0]);
                        _this.currentHostIndex = _this.hostCount;
                        promise(true, [1.0]);
                    }
                    else {
                        _this.currentHostName = response[1];
                        response = response[0].split('/');
                        _this._hostCount = parseInt(response[1]);
                        _this.currentHostIndex = parseInt(response[0]);
                        promise(true, [_this.progress]);
                    }
                },
                error: function () {
                    promise(false, [0.0]);
                },
                dataType: 'text'
            });
            return promise;
        };
        return Progress;
    })(Runaway.Component);
    Runaway.Progress = Progress;
    (function (ProgressStatus) {
        ProgressStatus[ProgressStatus["RUNNING"] = 0] = "RUNNING";
        ProgressStatus[ProgressStatus["SUCCESS"] = 1] = "SUCCESS";
        ProgressStatus[ProgressStatus["ERROR"] = 2] = "ERROR";
    })(Runaway.ProgressStatus || (Runaway.ProgressStatus = {}));
    var ProgressStatus = Runaway.ProgressStatus;
})(Runaway || (Runaway = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Runaway;
(function (Runaway) {
    var Results = (function (_super) {
        __extends(Results, _super);
        function Results() {
            _super.call(this, '#results');
            this._noResults = new Runaway.Component('#noResults');
            this._runTime = new Runaway.Component('#runTime');
            this._runDate = '';
            this._isDirty = false;
            this.hide(false);
        }
        Object.defineProperty(Results.prototype, "lastRunDate", {
            get: function () {
                return this._runDate;
            },
            set: function (value) {
                this._runDate = value;
                this._runTime.e.text(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Results.prototype, "isDirty", {
            get: function () {
                return this._isDirty;
            },
            set: function (value) {
                this._isDirty = value;
                if (value) {
                    this.e.addClass('dirty');
                    this._noResults.hide(true, $.fx.speeds.fast);
                }
                else {
                    this.e.removeClass('dirty');
                    if (app.progress.hostCount === 0) {
                        this._noResults.show(true, $.fx.speeds.fast);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Results.prototype.update = function () {
            var _this = this;
            var promise = pinkySwear();
            this.isDirty = true;
            this.getResults().then(function (results) {
                _this.parse(results);
                _this.isDirty = false;
                Runaway.delay(225).then(function () {
                    _this.show(true);
                    promise(true, []);
                });
            });
            return promise;
        };
        Results.prototype.getResults = function () {
            var promise = pinkySwear();
            $.get('results.txt', function (response) {
                promise(true, [response]);
            }, 'text/plain');
            return promise;
        };
        Results.prototype.parse = function (results) {
            var hosts = results.split('\n\n'), date = hosts.shift();
            if (this._runTime.e.text() === 'never') {
                this._runTime.e.text(date);
            }
            //Clear results
            this.e.empty();
            for (var h = 0; h < hosts.length; h++) {
                var lines = hosts[h].split('\n'), meta = lines.shift().split(' ');
                var host = $('<div>').addClass('host well');
                var header = $('<h3>').text(meta[0] + ' ').append($('<small>').text(meta[1]));
                var processes = $('<div>').addClass('processes table-responsive');
                if (lines.length > 1) {
                    //Make table
                    var table = $('<table>').addClass('table table-striped'), thead = $('<thead>'), tbody = $('<tbody>');
                    thead.append($('<tr>').append('<td>PID</td>').append('<td>Command</td>').append('<td>User</td>').append('<td>CPU Usage</td>').append('<td>RAM Usage</td>').append('<td>CPU Time</td>'));
                    //Whether or not to show a warning
                    var warning = false, warningRed = false;
                    for (var i = 0; i < lines.length; i++) {
                        var row = $('<tr>');
                        var cols = lines[i].split(' ');
                        var colCount = 0;
                        for (var v = 0; v < cols.length; v++) {
                            if (cols[v].length > 0) {
                                colCount++;
                                var col = $('<td>');
                                var content = cols[v];
                                var contentVal;
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
                                    }
                                    else {
                                        content = '' + contentVal.toFixed(1) + '%';
                                    }
                                }
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
                        var glyph = $('<span>');
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
            var numDangers = this.e.find('.glyphicon-exclamation-sign').size();
            var numWarnings = this.e.find('.glyphicon-warning-sign').size();
            if (numWarnings > 0) {
                var warningAlert = $('<div class="alert alert-warning">');
                var content = "<strong>Heads up!</strong> There";
                content += (numWarnings === 1 ? "'s something fishy" : " are " + numWarnings + " (or more) resource hogs") + " out there.";
                warningAlert.html(content);
                this.e.prepend(warningAlert);
            }
            if (numDangers > 0) {
                var dangerAlert = $('<div>').addClass('alert alert-danger');
                var content = "<strong>Oh snap!</strong> There ";
                content += (numDangers === 1 ? "is one danger " : "are " + numDangers + " dangers ") + " lurking.";
                dangerAlert.html(content);
                this.e.prepend(dangerAlert);
            }
            //Give the user's names
            this.e.find('tbody > tr > td:nth-child(3)').mouseenter(function () {
                var elem = $(this);
                if (!elem.attr('title') && !elem.attr('data-unknown')) {
                    $.get('finger.script?user=' + elem.text(), function (response) {
                        response = (response ? response : false);
                        var matchingUsernames = $('td:nth-child(3)').filter(function () {
                            return $(this).text() === elem.text();
                        });
                        if (response) {
                            matchingUsernames.attr('title', response);
                        }
                        else {
                            var blip = $('<span>');
                            blip.addClass('glyphicon glyphicon-question-sign pull-right');
                            blip.attr('title', 'Unknown user, probably specific to an application');
                            matchingUsernames.attr('data-unknown', 'true').append(blip);
                        }
                    }, 'text/plain');
                }
            });
        };
        return Results;
    })(Runaway.Component);
    Runaway.Results = Results;
})(Runaway || (Runaway = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Runaway;
(function (Runaway) {
    var RunButton = (function (_super) {
        __extends(RunButton, _super);
        function RunButton() {
            _super.call(this, '#run');
            this._disabled = false;
            this.e.click(function () {
                app.run();
            });
        }
        Object.defineProperty(RunButton.prototype, "disabled", {
            get: function () {
                return this._disabled;
            },
            set: function (value) {
                this._disabled = value;
                if (value) {
                    this.e.attr('disabled', '');
                }
                else {
                    this.e.removeAttr('disabled');
                }
            },
            enumerable: true,
            configurable: true
        });
        return RunButton;
    })(Runaway.Component);
    Runaway.RunButton = RunButton;
})(Runaway || (Runaway = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Runaway;
(function (Runaway) {
    var RunningLabel = (function (_super) {
        __extends(RunningLabel, _super);
        function RunningLabel() {
            _super.call(this, '#running');
            this._percentElem = new Runaway.Component('#runningPercent');
            this._percentElem.hide();
            this._progress = 0.0;
            this.hide();
        }
        Object.defineProperty(RunningLabel.prototype, "progress", {
            get: function () {
                return this._progress;
            },
            set: function (value) {
                this._progress = value;
                if (value === 0.0) {
                    this._percentElem.hide();
                }
                else {
                    if (!app.initByUser) {
                        this._percentElem.show();
                        console.log(value);
                        this._percentElem.e.text('(' + (value * 100).toFixed(0) + '%)');
                    }
                    else {
                        this._percentElem.hide();
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        return RunningLabel;
    })(Runaway.Component);
    Runaway.RunningLabel = RunningLabel;
})(Runaway || (Runaway = {}));

var Runaway;
(function (Runaway) {
    var Services;
    (function (Services) {
        var Progress = (function () {
            function Progress() {
                this.events = new Runaway.Bridge();
                this._progress = 0.0;
                this._hostCount = 0;
                this._currentHostIndex = 0;
                this._currentHostName = "";
            }
            Object.defineProperty(Progress.prototype, "progress", {
                get: function () {
                    return this._progress;
                },
                set: function (value) {
                    this._progress = value;
                    this.events.trigger("propertyChanged", { property: "progress" });
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Progress.prototype, "hostCount", {
                get: function () {
                    return this._hostCount;
                },
                set: function (value) {
                    this._hostCount = value;
                    this.events.trigger("propertyChanged", { property: "hostCount" });
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Progress.prototype, "currentHostIndex", {
                get: function () {
                    return this._currentHostIndex;
                },
                set: function (value) {
                    this._currentHostIndex = value;
                    this.events.trigger("propertyChanged", { property: "currentHostIndex" });
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Progress.prototype, "currentHostName", {
                get: function () {
                    return this._currentHostName;
                },
                set: function (value) {
                    this._currentHostName = value;
                    this.events.trigger("propertyChanged", { property: "currentHostName" });
                },
                enumerable: true,
                configurable: true
            });
            Progress.prototype.addEventListener = function (event, callback) {
                this.events.on(event, callback);
            };
            Progress.prototype.reset = function () {
                this._progress = 0.0;
                this._hostCount = 0;
                this._currentHostIndex = 0;
                this._currentHostName = '';
                this.events.trigger("propertyChanged", { property: "progress" });
                this.events.trigger("propertyChanged", { property: "hostCount" });
                this.events.trigger("propertyChanged", { property: "currentHostIndex" });
                this.events.trigger("propertyChanged", { property: "currentHostName" });
            };
            Progress.prototype.update = function () {
                var _this = this;
                var promise = pinkySwear(), trackProgress, doUpdateProgress = function () {
                    _this.getProgress().then(function (progress) {
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
                    trackProgress = Runaway.interval(function () {
                        doUpdateProgress();
                    }, 2000);
                    doUpdateProgress();
                }
                return promise;
            };
            Progress.prototype.getProgress = function () {
                var _this = this;
                var promise = pinkySwear();
                $.ajax({
                    url: 'progress.txt',
                    success: function (response) {
                        response = response.split('\n')[0].split(' ');
                        if (response[1] === "done") {
                            _this.hostCount = parseInt(response[0]);
                            _this.currentHostIndex = _this.hostCount;
                            promise(true, [1.0]);
                        }
                        else {
                            _this.currentHostName = response[1];
                            response = response[0].split('/');
                            _this._hostCount = parseInt(response[1]);
                            _this.currentHostIndex = parseInt(response[0]);
                            promise(true, [_this.progress]);
                        }
                    },
                    error: function () {
                        promise(false, [0.0]);
                    },
                    dataType: 'text'
                });
                return promise;
            };
            return Progress;
        })();
        Services.Progress = Progress;
    })(Services = Runaway.Services || (Runaway.Services = {}));
})(Runaway || (Runaway = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9CcmlkZ2UudHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvSGVscGVycy50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9SdW5hd2F5LnRzIiwiL1VzZXJzL2NoYW5jZXNub3cvRG9jdW1lbnRzL0dpdEh1Yi9ydW5hd2F5LWdoL1RpdGxlLnRzIiwiL1VzZXJzL2NoYW5jZXNub3cvRG9jdW1lbnRzL0dpdEh1Yi9ydW5hd2F5LWdoL21haW4udHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvY29tcG9uZW50cy9Db21wb25lbnQudHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvY29tcG9uZW50cy9Qcm9ncmVzcy50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9jb21wb25lbnRzL1Jlc3VsdHMudHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvY29tcG9uZW50cy9SdW5CdXR0b24udHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvY29tcG9uZW50cy9SdW5uaW5nTGFiZWwudHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvc2VydmljZXMvUHJvZ3Jlc3MudHMiXSwibmFtZXMiOlsiUnVuYXdheSIsIlJ1bmF3YXkuQnJpZGdlIiwiUnVuYXdheS5CcmlkZ2UuY29uc3RydWN0b3IiLCJSdW5hd2F5LkJyaWRnZS5vbiIsIlJ1bmF3YXkuQnJpZGdlLm9mZiIsIlJ1bmF3YXkuQnJpZGdlLnRyaWdnZXIiLCJSdW5hd2F5LkhlbHBlcnMiLCJSdW5hd2F5LkhlbHBlcnMucmFuZG9tTnVtYmVyIiwiUnVuYXdheS5IZWxwZXJzLm9iamVjdElzQSIsIlJ1bmF3YXkuQXBwbGljYXRpb24iLCJSdW5hd2F5LkFwcGxpY2F0aW9uLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5BcHBsaWNhdGlvbi5wcm9ncmVzcyIsIlJ1bmF3YXkuQXBwbGljYXRpb24ucmVzdWx0cyIsIlJ1bmF3YXkuQXBwbGljYXRpb24uaXNSdW5hd2F5Q2hlY2tSdW5uaW5nIiwiUnVuYXdheS5BcHBsaWNhdGlvbi5pbml0QnlVc2VyIiwiUnVuYXdheS5BcHBsaWNhdGlvbi5ydW4iLCJSdW5hd2F5LkFwcGxpY2F0aW9uLmNoZWNrQ29tcGxldGVkIiwiUnVuYXdheS5BcHBsaWNhdGlvbi5nZXRSdW5TdGF0dXMiLCJSdW5hd2F5LlJ1blN0YXR1cyIsIlJ1bmF3YXkuZGVsYXkiLCJSdW5hd2F5LmludGVydmFsIiwiUnVuYXdheS5UaXRsZSIsIlJ1bmF3YXkuVGl0bGUuY29uc3RydWN0b3IiLCJSdW5hd2F5LlRpdGxlLmNoYW5nZSIsIlJ1bmF3YXkuQ29tcG9uZW50IiwiUnVuYXdheS5Db21wb25lbnQuY29uc3RydWN0b3IiLCJSdW5hd2F5LkNvbXBvbmVudC5lIiwiUnVuYXdheS5Db21wb25lbnQuc2hvdyIsIlJ1bmF3YXkuQ29tcG9uZW50LmhpZGUiLCJSdW5hd2F5LlByb2dyZXNzIiwiUnVuYXdheS5Qcm9ncmVzcy5jb25zdHJ1Y3RvciIsIlJ1bmF3YXkuUHJvZ3Jlc3MucHJvZ3Jlc3MiLCJSdW5hd2F5LlByb2dyZXNzLmhvc3RDb3VudCIsIlJ1bmF3YXkuUHJvZ3Jlc3MuY3VycmVudEhvc3RJbmRleCIsIlJ1bmF3YXkuUHJvZ3Jlc3MuY3VycmVudEhvc3ROYW1lIiwiUnVuYXdheS5Qcm9ncmVzcy5lcnJvclRleHQiLCJSdW5hd2F5LlByb2dyZXNzLnNldFN0YXR1cyIsIlJ1bmF3YXkuUHJvZ3Jlc3MubGF5b3V0IiwiUnVuYXdheS5Qcm9ncmVzcy51cGRhdGUiLCJSdW5hd2F5LlByb2dyZXNzLnJlc2V0IiwiUnVuYXdheS5Qcm9ncmVzcy51cGRhdGVQcm9ncmVzcyIsIlJ1bmF3YXkuUHJvZ3Jlc3MuZ2V0UHJvZ3Jlc3MiLCJSdW5hd2F5LlByb2dyZXNzU3RhdHVzIiwiUnVuYXdheS5SZXN1bHRzIiwiUnVuYXdheS5SZXN1bHRzLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5SZXN1bHRzLmxhc3RSdW5EYXRlIiwiUnVuYXdheS5SZXN1bHRzLmlzRGlydHkiLCJSdW5hd2F5LlJlc3VsdHMudXBkYXRlIiwiUnVuYXdheS5SZXN1bHRzLmdldFJlc3VsdHMiLCJSdW5hd2F5LlJlc3VsdHMucGFyc2UiLCJSdW5hd2F5LlJ1bkJ1dHRvbiIsIlJ1bmF3YXkuUnVuQnV0dG9uLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5SdW5CdXR0b24uZGlzYWJsZWQiLCJSdW5hd2F5LlJ1bm5pbmdMYWJlbCIsIlJ1bmF3YXkuUnVubmluZ0xhYmVsLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5SdW5uaW5nTGFiZWwucHJvZ3Jlc3MiLCJSdW5hd2F5LlNlcnZpY2VzIiwiUnVuYXdheS5TZXJ2aWNlcy5Qcm9ncmVzcyIsIlJ1bmF3YXkuU2VydmljZXMuUHJvZ3Jlc3MuY29uc3RydWN0b3IiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLnByb2dyZXNzIiwiUnVuYXdheS5TZXJ2aWNlcy5Qcm9ncmVzcy5ob3N0Q291bnQiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLmN1cnJlbnRIb3N0SW5kZXgiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLmN1cnJlbnRIb3N0TmFtZSIsIlJ1bmF3YXkuU2VydmljZXMuUHJvZ3Jlc3MuYWRkRXZlbnRMaXN0ZW5lciIsIlJ1bmF3YXkuU2VydmljZXMuUHJvZ3Jlc3MucmVzZXQiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLnVwZGF0ZSIsIlJ1bmF3YXkuU2VydmljZXMuUHJvZ3Jlc3MuZ2V0UHJvZ3Jlc3MiXSwibWFwcGluZ3MiOiJBQUFBLElBQU8sT0FBTyxDQXlFYjtBQXpFRCxXQUFPLE9BQU8s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R0EsSUFBSUEsZUFBT0EsRUFBRUEsQ0FBQ0E7Z0JBRTlCQSxLQUFJQSxDQUFDQSxZQUFZQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFDQSxNQUFpQkE7b0JBQ3ZDQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxLQUFLQSxlQUFpQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQy9CQSxLQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQTt3QkFDckJBLEtBQUlBLENBQUNBLFdBQVdBLEdBQUdBLEtBQUtBLENBQUNBO3dCQUN6QkEsS0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ3ZCQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQTs0QkFDekJBLEtBQUlBLENBQUNBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBOzRCQUN0QkEsS0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7NEJBQ3hCQSxLQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTs0QkFDekJBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLENBQUNBO2dDQUNaQSxLQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTs0QkFDM0JBLENBQUNBLENBQUNBLENBQUNBO3dCQUNQQSxDQUFDQSxFQUFFQTs0QkFDQ0EsS0FBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0E7NEJBQ3RCQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTs0QkFDeEJBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBOzRCQUN6QkEsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0NBQ1pBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLEVBQUVB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QUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDckNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQy9CQSxDQUFDQTtZQUVEQSxBQUNBQSxlQURlQTtZQUNmQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtZQUVmQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFDcENBLElBQUlBLEtBQUtBLEdBQWFBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLEVBQ3RDQSxJQUFJQSxHQUFhQSxLQUFLQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFFOUNBLElBQUlBLElBQUlBLEdBQW9CQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtnQkFDN0RBLElBQUlBLE1BQU1BLEdBQW9CQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDL0ZBLElBQUlBLFNBQVNBLEdBQW9CQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSw0QkFBNEJBLENBQUNBLENBQUNBO2dCQUNuRkEs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InJ1bmF3YXkudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUgUnVuYXdheSB7XG4gICAgZXhwb3J0IGNsYXNzIEJyaWRnZSB7XG5cbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVyczogQnJpZGdlSGFuZGxlcltdO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgYW5kIHN1YnNjcmliZSB0byBhbiBldmVudFxuICAgICAgICAgKiBAcGFyYW0gZXZlbnQgVHlwZSBvZiBicmlkZ2UgZXZlbnQgdG8gaGFuZGxlXG4gICAgICAgICAqIEBwYXJhbSBjYWxsYmFjayBIYW5kbGluZyBjYWxsYmFjayBkZWxlZ2F0ZVxuICAgICAgICAgKiBAcmV0dXJuIFVuaXF1ZSBpZCByZXByZXNlbnRpbmcgdGhpcyBldmVudFxuICAgICAgICAgKi9cbiAgICAgICAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IEJyaWRnZUNhbGxiYWNrKTogbnVtYmVyIHtcbiAgICAgICAgICAgIE1hdGgucmFuZG9tKCk7XG4gICAgICAgICAgICB2YXIgaGFuZGxlcjogQnJpZGdlSGFuZGxlciA9IHtcbiAgICAgICAgICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgICAgICAgICAgaWQ6IFJ1bmF3YXkuSGVscGVycy5yYW5kb21OdW1iZXIoMCwgRGF0ZS5ub3coKSksXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuaWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZCByZXByZXNlbnRpbmcgdGhlIGV2ZW50IHRvIHJlbW92ZVxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGlkOiBudW1iZXIpOiBCcmlkZ2Uge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gLTE7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYW5kbGVyc1tpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcGF0Y2ggYW4gZXZlbnRcbiAgICAgICAgICogQHBhcmFtIGV2ZW50IFR5cGUgb2YgYnJpZGdlIGV2ZW50IHRvIGRpc3BhdGNoXG4gICAgICAgICAqIEBwYXJhbSBkYXRhIERhdGEgdG8gcGFzcyBhbG9uZyB0byBldmVudCBoYW5kbGVyc1xuICAgICAgICAgKiBAcGFyYW0gY29udGV4dD13aW5kb3cgQ29udGV4dCBpbiB3aGljaCB0byBleGVjdXRlIGhhbmRsaW5nIGNhbGxiYWNrIGRlbGVnYXRlc1xuICAgICAgICAgKi9cbiAgICAgICAgdHJpZ2dlcihldmVudDogc3RyaW5nLCBkYXRhOiBhbnkgPSBudWxsLCBjb250ZXh0ID0gd2luZG93KTogQnJpZGdlIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlcjogQnJpZGdlSGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyLmV2ZW50ID09PSBldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jYWxsYmFjay5jYWxsKGNvbnRleHQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5jYWxsYmFjay5jYWxsKGNvbnRleHQsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlY2xhcmUgY2xhc3MgQnJpZGdlSGFuZGxlciB7XG4gICAgICAgIGV2ZW50OiBzdHJpbmc7XG4gICAgICAgIGlkOiBudW1iZXI7XG4gICAgICAgIGNhbGxiYWNrOiBCcmlkZ2VDYWxsYmFjaztcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIEJyaWRnZUNhbGxiYWNrIHtcbiAgICAgICAgKGRhdGE6IGFueSk6IHZvaWQ7XG4gICAgfVxufVxuIiwibW9kdWxlIFJ1bmF3YXkuSGVscGVycyB7XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gcmFuZG9tTnVtYmVyKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIG9iamVjdElzQShvYmplY3Q6IGFueSwgdHlwZTogYW55KSB7XG4gICAgICAgIGlmICh0eXBlLmhhc093blByb3BlcnR5KFwicHJvdG90eXBlXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUgPT09IHR5cGUucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJtb2R1bGUgUnVuYXdheSB7XG5cbiAgICBleHBvcnQgY2xhc3MgQXBwbGljYXRpb24ge1xuICAgICAgICBwcml2YXRlIF9wcm9ncmVzczogUHJvZ3Jlc3M7XG4gICAgICAgIHByaXZhdGUgX3Jlc3VsdHM6IFJlc3VsdHM7XG5cbiAgICAgICAgcHJpdmF0ZSBfcnVubmluZzogYm9vbGVhbjtcbiAgICAgICAgcHJpdmF0ZSBfaW5pdEJ5VXNlcjogYm9vbGVhbjtcblxuICAgICAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgICAgICAkKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IG5ldyBQcm9ncmVzcygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMgPSBuZXcgUmVzdWx0cygpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRSdW5TdGF0dXMoKS50aGVuKChzdGF0dXM6IFJ1blN0YXR1cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSBSdW5TdGF0dXMuUlVOTklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0QnlVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MudXBkYXRlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaGlkZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxheSgyNTApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLmhpZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsYXkoMjUwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0dXMgPT09IFJ1blN0YXR1cy5OT19IT1NUUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBTaG93IG5vIGhvc3RzIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5zZXRTdGF0dXMoUHJvZ3Jlc3NTdGF0dXMuRVJST1IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2luaXRCeVVzZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBnZXQgcHJvZ3Jlc3MoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJvZ3Jlc3M7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IHJlc3VsdHMoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0cztcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBnZXQgaXNSdW5hd2F5Q2hlY2tSdW5uaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3J1bm5pbmc7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGluaXRCeVVzZXIoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5pdEJ5VXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBydW4oKSB7XG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2luaXRCeVVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaXNEaXJ0eSA9IHRydWU7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0UnVuU3RhdHVzKCkudGhlbigoc3RhdHVzOiBSdW5TdGF0dXMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSBSdW5TdGF0dXMuUlVOTklORykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5lcnJvclRleHQgPSAnUnVuYXdheSEgaXMgY3VycmVudGx5IHBlcmZvcm1pbmcgYSBydW5hd2F5IGNoZWNrLic7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnNldFN0YXR1cyhQcm9ncmVzc1N0YXR1cy5FUlJPUik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnVwZGF0ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdEJ5VXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MudXBkYXRlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnNldFN0YXR1cyhQcm9ncmVzc1N0YXR1cy5TVUNDRVNTKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLmhpZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsYXkoMjUwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cyA9PT0gUnVuU3RhdHVzLk5PX0hPU1RTKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLmVycm9yVGV4dCA9ICdUaGVyZSBhcmUgbm8gaG9zdHMgdG8gY2hlY2suJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3Muc2V0U3RhdHVzKFByb2dyZXNzU3RhdHVzLkVSUk9SKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgVGl0bGUuY2hhbmdlKCdSdW5uaW5nLi4uJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3Muc2V0U3RhdHVzKFByb2dyZXNzU3RhdHVzLlJVTk5JTkcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICAvL0RvIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgLy9Db21wbGV0ZWQgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDb21wbGV0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5vbnByb2dyZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9QYXJzZSBwcm9ncmVzc1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGluZXMgPSByZXNwb25zZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1JlbW92ZSBqdW5rIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9VcGRhdGUgbWV0YWRhdGEgaWYgbmVlZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3Byb2dyZXNzLmhvc3RDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZXRhID0gbGluZXNbMF0uc3BsaXQoJ3wnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5ob3N0Q291bnQgPSBwYXJzZUludChtZXRhWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLmxhc3RSdW5EYXRlID0gbWV0YVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vVXBkYXRlIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLmN1cnJlbnRIb3N0TmFtZSA9IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLmN1cnJlbnRIb3N0SW5kZXggKz0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5vcGVuKFwiZ2V0XCIsIFwicnVuYXdheS5zY3JpcHRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgICAgICAgICAgICAgICAgICAvL2RlbGF5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vfSwgMjAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBjaGVja0NvbXBsZXRlZCgpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnNldFN0YXR1cyhQcm9ncmVzc1N0YXR1cy5TVUNDRVNTKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLmN1cnJlbnRIb3N0SW5kZXggPSB0aGlzLl9wcm9ncmVzcy5ob3N0Q291bnQ7XG4gICAgICAgICAgICBkZWxheSg3MDApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaGlkZSh0cnVlLCAzMDApO1xuICAgICAgICAgICAgICAgIGRlbGF5KDUwMCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLmxheW91dCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLnVwZGF0ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5sYXlvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFRpdGxlLmNoYW5nZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldFJ1blN0YXR1cygpOiBQaW5reVN3ZWFyLkdlbmVyaWNQcm9taXNlPFJ1blN0YXR1cz4ge1xuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBwaW5reVN3ZWFyPFJ1blN0YXR1cz4oKTtcblxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6ICdydW4uc2NyaXB0JyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHJlc3BvbnNlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSByZXNwb25zZVswXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlID09PSBcImVycm9yOiBydW5uaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW1J1blN0YXR1cy5SVU5OSU5HXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UgPT09IFwiZXJyb3I6IG5vIGhvc3RzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW1J1blN0YXR1cy5OT19IT1NUU10pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbUnVuU3RhdHVzLk5PVF9SVU5OSU5HXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAndGV4dCd9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnQgZW51bSBSdW5TdGF0dXMge1xuICAgICAgICBOT1RfUlVOTklORyxcbiAgICAgICAgUlVOTklORyxcbiAgICAgICAgTk9fSE9TVFNcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gZGVsYXkodGltZTogbnVtYmVyKTogUGlua3lTd2Vhci5Qcm9taXNlIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwaW5reVN3ZWFyKCk7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb21pc2UodHJ1ZSk7XG4gICAgICAgIH0sIHRpbWUpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIEludGVydmFsIHtcbiAgICAgICAgaW50ZXJ2YWxJZDogbnVtYmVyO1xuICAgICAgICBjbGVhcjogKCkgPT4gdm9pZDtcbiAgICB9XG5cbiAgICAvL0ludGVydmFsIHV0aWxpdHkgZnVuY3Rpb25cbiAgICBleHBvcnQgZnVuY3Rpb24gaW50ZXJ2YWwoZnVuYzogKCkgPT4gdm9pZCwgdGltZTogbnVtYmVyKTogSW50ZXJ2YWwge1xuICAgICAgICB2YXIgaW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuYywgdGltZSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbnRlcnZhbElkOiBpbnRlcnZhbCxcbiAgICAgICAgICAgIGNsZWFyOiBmdW5jdGlvbiAoKSB7IHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsKTsgfVxuICAgICAgICB9O1xuICAgIH1cbn0iLCJtb2R1bGUgUnVuYXdheSB7XG5cbiAgICBleHBvcnQgY2xhc3MgVGl0bGUge1xuXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgb2xkVGl0bGU6IHN0cmluZyA9ICQoJ3RpdGxlJykudGV4dCgpO1xuXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgY2hhbmdlKG5ld1RpdGxlPzogc3RyaW5nKSB7XG4gICAgICAgICAgICBuZXdUaXRsZSA9IChuZXdUaXRsZSA9PT0gdW5kZWZpbmVkID8gVGl0bGUub2xkVGl0bGUgOiBuZXdUaXRsZSk7XG4gICAgICAgICAgICAkKCd0aXRsZScpLnRleHQobmV3VGl0bGUpO1xuICAgICAgICB9XG4gICAgfVxufSIsIlxudmFyIHNlcnZpY2VzID0ge1xuICAgIHByb2dyZXNzOiBuZXcgUnVuYXdheS5TZXJ2aWNlcy5Qcm9ncmVzcygpXG59O1xuXG52YXIgYXBwID0gbmV3IFJ1bmF3YXkuQXBwbGljYXRpb24oKTsiLCJtb2R1bGUgUnVuYXdheSB7XG5cbiAgICBleHBvcnQgY2xhc3MgQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBfZWxlbWVudDogWmVwdG9GeENvbGxlY3Rpb247XG5cbiAgICAgICAgcHVibGljIGdldCBlKCk6IFplcHRvRnhDb2xsZWN0aW9uIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3RydWN0b3IgKGVsZW1lbnRTZWxlY3Rvcjogc3RyaW5nKTtcbiAgICAgICAgY29uc3RydWN0b3IgKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTtcbiAgICAgICAgY29uc3RydWN0b3IgKGVsZW1lbnQ6IGFueSkge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IDxaZXB0b0Z4Q29sbGVjdGlvbj4kKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHNob3coZmFkZTogYm9vbGVhbiA9IGZhbHNlLCBkdXJhdGlvbjogbnVtYmVyID0gJC5meC5zcGVlZHMuX2RlZmF1bHQpIHtcbiAgICAgICAgICAgIGlmIChmYWRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lLmZhZGVJbihkdXJhdGlvbik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZS5zaG93KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgaGlkZShmYWRlOiBib29sZWFuID0gZmFsc2UsIGR1cmF0aW9uOiBudW1iZXIgPSAkLmZ4LnNwZWVkcy5fZGVmYXVsdCkge1xuICAgICAgICAgICAgaWYgKGZhZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUuZmFkZU91dChkdXJhdGlvbik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZS5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59IiwibW9kdWxlIFJ1bmF3YXkge1xuXG4gICAgZXhwb3J0IGNsYXNzIFByb2dyZXNzIGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBfcnVuQnV0dG9uOiBSdW5CdXR0b247XG4gICAgICAgIHByaXZhdGUgX3J1bm5pbmdMYWJlbDogUnVubmluZ0xhYmVsO1xuICAgICAgICBwcml2YXRlIF9ob3N0Q291bnRFbGVtOiBDb21wb25lbnQ7XG4gICAgICAgIHByaXZhdGUgX2hvc3RJbmRleDogQ29tcG9uZW50O1xuICAgICAgICBwcml2YXRlIF9ob3N0TmFtZTogQ29tcG9uZW50O1xuICAgICAgICBwcml2YXRlIF9wcm9ncmVzc0JhcjogQ29tcG9uZW50O1xuICAgICAgICBwcml2YXRlIF9pY29uOiBDb21wb25lbnQ7XG5cbiAgICAgICAgcHJpdmF0ZSBfcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAgICAgcHJpdmF0ZSBfaG9zdENvdW50OiBudW1iZXI7XG4gICAgICAgIHByaXZhdGUgX2N1cnJlbnRIb3N0SW5kZXg6IG51bWJlcjtcbiAgICAgICAgcHJpdmF0ZSBfY3VycmVudEhvc3ROYW1lOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgICAgc3VwZXIoJyNwcm9ncmVzcycpO1xuXG4gICAgICAgICAgICB0aGlzLl9ydW5CdXR0b24gPSBuZXcgUnVuQnV0dG9uKCk7XG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nTGFiZWwgPSBuZXcgUnVubmluZ0xhYmVsKCk7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnRFbGVtID0gbmV3IENvbXBvbmVudCgnI2hvc3RDb3VudCcpO1xuICAgICAgICAgICAgdGhpcy5faG9zdEluZGV4ID0gbmV3IENvbXBvbmVudCgnI2N1ckhvc3RJbmRleCcpO1xuICAgICAgICAgICAgdGhpcy5faG9zdE5hbWUgPSBuZXcgQ29tcG9uZW50KCcjaG9zdE5hbWUnKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzQmFyID0gbmV3IENvbXBvbmVudCgnI3Byb2dyZXNzQmFyJyk7XG4gICAgICAgICAgICB0aGlzLl9pY29uID0gbmV3IENvbXBvbmVudCgnI2ljb24nKTtcblxuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSAnJztcblxuICAgICAgICAgICAgdGhpcy5oaWRlKGZhbHNlKTtcblxuICAgICAgICAgICAgdGhpcy5sYXlvdXQoKTtcbiAgICAgICAgICAgIHRoaXMuZS5hZGRDbGFzcygnZml4ZWQnKTtcblxuICAgICAgICAgICAgdGhpcy5lLmNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGUodHJ1ZSwgJC5meC5zcGVlZHMuZmFzdCk7XG4gICAgICAgICAgICAgICAgYXBwLnJlc3VsdHMuaXNEaXJ0eSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IHByb2dyZXNzKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJvZ3Jlc3M7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGhvc3RDb3VudCgpOiBudW1iZXIge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hvc3RDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBwdWJsaWMgc2V0IGhvc3RDb3VudCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX2hvc3RDb3VudEVsZW0uZS50ZXh0KHZhbHVlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgaWYgKHZhbHVlID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvZ3Jlc3ModGhpcy5fY3VycmVudEhvc3RJbmRleCAvIHRoaXMuX2hvc3RDb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGN1cnJlbnRIb3N0SW5kZXgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50SG9zdEluZGV4O1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgY3VycmVudEhvc3RJbmRleCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdEluZGV4ID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9ob3N0SW5kZXguZS50ZXh0KHZhbHVlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaG9zdENvdW50ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvZ3Jlc3ModGhpcy5fY3VycmVudEhvc3RJbmRleCAvIHRoaXMuX2hvc3RDb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGN1cnJlbnRIb3N0TmFtZSgpOiBzdHJpbmcge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRIb3N0TmFtZTtcbiAgICAgICAgfVxuICAgICAgICBwdWJsaWMgc2V0IGN1cnJlbnRIb3N0TmFtZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX2hvc3ROYW1lLmUudGV4dCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc2V0IGVycm9yVGV4dCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmUuZmluZCgnLnRleHQtZGFuZ2VyJykudGV4dCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc2V0U3RhdHVzKHN0YXR1czogUHJvZ3Jlc3NTdGF0dXMpIHtcbiAgICAgICAgICAgIHRoaXMuZS5maW5kKCdwJykuaGlkZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5yZW1vdmVDbGFzcygncHJvZ3Jlc3MtYmFyLWRhbmdlciBwcm9ncmVzcy1iYXItc3VjY2VzcycpO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5wYXJlbnQoKS5zaG93KCk7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmUuZmluZCgnc3BhbicpLnJlbW92ZUNsYXNzKCdnbHlwaGljb24tcmVmcmVzaCBnbHlwaGljb24tb2stY2lyY2xlIGdseXBoaWNvbi1leGNsYW1hdGlvbi1zaWduJyk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBQcm9ncmVzc1N0YXR1cy5FUlJPUjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lLmZpbmQoJy50ZXh0LWRhbmdlcicpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5hZGRDbGFzcygncHJvZ3Jlc3MtYmFyLWRhbmdlcicpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzc0Jhci5lLnBhcmVudCgpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faWNvbi5lLmZpbmQoJy5nbHlwaGljb24nKS5hZGRDbGFzcygnZ2x5cGhpY29uLWV4Y2xhbWF0aW9uLXNpZ24nKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQcm9ncmVzc1N0YXR1cy5TVUNDRVNTOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmUuZmluZCgnLnRleHQtc3VjY2VzcycpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5hZGRDbGFzcygncHJvZ3Jlc3MtYmFyLXN1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5wYXJlbnQoKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ljb24uZS5maW5kKCcuZ2x5cGhpY29uJykuYWRkQ2xhc3MoJ2dseXBoaWNvbi1vay1jaXJjbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQcm9ncmVzc1N0YXR1cy5SVU5OSU5HOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmUuZmluZCgncCcpLmZpcnN0KCkuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pY29uLmUuZmluZCgnLmdseXBoaWNvbicpLmFkZENsYXNzKCdnbHlwaGljb24tcmVmcmVzaCcpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBsYXlvdXQoKSB7XG4gICAgICAgICAgICAvL0NlbnRlciBwcm9ncmVzcyB3ZWxsIGhvcml6b250YWxseVxuICAgICAgICAgICAgaWYgKCF0aGlzLmUuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUuYWRkQ2xhc3MoJ2ZpeGVkJykuc2hvdygpO1xuICAgICAgICAgICAgICAgIHZhciBsZWZ0ID0gJCh3aW5kb3cpLndpZHRoKCkgLyAyIC0gdGhpcy5lLndpZHRoKCkgLyAyO1xuICAgICAgICAgICAgICAgIHRoaXMuZS5jc3MoJ2xlZnQnLGxlZnQgKyAncHgnKS5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdXBkYXRlKCk6IFBpbmt5U3dlYXIuUHJvbWlzZSB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXIoKSxcbiAgICAgICAgICAgICAgICB0cmFja1Byb2dyZXNzOiBJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICBkb1VwZGF0ZVByb2dyZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFByb2dyZXNzKCkudGhlbigocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9ncmVzcyA9PT0gMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhY2tQcm9ncmVzcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFja1Byb2dyZXNzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlKGZhbHNlLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGFwcC5pc1J1bmF3YXlDaGVja1J1bm5pbmcgJiYgIWFwcC5pbml0QnlVc2VyKSB7XG4gICAgICAgICAgICAgICAgdHJhY2tQcm9ncmVzcyA9IGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9VcGRhdGVQcm9ncmVzcygpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIGRvVXBkYXRlUHJvZ3Jlc3MoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3J1bkJ1dHRvbi5oaWRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZ0xhYmVsLnNob3coKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXBwLmlzUnVuYXdheUNoZWNrUnVubmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bkJ1dHRvbi5oaWRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZ0xhYmVsLnNob3coKTtcbiAgICAgICAgICAgICAgICBkZWxheSgyNTApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3codHJ1ZSwgJC5meC5zcGVlZHMuZmFzdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bkJ1dHRvbi5zaG93KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZ0xhYmVsLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGUodHJ1ZSwgMzAwKTtcbiAgICAgICAgICAgICAgICBwcm9taXNlKHRydWUsIFtdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgcmVzZXQoKSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMuX2hvc3RDb3VudCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdEluZGV4ID0gMDtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRIb3N0TmFtZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5fcnVubmluZ0xhYmVsLnByb2dyZXNzID0gdGhpcy5fcHJvZ3Jlc3M7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzc0Jhci5lLmNzcygnd2lkdGgnLCcwJScpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVQcm9ncmVzcyhwcm9ncmVzczogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IHByb2dyZXNzO1xuICAgICAgICAgICAgdGhpcy5fcnVubmluZ0xhYmVsLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzc0Jhci5lLmNzcygnd2lkdGgnLCcnICsgKHByb2dyZXNzICogMTAwKS50b0ZpeGVkKDApICsgJyUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZ2V0UHJvZ3Jlc3MoKTogUGlua3lTd2Vhci5HZW5lcmljUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gcGlua3lTd2VhcjxudW1iZXI+KCk7XG5cbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdXJsOiAncHJvZ3Jlc3MudHh0JyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSByZXNwb25zZS5zcGxpdCgnXFxuJylbMF0uc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlWzFdID09PSBcImRvbmVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ob3N0Q291bnQgPSBwYXJzZUludChyZXNwb25zZVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3N0SW5kZXggPSB0aGlzLmhvc3RDb3VudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbMS4wXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3N0TmFtZSA9IHJlc3BvbnNlWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSByZXNwb25zZVswXS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faG9zdENvdW50ID0gcGFyc2VJbnQocmVzcG9uc2VbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9zdEluZGV4ID0gcGFyc2VJbnQocmVzcG9uc2VbMF0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlKHRydWUsIFt0aGlzLnByb2dyZXNzXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZShmYWxzZSwgWzAuMF0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICd0ZXh0J1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXhwb3J0IGVudW0gUHJvZ3Jlc3NTdGF0dXMge1xuICAgICAgICBSVU5OSU5HLFxuICAgICAgICBTVUNDRVNTLFxuICAgICAgICBFUlJPUlxuICAgIH1cbn0iLCJtb2R1bGUgUnVuYXdheSB7XG5cbiAgICBleHBvcnQgY2xhc3MgUmVzdWx0cyBleHRlbmRzIENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgX25vUmVzdWx0czogQ29tcG9uZW50O1xuICAgICAgICBwcml2YXRlIF9ydW5UaW1lOiBDb21wb25lbnQ7XG5cbiAgICAgICAgcHJpdmF0ZSBfcnVuRGF0ZTogc3RyaW5nO1xuICAgICAgICBwcml2YXRlIF9pc0RpcnR5OiBib29sZWFuO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICAgIHN1cGVyKCcjcmVzdWx0cycpO1xuXG4gICAgICAgICAgICB0aGlzLl9ub1Jlc3VsdHMgPSBuZXcgQ29tcG9uZW50KCcjbm9SZXN1bHRzJyk7XG4gICAgICAgICAgICB0aGlzLl9ydW5UaW1lID0gbmV3IENvbXBvbmVudCgnI3J1blRpbWUnKTtcblxuICAgICAgICAgICAgdGhpcy5fcnVuRGF0ZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5faXNEaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgICAgICB0aGlzLmhpZGUoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBsYXN0UnVuRGF0ZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ydW5EYXRlO1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgbGFzdFJ1bkRhdGUodmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5fcnVuRGF0ZSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fcnVuVGltZS5lLnRleHQodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBpc0RpcnR5KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzRGlydHk7XG4gICAgICAgIH1cbiAgICAgICAgcHVibGljIHNldCBpc0RpcnR5KHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUuYWRkQ2xhc3MoJ2RpcnR5Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9SZXN1bHRzLmhpZGUodHJ1ZSwgJC5meC5zcGVlZHMuZmFzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZS5yZW1vdmVDbGFzcygnZGlydHknKTtcbiAgICAgICAgICAgICAgICBpZiAoYXBwLnByb2dyZXNzLmhvc3RDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ub1Jlc3VsdHMuc2hvdyh0cnVlLCAkLmZ4LnNwZWVkcy5mYXN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdXBkYXRlKCk6IFBpbmt5U3dlYXIuUHJvbWlzZSB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXIoKTtcblxuICAgICAgICAgICAgdGhpcy5pc0RpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZ2V0UmVzdWx0cygpLnRoZW4oKHJlc3VsdHM6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyc2UocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0RpcnR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZGVsYXkoMjI1KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlKHRydWUsIFtdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZ2V0UmVzdWx0cygpOiBQaW5reVN3ZWFyLkdlbmVyaWNQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBwaW5reVN3ZWFyPHN0cmluZz4oKTtcblxuICAgICAgICAgICAgJC5nZXQoJ3Jlc3VsdHMudHh0JywgZnVuY3Rpb24ocmVzcG9uc2U6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW3Jlc3BvbnNlXSk7XG4gICAgICAgICAgICB9LCAndGV4dC9wbGFpbicpO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcGFyc2UocmVzdWx0czogc3RyaW5nKSB7XG4gICAgICAgICAgICB2YXIgaG9zdHM6IHN0cmluZ1tdID0gcmVzdWx0cy5zcGxpdCgnXFxuXFxuJyksXG4gICAgICAgICAgICAgICAgZGF0ZTogc3RyaW5nID0gaG9zdHMuc2hpZnQoKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3J1blRpbWUuZS50ZXh0KCkgPT09ICduZXZlcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5UaW1lLmUudGV4dChkYXRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9DbGVhciByZXN1bHRzXG4gICAgICAgICAgICB0aGlzLmUuZW1wdHkoKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaCA9IDA7IGggPCBob3N0cy5sZW5ndGg7IGgrKykge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lczogc3RyaW5nW10gPSBob3N0c1toXS5zcGxpdCgnXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1ldGE6IHN0cmluZ1tdID0gbGluZXMuc2hpZnQoKS5zcGxpdCgnICcpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGhvc3Q6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzxkaXY+JykuYWRkQ2xhc3MoJ2hvc3Qgd2VsbCcpO1xuICAgICAgICAgICAgICAgIHZhciBoZWFkZXI6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzxoMz4nKS50ZXh0KG1ldGFbMF0gKyAnICcpLmFwcGVuZCgkKCc8c21hbGw+JykudGV4dChtZXRhWzFdKSk7XG4gICAgICAgICAgICAgICAgdmFyIHByb2Nlc3NlczogWmVwdG9Db2xsZWN0aW9uID0gJCgnPGRpdj4nKS5hZGRDbGFzcygncHJvY2Vzc2VzIHRhYmxlLXJlc3BvbnNpdmUnKTtcbiAgICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL01ha2UgdGFibGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhYmxlOiBaZXB0b0NvbGxlY3Rpb24gPSAkKCc8dGFibGU+JykuYWRkQ2xhc3MoJ3RhYmxlIHRhYmxlLXN0cmlwZWQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZWFkOiBaZXB0b0NvbGxlY3Rpb24gPSAkKCc8dGhlYWQ+JyksXG4gICAgICAgICAgICAgICAgICAgICAgICB0Ym9keTogWmVwdG9Db2xsZWN0aW9uID0gJCgnPHRib2R5PicpO1xuICAgICAgICAgICAgICAgICAgICB0aGVhZC5hcHBlbmQoJCgnPHRyPicpLmFwcGVuZCgnPHRkPlBJRDwvdGQ+JykuYXBwZW5kKCc8dGQ+Q29tbWFuZDwvdGQ+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzx0ZD5Vc2VyPC90ZD4nKS5hcHBlbmQoJzx0ZD5DUFUgVXNhZ2U8L3RkPicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8dGQ+UkFNIFVzYWdlPC90ZD4nKS5hcHBlbmQoJzx0ZD5DUFUgVGltZTwvdGQ+JykpO1xuICAgICAgICAgICAgICAgICAgICAvL1doZXRoZXIgb3Igbm90IHRvIHNob3cgYSB3YXJuaW5nXG4gICAgICAgICAgICAgICAgICAgIHZhciB3YXJuaW5nID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vUGFyc2Ugcm93c1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm93OiBaZXB0b0NvbGxlY3Rpb24gPSAkKCc8dHI+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sczogc3RyaW5nW10gPSBsaW5lc1tpXS5zcGxpdCgnICcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbENvdW50OiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBjb2xzLmxlbmd0aDsgdisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbHNbdl0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sOiBaZXB0b0NvbGxlY3Rpb24gPSAkKCc8dGQ+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50OiBzdHJpbmcgPSBjb2xzW3ZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudFZhbDogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vRm9ybWF0IENQVSB1c2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sQ291bnQgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRWYWwgPSBwYXJzZUZsb2F0KGNvbHNbdl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnRWYWwgPj0gMjAuMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50VmFsID49IDQwLjApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ1JlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudFZhbCAlIDEgPT09IDAuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSAnJyArIGNvbnRlbnRWYWwudG9GaXhlZCgwKSArICclJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9ICcnICsgY29udGVudFZhbC50b0ZpeGVkKDEpICsgJyUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vRm9ybWF0IFJBTSB1c2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb2xDb3VudCA9PT0gNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFZhbCA9IHBhcnNlRmxvYXQoY29sc1t2XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudFZhbCA9PT0gMC4wKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbC50ZXh0KGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3cuYXBwZW5kKGNvbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGJvZHkuYXBwZW5kKHJvdyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy9TaG93IHdhcm5pbmcgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgICAgICAgICAgIGlmICh3YXJuaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ2x5cGg6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzxzcGFuPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2x5cGguYWRkQ2xhc3MoJ2dseXBoaWNvbiBnbHlwaGljb24td2FybmluZy1zaWduIHB1bGwtcmlnaHQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3YXJuaW5nUmVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdseXBoLnRvZ2dsZUNsYXNzKCdnbHlwaGljb24td2FybmluZy1zaWduIGdseXBoaWNvbi1leGNsYW1hdGlvbi1zaWduJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXIuYXBwZW5kKGdseXBoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRhYmxlLmFwcGVuZCh0aGVhZCk7XG4gICAgICAgICAgICAgICAgICAgIHRhYmxlLmFwcGVuZCh0Ym9keSk7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3Nlcy5hcHBlbmQodGFibGUpO1xuICAgICAgICAgICAgICAgICAgICBob3N0LmFwcGVuZChoZWFkZXIpO1xuICAgICAgICAgICAgICAgICAgICBob3N0LmFwcGVuZChwcm9jZXNzZXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmUuYXBwZW5kKGhvc3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9SZW1vdmUgZW1wdHkgcm93c1xuICAgICAgICAgICAgdGhpcy5lLmZpbmQoJ3RyOmVtcHR5JykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIC8vQ291bnQgZGFuZ2VycyBhbmQgd2FybmluZ3NcbiAgICAgICAgICAgIHZhciBudW1EYW5nZXJzOiBudW1iZXIgPSB0aGlzLmUuZmluZCgnLmdseXBoaWNvbi1leGNsYW1hdGlvbi1zaWduJykuc2l6ZSgpO1xuICAgICAgICAgICAgdmFyIG51bVdhcm5pbmdzOiBudW1iZXIgPSB0aGlzLmUuZmluZCgnLmdseXBoaWNvbi13YXJuaW5nLXNpZ24nKS5zaXplKCk7XG4gICAgICAgICAgICBpZiAobnVtV2FybmluZ3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdhcm5pbmdBbGVydCA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC13YXJuaW5nXCI+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQ6IHN0cmluZyA9IFwiPHN0cm9uZz5IZWFkcyB1cCE8L3N0cm9uZz4gVGhlcmVcIjtcbiAgICAgICAgICAgICAgICBjb250ZW50ICs9IChudW1XYXJuaW5ncyA9PT0gMSA/IFwiJ3Mgc29tZXRoaW5nIGZpc2h5XCIgOiBcIiBhcmUgXCIgKyBudW1XYXJuaW5ncyArXG4gICAgICAgICAgICAgICAgICAgIFwiIChvciBtb3JlKSByZXNvdXJjZSBob2dzXCIpICsgXCIgb3V0IHRoZXJlLlwiO1xuICAgICAgICAgICAgICAgIHdhcm5pbmdBbGVydC5odG1sKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZS5wcmVwZW5kKHdhcm5pbmdBbGVydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobnVtRGFuZ2VycyA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgZGFuZ2VyQWxlcnQ6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzxkaXY+JykuYWRkQ2xhc3MoJ2FsZXJ0IGFsZXJ0LWRhbmdlcicpO1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50OiBzdHJpbmcgPSBcIjxzdHJvbmc+T2ggc25hcCE8L3N0cm9uZz4gVGhlcmUgXCI7XG4gICAgICAgICAgICAgICAgY29udGVudCArPSAobnVtRGFuZ2VycyA9PT0gMSA/IFwiaXMgb25lIGRhbmdlciBcIiA6IFwiYXJlIFwiICsgbnVtRGFuZ2VycyArIFwiIGRhbmdlcnMgXCIpICsgXCIgbHVya2luZy5cIjtcbiAgICAgICAgICAgICAgICBkYW5nZXJBbGVydC5odG1sKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZS5wcmVwZW5kKGRhbmdlckFsZXJ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9HaXZlIHRoZSB1c2VyJ3MgbmFtZXNcbiAgICAgICAgICAgIHRoaXMuZS5maW5kKCd0Ym9keSA+IHRyID4gdGQ6bnRoLWNoaWxkKDMpJykubW91c2VlbnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW06IFplcHRvQ29sbGVjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgaWYgKCFlbGVtLmF0dHIoJ3RpdGxlJykgJiYgIWVsZW0uYXR0cignZGF0YS11bmtub3duJykpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5nZXQoJ2Zpbmdlci5zY3JpcHQ/dXNlcj0nICsgZWxlbS50ZXh0KCksIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSAocmVzcG9uc2UgPyByZXNwb25zZSA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaGluZ1VzZXJuYW1lcyA9ICQoJ3RkOm50aC1jaGlsZCgzKScpLmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcykudGV4dCgpID09PSBlbGVtLnRleHQoKTt9XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdVc2VybmFtZXMuYXR0cigndGl0bGUnLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBibGlwID0gJCgnPHNwYW4+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxpcC5hZGRDbGFzcygnZ2x5cGhpY29uIGdseXBoaWNvbi1xdWVzdGlvbi1zaWduIHB1bGwtcmlnaHQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibGlwLmF0dHIoJ3RpdGxlJywnVW5rbm93biB1c2VyLCBwcm9iYWJseSBzcGVjaWZpYyB0byBhbiBhcHBsaWNhdGlvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nVXNlcm5hbWVzLmF0dHIoJ2RhdGEtdW5rbm93bicsICd0cnVlJykuYXBwZW5kKGJsaXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCAndGV4dC9wbGFpbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufSIsIm1vZHVsZSBSdW5hd2F5IHtcblxuICAgIGV4cG9ydCBjbGFzcyBSdW5CdXR0b24gZXh0ZW5kcyBDb21wb25lbnQge1xuICAgICAgICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbjtcblxuICAgICAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgICAgICBzdXBlcignI3J1bicpO1xuXG4gICAgICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICB0aGlzLmUuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFwcC5ydW4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBkaXNhYmxlZCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZDtcbiAgICAgICAgfVxuICAgICAgICBwdWJsaWMgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lLmF0dHIoJ2Rpc2FibGVkJywgJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0iLCJtb2R1bGUgUnVuYXdheSB7XG5cbiAgICBleHBvcnQgY2xhc3MgUnVubmluZ0xhYmVsIGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBfcGVyY2VudEVsZW06IENvbXBvbmVudDtcblxuICAgICAgICBwcml2YXRlIF9wcm9ncmVzczogbnVtYmVyO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICAgIHN1cGVyKCcjcnVubmluZycpO1xuXG4gICAgICAgICAgICB0aGlzLl9wZXJjZW50RWxlbSA9IG5ldyBDb21wb25lbnQoJyNydW5uaW5nUGVyY2VudCcpO1xuICAgICAgICAgICAgdGhpcy5fcGVyY2VudEVsZW0uaGlkZSgpO1xuXG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IDAuMDtcblxuICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IHByb2dyZXNzKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2dyZXNzO1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgcHJvZ3Jlc3ModmFsdWU6IG51bWJlcikge1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVyY2VudEVsZW0uaGlkZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFwcC5pbml0QnlVc2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BlcmNlbnRFbGVtLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wZXJjZW50RWxlbS5lLnRleHQoJygnICsgKHZhbHVlICogMTAwKS50b0ZpeGVkKDApICsgJyUpJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGVyY2VudEVsZW0uaGlkZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0iLCJtb2R1bGUgUnVuYXdheS5TZXJ2aWNlcyB7XG5cbiAgICBleHBvcnQgY2xhc3MgUHJvZ3Jlc3Mge1xuICAgICAgICBwcml2YXRlIGV2ZW50czogQnJpZGdlO1xuICAgICAgICBwcml2YXRlIF9wcm9ncmVzczogbnVtYmVyO1xuICAgICAgICBwcml2YXRlIF9ob3N0Q291bnQ6IG51bWJlcjtcbiAgICAgICAgcHJpdmF0ZSBfY3VycmVudEhvc3RJbmRleDogbnVtYmVyO1xuICAgICAgICBwcml2YXRlIF9jdXJyZW50SG9zdE5hbWU6IHN0cmluZztcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEJyaWRnZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IHByb2dyZXNzKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJvZ3Jlc3M7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IHByb2dyZXNzKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy50cmlnZ2VyKFwicHJvcGVydHlDaGFuZ2VkXCIsIHtwcm9wZXJ0eTogXCJwcm9ncmVzc1wifSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGhvc3RDb3VudCgpOiBudW1iZXIge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hvc3RDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBwdWJsaWMgc2V0IGhvc3RDb3VudCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXIoXCJwcm9wZXJ0eUNoYW5nZWRcIiwge3Byb3BlcnR5OiBcImhvc3RDb3VudFwifSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGN1cnJlbnRIb3N0SW5kZXgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50SG9zdEluZGV4O1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgY3VycmVudEhvc3RJbmRleCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdEluZGV4ID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy50cmlnZ2VyKFwicHJvcGVydHlDaGFuZ2VkXCIsIHtwcm9wZXJ0eTogXCJjdXJyZW50SG9zdEluZGV4XCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBnZXQgY3VycmVudEhvc3ROYW1lKCk6IHN0cmluZyB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudEhvc3ROYW1lO1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgY3VycmVudEhvc3ROYW1lKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRIb3N0TmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwiY3VycmVudEhvc3ROYW1lXCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IEJyaWRnZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHJlc2V0KCkge1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSAnJztcblxuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwicHJvZ3Jlc3NcIn0pO1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwiaG9zdENvdW50XCJ9KTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXIoXCJwcm9wZXJ0eUNoYW5nZWRcIiwge3Byb3BlcnR5OiBcImN1cnJlbnRIb3N0SW5kZXhcIn0pO1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwiY3VycmVudEhvc3ROYW1lXCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB1cGRhdGUoKTogUGlua3lTd2Vhci5Qcm9taXNlIHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gcGlua3lTd2VhcigpLFxuICAgICAgICAgICAgICAgIHRyYWNrUHJvZ3Jlc3M6IEludGVydmFsLFxuICAgICAgICAgICAgICAgIGRvVXBkYXRlUHJvZ3Jlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0UHJvZ3Jlc3MoKS50aGVuKChwcm9ncmVzcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2dyZXNzID09PSAxLjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFja1Byb2dyZXNzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrUHJvZ3Jlc3MuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UoZmFsc2UsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGFwcC5pc1J1bmF3YXlDaGVja1J1bm5pbmcgJiYgIWFwcC5pbml0QnlVc2VyKSB7XG4gICAgICAgICAgICAgICAgdHJhY2tQcm9ncmVzcyA9IGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9VcGRhdGVQcm9ncmVzcygpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIGRvVXBkYXRlUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGdldFByb2dyZXNzKCk6IFBpbmt5U3dlYXIuR2VuZXJpY1Byb21pc2U8bnVtYmVyPiB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXI8bnVtYmVyPigpO1xuXG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogJ3Byb2dyZXNzLnR4dCcsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gcmVzcG9uc2Uuc3BsaXQoJ1xcbicpWzBdLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVsxXSA9PT0gXCJkb25lXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaG9zdENvdW50ID0gcGFyc2VJbnQocmVzcG9uc2VbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9zdEluZGV4ID0gdGhpcy5ob3N0Q291bnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgWzEuMF0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9zdE5hbWUgPSByZXNwb25zZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gcmVzcG9uc2VbMF0uc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hvc3RDb3VudCA9IHBhcnNlSW50KHJlc3BvbnNlWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEhvc3RJbmRleCA9IHBhcnNlSW50KHJlc3BvbnNlWzBdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbdGhpcy5wcm9ncmVzc10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UoZmFsc2UsIFswLjBdKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAndGV4dCdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgIH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
