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
        function delay(time) {
            var promise = pinkySwear();
            window.setTimeout(function () {
                promise(true);
            }, time);
            return promise;
        }
        Helpers.delay = delay;
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
        Helpers.interval = interval;
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
                            Runaway.Helpers.delay(250).then(function () {
                                _this._results.update();
                            });
                        }, function () {
                            _this._running = false;
                            _this._progress.update();
                            _this._results.hide(true);
                            Runaway.Helpers.delay(250).then(function () {
                                _this._results.update();
                            });
                        });
                        _this._results.update();
                    }
                    else if (status === 2 /* NO_HOSTS */) {
                        //FIXME: Show no hosts error
                        _this._progress.errorText = 'There are no hosts to check.';
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
                            Runaway.Helpers.delay(250).then(function () {
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
            Runaway.Helpers.delay(700).then(function () {
                _this._results.hide(true, 300);
                Runaway.Helpers.delay(500).then(function () {
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
})(Runaway || (Runaway = {}));

var Runaway;
(function (Runaway) {
    (function (RunStatus) {
        RunStatus[RunStatus["NOT_RUNNING"] = 0] = "NOT_RUNNING";
        RunStatus[RunStatus["RUNNING"] = 1] = "RUNNING";
        RunStatus[RunStatus["NO_HOSTS"] = 2] = "NO_HOSTS";
    })(Runaway.RunStatus || (Runaway.RunStatus = {}));
    var RunStatus = Runaway.RunStatus;
    (function (ProgressStatus) {
        ProgressStatus[ProgressStatus["RUNNING"] = 0] = "RUNNING";
        ProgressStatus[ProgressStatus["SUCCESS"] = 1] = "SUCCESS";
        ProgressStatus[ProgressStatus["ERROR"] = 2] = "ERROR";
    })(Runaway.ProgressStatus || (Runaway.ProgressStatus = {}));
    var ProgressStatus = Runaway.ProgressStatus;
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
            this.hide();
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
                trackProgress = Runaway.Helpers.interval(function () {
                    doUpdateProgress();
                }, 2000);
                doUpdateProgress();
                this._runButton.hide();
                this._runningLabel.show();
            }
            else if (app.isRunawayCheckRunning) {
                this._runButton.hide();
                this._runningLabel.show();
                Runaway.Helpers.delay(250).then(function () {
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
            this.hide();
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
                Runaway.Helpers.delay(225).then(function () {
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
                    } //TODO: Show the green all good check mark, otherwise?
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
                    trackProgress = Runaway.Helpers.interval(function () {
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

//# sourceMappingURL=../js/runaway.ts.js.map