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

var services = {
    progress: new Runaway.Services.Progress()
};
var app = new Runaway.Application();

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9CcmlkZ2UudHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvSGVscGVycy50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9tYWluLnRzIiwiL1VzZXJzL2NoYW5jZXNub3cvRG9jdW1lbnRzL0dpdEh1Yi9ydW5hd2F5LWdoL1J1bmF3YXkudHMiLCIvVXNlcnMvY2hhbmNlc25vdy9Eb2N1bWVudHMvR2l0SHViL3J1bmF3YXktZ2gvUnVuYXdheUNvbnN0YW50cy50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9UaXRsZS50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9jb21wb25lbnRzL0NvbXBvbmVudC50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9jb21wb25lbnRzL1Byb2dyZXNzLnRzIiwiL1VzZXJzL2NoYW5jZXNub3cvRG9jdW1lbnRzL0dpdEh1Yi9ydW5hd2F5LWdoL2NvbXBvbmVudHMvUmVzdWx0cy50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9jb21wb25lbnRzL1J1bkJ1dHRvbi50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9jb21wb25lbnRzL1J1bm5pbmdMYWJlbC50cyIsIi9Vc2Vycy9jaGFuY2Vzbm93L0RvY3VtZW50cy9HaXRIdWIvcnVuYXdheS1naC9zZXJ2aWNlcy9Qcm9ncmVzcy50cyJdLCJuYW1lcyI6WyJSdW5hd2F5IiwiUnVuYXdheS5CcmlkZ2UiLCJSdW5hd2F5LkJyaWRnZS5jb25zdHJ1Y3RvciIsIlJ1bmF3YXkuQnJpZGdlLm9uIiwiUnVuYXdheS5CcmlkZ2Uub2ZmIiwiUnVuYXdheS5CcmlkZ2UudHJpZ2dlciIsIlJ1bmF3YXkuSGVscGVycyIsIlJ1bmF3YXkuSGVscGVycy5kZWxheSIsIlJ1bmF3YXkuSGVscGVycy5pbnRlcnZhbCIsIlJ1bmF3YXkuSGVscGVycy5yYW5kb21OdW1iZXIiLCJSdW5hd2F5LkhlbHBlcnMub2JqZWN0SXNBIiwiUnVuYXdheS5BcHBsaWNhdGlvbiIsIlJ1bmF3YXkuQXBwbGljYXRpb24uY29uc3RydWN0b3IiLCJSdW5hd2F5LkFwcGxpY2F0aW9uLnByb2dyZXNzIiwiUnVuYXdheS5BcHBsaWNhdGlvbi5yZXN1bHRzIiwiUnVuYXdheS5BcHBsaWNhdGlvbi5pc1J1bmF3YXlDaGVja1J1bm5pbmciLCJSdW5hd2F5LkFwcGxpY2F0aW9uLmluaXRCeVVzZXIiLCJSdW5hd2F5LkFwcGxpY2F0aW9uLnJ1biIsIlJ1bmF3YXkuQXBwbGljYXRpb24uY2hlY2tDb21wbGV0ZWQiLCJSdW5hd2F5LkFwcGxpY2F0aW9uLmdldFJ1blN0YXR1cyIsIlJ1bmF3YXkuUnVuU3RhdHVzIiwiUnVuYXdheS5Qcm9ncmVzc1N0YXR1cyIsIlJ1bmF3YXkuVGl0bGUiLCJSdW5hd2F5LlRpdGxlLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5UaXRsZS5jaGFuZ2UiLCJSdW5hd2F5LkNvbXBvbmVudCIsIlJ1bmF3YXkuQ29tcG9uZW50LmNvbnN0cnVjdG9yIiwiUnVuYXdheS5Db21wb25lbnQuZSIsIlJ1bmF3YXkuQ29tcG9uZW50LnNob3ciLCJSdW5hd2F5LkNvbXBvbmVudC5oaWRlIiwiUnVuYXdheS5Qcm9ncmVzcyIsIlJ1bmF3YXkuUHJvZ3Jlc3MuY29uc3RydWN0b3IiLCJSdW5hd2F5LlByb2dyZXNzLnByb2dyZXNzIiwiUnVuYXdheS5Qcm9ncmVzcy5ob3N0Q291bnQiLCJSdW5hd2F5LlByb2dyZXNzLmN1cnJlbnRIb3N0SW5kZXgiLCJSdW5hd2F5LlByb2dyZXNzLmN1cnJlbnRIb3N0TmFtZSIsIlJ1bmF3YXkuUHJvZ3Jlc3MuZXJyb3JUZXh0IiwiUnVuYXdheS5Qcm9ncmVzcy5zZXRTdGF0dXMiLCJSdW5hd2F5LlByb2dyZXNzLmxheW91dCIsIlJ1bmF3YXkuUHJvZ3Jlc3MudXBkYXRlIiwiUnVuYXdheS5Qcm9ncmVzcy5yZXNldCIsIlJ1bmF3YXkuUHJvZ3Jlc3MudXBkYXRlUHJvZ3Jlc3MiLCJSdW5hd2F5LlByb2dyZXNzLmdldFByb2dyZXNzIiwiUnVuYXdheS5SZXN1bHRzIiwiUnVuYXdheS5SZXN1bHRzLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5SZXN1bHRzLmxhc3RSdW5EYXRlIiwiUnVuYXdheS5SZXN1bHRzLmlzRGlydHkiLCJSdW5hd2F5LlJlc3VsdHMudXBkYXRlIiwiUnVuYXdheS5SZXN1bHRzLmdldFJlc3VsdHMiLCJSdW5hd2F5LlJlc3VsdHMucGFyc2UiLCJSdW5hd2F5LlJ1bkJ1dHRvbiIsIlJ1bmF3YXkuUnVuQnV0dG9uLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5SdW5CdXR0b24uZGlzYWJsZWQiLCJSdW5hd2F5LlJ1bm5pbmdMYWJlbCIsIlJ1bmF3YXkuUnVubmluZ0xhYmVsLmNvbnN0cnVjdG9yIiwiUnVuYXdheS5SdW5uaW5nTGFiZWwucHJvZ3Jlc3MiLCJSdW5hd2F5LlNlcnZpY2VzIiwiUnVuYXdheS5TZXJ2aWNlcy5Qcm9ncmVzcyIsIlJ1bmF3YXkuU2VydmljZXMuUHJvZ3Jlc3MuY29uc3RydWN0b3IiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLnByb2dyZXNzIiwiUnVuYXdheS5TZXJ2aWNlcy5Qcm9ncmVzcy5ob3N0Q291bnQiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLmN1cnJlbnRIb3N0SW5kZXgiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLmN1cnJlbnRIb3N0TmFtZSIsIlJ1bmF3YXkuU2VydmljZXMuUHJvZ3Jlc3MuYWRkRXZlbnRMaXN0ZW5lciIsIlJ1bmF3YXkuU2VydmljZXMuUHJvZ3Jlc3MucmVzZXQiLCJSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzLnVwZGF0ZSIsIlJ1bmF3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LEtBQUtBLGVBQWlCQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDL0JBLEtBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBO3dCQUNyQkEsS0FBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsS0FBS0EsQ0FBQ0E7d0JBQ3pCQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTt3QkFDdkJBLEtBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLElBQUlBLENBQUNBOzRCQUN6QkEsS0FBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0E7NEJBQ3RCQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTs0QkFDeEJBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBOzRCQUN6QkEsZUFBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0NBQ3BCQSxLQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTs0QkFDM0JBLENBQUNBLENBQUNBLENBQUNBO3dCQUNQQSxDQUFDQSxFQUFFQTs0QkFDQ0EsS0FBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0E7NEJBQ3RCQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTs0QkFDeEJBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBOzRCQUN6QkEsZUFBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0NBQ3BCQSxLQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTs0QkFDM0JBLENBQUNBLENBQUNBLENBQUNBO3dCQUNQQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDSEEsS0FBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEs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QSxFQUFFQTt3QkFDSCxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFDREEsUUFBUUEsRUFBRUEsTUFBTUE7aUJBQ25CQSxDQUFDQSxDQUFDQTtnQkFFSEEsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0E7WUFDbkJBLENBQUNBO1lBQ0xULGVBQUNBO1FBQURBLENBckhBRCxBQXFIQ0MsSUFBQUQ7UUFySFlBLGlCQUFRQSxHQUFSQSxRQXFIWkEsQ0FBQUE7SUFDTEEsQ0FBQ0EsRUF4SGN4RCxRQUFRQSxHQUFSQSxnQkFBUUEsS0FBUkEsZ0JBQVFBLFFBd0h0QkE7QUFBREEsQ0FBQ0EsRUF4SE0sT0FBTyxLQUFQLE9BQU8sUUF3SGIiLCJmaWxlIjoicnVuYXdheS50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZSBSdW5hd2F5IHtcbiAgICBleHBvcnQgY2xhc3MgQnJpZGdlIHtcblxuICAgICAgICBwcml2YXRlIGhhbmRsZXJzOiBCcmlkZ2VIYW5kbGVyW107XG5cbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVycyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZCBhbmQgc3Vic2NyaWJlIHRvIGFuIGV2ZW50XG4gICAgICAgICAqIEBwYXJhbSBldmVudCBUeXBlIG9mIGJyaWRnZSBldmVudCB0byBoYW5kbGVcbiAgICAgICAgICogQHBhcmFtIGNhbGxiYWNrIEhhbmRsaW5nIGNhbGxiYWNrIGRlbGVnYXRlXG4gICAgICAgICAqIEByZXR1cm4gVW5pcXVlIGlkIHJlcHJlc2VudGluZyB0aGlzIGV2ZW50XG4gICAgICAgICAqL1xuICAgICAgICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogQnJpZGdlQ2FsbGJhY2spOiBudW1iZXIge1xuICAgICAgICAgICAgTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgIHZhciBoYW5kbGVyOiBCcmlkZ2VIYW5kbGVyID0ge1xuICAgICAgICAgICAgICAgIGV2ZW50OiBldmVudCxcbiAgICAgICAgICAgICAgICBpZDogUnVuYXdheS5IZWxwZXJzLnJhbmRvbU51bWJlcigwLCBEYXRlLm5vdygpKSxcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlci5pZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxuICAgICAgICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkIHJlcHJlc2VudGluZyB0aGUgZXZlbnQgdG8gcmVtb3ZlXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoaWQ6IG51bWJlcik6IEJyaWRnZSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oYW5kbGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhbmRsZXJzW2ldLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaCBhbiBldmVudFxuICAgICAgICAgKiBAcGFyYW0gZXZlbnQgVHlwZSBvZiBicmlkZ2UgZXZlbnQgdG8gZGlzcGF0Y2hcbiAgICAgICAgICogQHBhcmFtIGRhdGEgRGF0YSB0byBwYXNzIGFsb25nIHRvIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgICAqIEBwYXJhbSBjb250ZXh0PXdpbmRvdyBDb250ZXh0IGluIHdoaWNoIHRvIGV4ZWN1dGUgaGFuZGxpbmcgY2FsbGJhY2sgZGVsZWdhdGVzXG4gICAgICAgICAqL1xuICAgICAgICB0cmlnZ2VyKGV2ZW50OiBzdHJpbmcsIGRhdGE6IGFueSA9IG51bGwsIGNvbnRleHQgPSB3aW5kb3cpOiBCcmlkZ2Uge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVycy5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVyOiBCcmlkZ2VIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIuZXZlbnQgPT09IGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGxiYWNrLmNhbGwoY29udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGxiYWNrLmNhbGwoY29udGV4dCwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVjbGFyZSBjbGFzcyBCcmlkZ2VIYW5kbGVyIHtcbiAgICAgICAgZXZlbnQ6IHN0cmluZztcbiAgICAgICAgaWQ6IG51bWJlcjtcbiAgICAgICAgY2FsbGJhY2s6IEJyaWRnZUNhbGxiYWNrO1xuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgQnJpZGdlQ2FsbGJhY2sge1xuICAgICAgICAoZGF0YTogYW55KTogdm9pZDtcbiAgICB9XG59XG4iLCJtb2R1bGUgUnVuYXdheS5IZWxwZXJzIHtcblxuICAgIGV4cG9ydCBmdW5jdGlvbiBkZWxheSh0aW1lOiBudW1iZXIpOiBQaW5reVN3ZWFyLlByb21pc2Uge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXIoKTtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcHJvbWlzZSh0cnVlKTtcbiAgICAgICAgfSwgdGltZSk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSW50ZXJ2YWwge1xuICAgICAgICBpbnRlcnZhbElkOiBudW1iZXI7XG4gICAgICAgIGNsZWFyOiAoKSA9PiB2b2lkO1xuICAgIH1cblxuICAgIC8vSW50ZXJ2YWwgdXRpbGl0eSBmdW5jdGlvblxuICAgIGV4cG9ydCBmdW5jdGlvbiBpbnRlcnZhbChmdW5jOiAoKSA9PiB2b2lkLCB0aW1lOiBudW1iZXIpOiBJbnRlcnZhbCB7XG4gICAgICAgIHZhciBpbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jLCB0aW1lKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGludGVydmFsSWQ6IGludGVydmFsLFxuICAgICAgICAgICAgY2xlYXI6IGZ1bmN0aW9uICgpIHsgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbU51bWJlcihtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBvYmplY3RJc0Eob2JqZWN0OiBhbnksIHR5cGU6IGFueSkge1xuICAgICAgICBpZiAodHlwZS5oYXNPd25Qcm9wZXJ0eShcInByb3RvdHlwZVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiXG52YXIgc2VydmljZXMgPSB7XG4gICAgcHJvZ3Jlc3M6IG5ldyBSdW5hd2F5LlNlcnZpY2VzLlByb2dyZXNzKClcbn07XG5cbnZhciBhcHAgPSBuZXcgUnVuYXdheS5BcHBsaWNhdGlvbigpO1xuIiwibW9kdWxlIFJ1bmF3YXkge1xuXG4gICAgZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uIHtcbiAgICAgICAgcHJpdmF0ZSBfcHJvZ3Jlc3M6IFByb2dyZXNzO1xuICAgICAgICBwcml2YXRlIF9yZXN1bHRzOiBSZXN1bHRzO1xuXG4gICAgICAgIHByaXZhdGUgX3J1bm5pbmc6IGJvb2xlYW47XG4gICAgICAgIHByaXZhdGUgX2luaXRCeVVzZXI6IGJvb2xlYW47XG5cbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgICAgJCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSBuZXcgUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzID0gbmV3IFJlc3VsdHMoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UnVuU3RhdHVzKCkudGhlbigoc3RhdHVzOiBSdW5TdGF0dXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gUnVuU3RhdHVzLlJVTk5JTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdEJ5VXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MucmVzZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnVwZGF0ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLmhpZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSGVscGVycy5kZWxheSgyNTApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLmhpZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSGVscGVycy5kZWxheSgyNTApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cyA9PT0gUnVuU3RhdHVzLk5PX0hPU1RTKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL0ZJWE1FOiBTaG93IG5vIGhvc3RzIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5lcnJvclRleHQgPSAnVGhlcmUgYXJlIG5vIGhvc3RzIHRvIGNoZWNrLic7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5zZXRTdGF0dXMoUHJvZ3Jlc3NTdGF0dXMuRVJST1IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2luaXRCeVVzZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBnZXQgcHJvZ3Jlc3MoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJvZ3Jlc3M7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IHJlc3VsdHMoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0cztcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBnZXQgaXNSdW5hd2F5Q2hlY2tSdW5uaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3J1bm5pbmc7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGluaXRCeVVzZXIoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5pdEJ5VXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBydW4oKSB7XG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2luaXRCeVVzZXIgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaXNEaXJ0eSA9IHRydWU7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0UnVuU3RhdHVzKCkudGhlbigoc3RhdHVzOiBSdW5TdGF0dXMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSBSdW5TdGF0dXMuUlVOTklORykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5lcnJvclRleHQgPSAnUnVuYXdheSEgaXMgY3VycmVudGx5IHBlcmZvcm1pbmcgYSBydW5hd2F5IGNoZWNrLic7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnNldFN0YXR1cyhQcm9ncmVzc1N0YXR1cy5FUlJPUik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnVwZGF0ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdEJ5VXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MudXBkYXRlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnNldFN0YXR1cyhQcm9ncmVzc1N0YXR1cy5TVUNDRVNTKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLmhpZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSGVscGVycy5kZWxheSgyNTApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN1bHRzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdHVzID09PSBSdW5TdGF0dXMuTk9fSE9TVFMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MuZXJyb3JUZXh0ID0gJ1RoZXJlIGFyZSBubyBob3N0cyB0byBjaGVjay4nO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5zZXRTdGF0dXMoUHJvZ3Jlc3NTdGF0dXMuRVJST1IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBUaXRsZS5jaGFuZ2UoJ1J1bm5pbmcuLi4nKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5zZXRTdGF0dXMoUHJvZ3Jlc3NTdGF0dXMuUlVOTklORyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vRG8gcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgICAgICAvL0NvbXBsZXRlZCBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3Qub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja0NvbXBsZXRlZCgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1BhcnNlIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW5lcyA9IHJlc3BvbnNlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vUmVtb3ZlIGp1bmsgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1VwZGF0ZSBtZXRhZGF0YSBpZiBuZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcHJvZ3Jlc3MuaG9zdENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1ldGEgPSBsaW5lc1swXS5zcGxpdCgnfCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLmhvc3RDb3VudCA9IHBhcnNlSW50KG1ldGFbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMubGFzdFJ1bkRhdGUgPSBtZXRhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy9VcGRhdGUgcHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MuY3VycmVudEhvc3ROYW1lID0gbGluZXNbbGluZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MuY3VycmVudEhvc3RJbmRleCArPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0Lm9wZW4oXCJnZXRcIiwgXCJydW5hd2F5LnNjcmlwdFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vSGVscGVycy5kZWxheShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgICAgICAgICAgICAgICAgICAvL30sIDIwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgY2hlY2tDb21wbGV0ZWQoKSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5zZXRTdGF0dXMoUHJvZ3Jlc3NTdGF0dXMuU1VDQ0VTUyk7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy5jdXJyZW50SG9zdEluZGV4ID0gdGhpcy5fcHJvZ3Jlc3MuaG9zdENvdW50O1xuICAgICAgICAgICAgSGVscGVycy5kZWxheSg3MDApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaGlkZSh0cnVlLCAzMDApO1xuICAgICAgICAgICAgICAgIEhlbHBlcnMuZGVsYXkoNTAwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MubGF5b3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMudXBkYXRlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzLmxheW91dCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgVGl0bGUuY2hhbmdlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0UnVuU3RhdHVzKCk6IFBpbmt5U3dlYXIuR2VuZXJpY1Byb21pc2U8UnVuU3RhdHVzPiB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXI8UnVuU3RhdHVzPigpO1xuXG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogJ3J1bi5zY3JpcHQnLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gcmVzcG9uc2Uuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHJlc3BvbnNlWzBdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09IFwiZXJyb3I6IHJ1bm5pbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbUnVuU3RhdHVzLlJVTk5JTkddKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSA9PT0gXCJlcnJvcjogbm8gaG9zdHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbUnVuU3RhdHVzLk5PX0hPU1RTXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlKHRydWUsIFtSdW5TdGF0dXMuTk9UX1JVTk5JTkddKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICd0ZXh0J30pO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIm1vZHVsZSBSdW5hd2F5IHtcblxuICAgIGV4cG9ydCBlbnVtIFJ1blN0YXR1cyB7XG4gICAgICAgIE5PVF9SVU5OSU5HLFxuICAgICAgICBSVU5OSU5HLFxuICAgICAgICBOT19IT1NUU1xuICAgIH1cblxuICAgIGV4cG9ydCBlbnVtIFByb2dyZXNzU3RhdHVzIHtcbiAgICAgICAgUlVOTklORyxcbiAgICAgICAgU1VDQ0VTUyxcbiAgICAgICAgRVJST1JcbiAgICB9XG59XG4iLCJtb2R1bGUgUnVuYXdheSB7XG5cbiAgICBleHBvcnQgY2xhc3MgVGl0bGUge1xuXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgb2xkVGl0bGU6IHN0cmluZyA9ICQoJ3RpdGxlJykudGV4dCgpO1xuXG4gICAgICAgIHB1YmxpYyBzdGF0aWMgY2hhbmdlKG5ld1RpdGxlPzogc3RyaW5nKSB7XG4gICAgICAgICAgICBuZXdUaXRsZSA9IChuZXdUaXRsZSA9PT0gdW5kZWZpbmVkID8gVGl0bGUub2xkVGl0bGUgOiBuZXdUaXRsZSk7XG4gICAgICAgICAgICAkKCd0aXRsZScpLnRleHQobmV3VGl0bGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwibW9kdWxlIFJ1bmF3YXkge1xuXG4gICAgZXhwb3J0IGNsYXNzIENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgX2VsZW1lbnQ6IFplcHRvRnhDb2xsZWN0aW9uO1xuXG4gICAgICAgIHB1YmxpYyBnZXQgZSgpOiBaZXB0b0Z4Q29sbGVjdGlvbiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cnVjdG9yIChlbGVtZW50U2VsZWN0b3I6IHN0cmluZyk7XG4gICAgICAgIGNvbnN0cnVjdG9yIChlbGVtZW50OiBIVE1MRWxlbWVudCk7XG4gICAgICAgIGNvbnN0cnVjdG9yIChlbGVtZW50OiBhbnkpIHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSA8WmVwdG9GeENvbGxlY3Rpb24+JChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBzaG93KGZhZGU6IGJvb2xlYW4gPSBmYWxzZSwgZHVyYXRpb246IG51bWJlciA9ICQuZnguc3BlZWRzLl9kZWZhdWx0KSB7XG4gICAgICAgICAgICBpZiAoZmFkZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZS5mYWRlSW4oZHVyYXRpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGhpZGUoZmFkZTogYm9vbGVhbiA9IGZhbHNlLCBkdXJhdGlvbjogbnVtYmVyID0gJC5meC5zcGVlZHMuX2RlZmF1bHQpIHtcbiAgICAgICAgICAgIGlmIChmYWRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lLmZhZGVPdXQoZHVyYXRpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwibW9kdWxlIFJ1bmF3YXkge1xuXG4gICAgZXhwb3J0IGNsYXNzIFByb2dyZXNzIGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBfcnVuQnV0dG9uOiBSdW5CdXR0b247XG4gICAgICAgIHByaXZhdGUgX3J1bm5pbmdMYWJlbDogUnVubmluZ0xhYmVsO1xuICAgICAgICBwcml2YXRlIF9ob3N0Q291bnRFbGVtOiBDb21wb25lbnQ7XG4gICAgICAgIHByaXZhdGUgX2hvc3RJbmRleDogQ29tcG9uZW50O1xuICAgICAgICBwcml2YXRlIF9ob3N0TmFtZTogQ29tcG9uZW50O1xuICAgICAgICBwcml2YXRlIF9wcm9ncmVzc0JhcjogQ29tcG9uZW50O1xuICAgICAgICBwcml2YXRlIF9pY29uOiBDb21wb25lbnQ7XG5cbiAgICAgICAgcHJpdmF0ZSBfcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAgICAgcHJpdmF0ZSBfaG9zdENvdW50OiBudW1iZXI7XG4gICAgICAgIHByaXZhdGUgX2N1cnJlbnRIb3N0SW5kZXg6IG51bWJlcjtcbiAgICAgICAgcHJpdmF0ZSBfY3VycmVudEhvc3ROYW1lOiBzdHJpbmc7XG5cbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgICAgc3VwZXIoJyNwcm9ncmVzcycpO1xuXG4gICAgICAgICAgICB0aGlzLl9ydW5CdXR0b24gPSBuZXcgUnVuQnV0dG9uKCk7XG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nTGFiZWwgPSBuZXcgUnVubmluZ0xhYmVsKCk7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnRFbGVtID0gbmV3IENvbXBvbmVudCgnI2hvc3RDb3VudCcpO1xuICAgICAgICAgICAgdGhpcy5faG9zdEluZGV4ID0gbmV3IENvbXBvbmVudCgnI2N1ckhvc3RJbmRleCcpO1xuICAgICAgICAgICAgdGhpcy5faG9zdE5hbWUgPSBuZXcgQ29tcG9uZW50KCcjaG9zdE5hbWUnKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzQmFyID0gbmV3IENvbXBvbmVudCgnI3Byb2dyZXNzQmFyJyk7XG4gICAgICAgICAgICB0aGlzLl9pY29uID0gbmV3IENvbXBvbmVudCgnI2ljb24nKTtcblxuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSAnJztcblxuICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG5cbiAgICAgICAgICAgIHRoaXMubGF5b3V0KCk7XG4gICAgICAgICAgICB0aGlzLmUuYWRkQ2xhc3MoJ2ZpeGVkJyk7XG5cbiAgICAgICAgICAgIHRoaXMuZS5jbGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlKHRydWUsICQuZnguc3BlZWRzLmZhc3QpO1xuICAgICAgICAgICAgICAgIGFwcC5yZXN1bHRzLmlzRGlydHkgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBwcm9ncmVzcygpOiBudW1iZXIge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2dyZXNzO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBob3N0Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ob3N0Q291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgcHVibGljIHNldCBob3N0Q291bnQodmFsdWU6IG51bWJlcikge1xuICAgICAgICAgICAgdGhpcy5faG9zdENvdW50ID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnRFbGVtLmUudGV4dCh2YWx1ZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2dyZXNzKHRoaXMuX2N1cnJlbnRIb3N0SW5kZXggLyB0aGlzLl9ob3N0Q291bnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBjdXJyZW50SG9zdEluZGV4KCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudEhvc3RJbmRleDtcbiAgICAgICAgfVxuICAgICAgICBwdWJsaWMgc2V0IGN1cnJlbnRIb3N0SW5kZXgodmFsdWU6IG51bWJlcikge1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5faG9zdEluZGV4LmUudGV4dCh2YWx1ZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmhvc3RDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2dyZXNzKHRoaXMuX2N1cnJlbnRIb3N0SW5kZXggLyB0aGlzLl9ob3N0Q291bnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBjdXJyZW50SG9zdE5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50SG9zdE5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcHVibGljIHNldCBjdXJyZW50SG9zdE5hbWUodmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3ROYW1lID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9ob3N0TmFtZS5lLnRleHQodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHNldCBlcnJvclRleHQodmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5lLmZpbmQoJy50ZXh0LWRhbmdlcicpLnRleHQodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHNldFN0YXR1cyhzdGF0dXM6IFByb2dyZXNzU3RhdHVzKSB7XG4gICAgICAgICAgICB0aGlzLmUuZmluZCgncCcpLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzQmFyLmUucmVtb3ZlQ2xhc3MoJ3Byb2dyZXNzLWJhci1kYW5nZXIgcHJvZ3Jlc3MtYmFyLXN1Y2Nlc3MnKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzQmFyLmUucGFyZW50KCkuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5lLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnZ2x5cGhpY29uLXJlZnJlc2ggZ2x5cGhpY29uLW9rLWNpcmNsZSBnbHlwaGljb24tZXhjbGFtYXRpb24tc2lnbicpO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHN0YXR1cykge1xuICAgICAgICAgICAgICAgIGNhc2UgUHJvZ3Jlc3NTdGF0dXMuRVJST1I6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZS5maW5kKCcudGV4dC1kYW5nZXInKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzQmFyLmUuYWRkQ2xhc3MoJ3Byb2dyZXNzLWJhci1kYW5nZXInKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5wYXJlbnQoKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ljb24uZS5maW5kKCcuZ2x5cGhpY29uJykuYWRkQ2xhc3MoJ2dseXBoaWNvbi1leGNsYW1hdGlvbi1zaWduJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUHJvZ3Jlc3NTdGF0dXMuU1VDQ0VTUzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lLmZpbmQoJy50ZXh0LXN1Y2Nlc3MnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzQmFyLmUuYWRkQ2xhc3MoJ3Byb2dyZXNzLWJhci1zdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzQmFyLmUucGFyZW50KCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pY29uLmUuZmluZCgnLmdseXBoaWNvbicpLmFkZENsYXNzKCdnbHlwaGljb24tb2stY2lyY2xlJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUHJvZ3Jlc3NTdGF0dXMuUlVOTklORzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lLmZpbmQoJ3AnKS5maXJzdCgpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faWNvbi5lLmZpbmQoJy5nbHlwaGljb24nKS5hZGRDbGFzcygnZ2x5cGhpY29uLXJlZnJlc2gnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgbGF5b3V0KCkge1xuICAgICAgICAgICAgLy9DZW50ZXIgcHJvZ3Jlc3Mgd2VsbCBob3Jpem9udGFsbHlcbiAgICAgICAgICAgIGlmICghdGhpcy5lLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lLmFkZENsYXNzKCdmaXhlZCcpLnNob3coKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVmdCA9ICQod2luZG93KS53aWR0aCgpIC8gMiAtIHRoaXMuZS53aWR0aCgpIC8gMjtcbiAgICAgICAgICAgICAgICB0aGlzLmUuY3NzKCdsZWZ0JyxsZWZ0ICsgJ3B4JykuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHVwZGF0ZSgpOiBQaW5reVN3ZWFyLlByb21pc2Uge1xuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBwaW5reVN3ZWFyKCksXG4gICAgICAgICAgICAgICAgdHJhY2tQcm9ncmVzczogSGVscGVycy5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICBkb1VwZGF0ZVByb2dyZXNzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFByb2dyZXNzKCkudGhlbigocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9ncmVzcyA9PT0gMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhY2tQcm9ncmVzcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFja1Byb2dyZXNzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlKGZhbHNlLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGFwcC5pc1J1bmF3YXlDaGVja1J1bm5pbmcgJiYgIWFwcC5pbml0QnlVc2VyKSB7XG4gICAgICAgICAgICAgICAgdHJhY2tQcm9ncmVzcyA9IEhlbHBlcnMuaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBkb1VwZGF0ZVByb2dyZXNzKCk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICAgICAgZG9VcGRhdGVQcm9ncmVzcygpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcnVuQnV0dG9uLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nTGFiZWwuc2hvdygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhcHAuaXNSdW5hd2F5Q2hlY2tSdW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVuQnV0dG9uLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nTGFiZWwuc2hvdygpO1xuICAgICAgICAgICAgICAgIEhlbHBlcnMuZGVsYXkoMjUwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93KHRydWUsICQuZnguc3BlZWRzLmZhc3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW10pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5CdXR0b24uc2hvdygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmdMYWJlbC5oaWRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlKHRydWUsIDMwMCk7XG4gICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHJlc2V0KCkge1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSAnJztcbiAgICAgICAgICAgIHRoaXMuX3J1bm5pbmdMYWJlbC5wcm9ncmVzcyA9IHRoaXMuX3Byb2dyZXNzO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5jc3MoJ3dpZHRoJywnMCUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgdXBkYXRlUHJvZ3Jlc3MocHJvZ3Jlc3M6IG51bWJlcikge1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSBwcm9ncmVzcztcbiAgICAgICAgICAgIHRoaXMuX3J1bm5pbmdMYWJlbC5wcm9ncmVzcyA9IHByb2dyZXNzO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3NCYXIuZS5jc3MoJ3dpZHRoJywnJyArIChwcm9ncmVzcyAqIDEwMCkudG9GaXhlZCgwKSArICclJyk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGdldFByb2dyZXNzKCk6IFBpbmt5U3dlYXIuR2VuZXJpY1Byb21pc2U8bnVtYmVyPiB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXI8bnVtYmVyPigpO1xuXG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogJ3Byb2dyZXNzLnR4dCcsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gcmVzcG9uc2Uuc3BsaXQoJ1xcbicpWzBdLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVsxXSA9PT0gXCJkb25lXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaG9zdENvdW50ID0gcGFyc2VJbnQocmVzcG9uc2VbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9zdEluZGV4ID0gdGhpcy5ob3N0Q291bnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgWzEuMF0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9zdE5hbWUgPSByZXNwb25zZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gcmVzcG9uc2VbMF0uc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2hvc3RDb3VudCA9IHBhcnNlSW50KHJlc3BvbnNlWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEhvc3RJbmRleCA9IHBhcnNlSW50KHJlc3BvbnNlWzBdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbdGhpcy5wcm9ncmVzc10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UoZmFsc2UsIFswLjBdKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAndGV4dCdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIm1vZHVsZSBSdW5hd2F5IHtcblxuICAgIGV4cG9ydCBjbGFzcyBSZXN1bHRzIGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgICAgICAgcHJpdmF0ZSBfbm9SZXN1bHRzOiBDb21wb25lbnQ7XG4gICAgICAgIHByaXZhdGUgX3J1blRpbWU6IENvbXBvbmVudDtcblxuICAgICAgICBwcml2YXRlIF9ydW5EYXRlOiBzdHJpbmc7XG4gICAgICAgIHByaXZhdGUgX2lzRGlydHk6IGJvb2xlYW47XG5cbiAgICAgICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICAgICAgc3VwZXIoJyNyZXN1bHRzJyk7XG5cbiAgICAgICAgICAgIHRoaXMuX25vUmVzdWx0cyA9IG5ldyBDb21wb25lbnQoJyNub1Jlc3VsdHMnKTtcbiAgICAgICAgICAgIHRoaXMuX3J1blRpbWUgPSBuZXcgQ29tcG9uZW50KCcjcnVuVGltZScpO1xuXG4gICAgICAgICAgICB0aGlzLl9ydW5EYXRlID0gJyc7XG4gICAgICAgICAgICB0aGlzLl9pc0RpcnR5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBsYXN0UnVuRGF0ZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ydW5EYXRlO1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgbGFzdFJ1bkRhdGUodmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5fcnVuRGF0ZSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fcnVuVGltZS5lLnRleHQodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBpc0RpcnR5KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzRGlydHk7XG4gICAgICAgIH1cbiAgICAgICAgcHVibGljIHNldCBpc0RpcnR5KHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUuYWRkQ2xhc3MoJ2RpcnR5Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9SZXN1bHRzLmhpZGUodHJ1ZSwgJC5meC5zcGVlZHMuZmFzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZS5yZW1vdmVDbGFzcygnZGlydHknKTtcbiAgICAgICAgICAgICAgICBpZiAoYXBwLnByb2dyZXNzLmhvc3RDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ub1Jlc3VsdHMuc2hvdyh0cnVlLCAkLmZ4LnNwZWVkcy5mYXN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgdXBkYXRlKCk6IFBpbmt5U3dlYXIuUHJvbWlzZSB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXIoKTtcblxuICAgICAgICAgICAgdGhpcy5pc0RpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZ2V0UmVzdWx0cygpLnRoZW4oKHJlc3VsdHM6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyc2UocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0RpcnR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgSGVscGVycy5kZWxheSgyMjUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3codHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW10pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBnZXRSZXN1bHRzKCk6IFBpbmt5U3dlYXIuR2VuZXJpY1Byb21pc2U8c3RyaW5nPiB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IHBpbmt5U3dlYXI8c3RyaW5nPigpO1xuXG4gICAgICAgICAgICAkLmdldCgncmVzdWx0cy50eHQnLCBmdW5jdGlvbihyZXNwb25zZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZSh0cnVlLCBbcmVzcG9uc2VdKTtcbiAgICAgICAgICAgIH0sICd0ZXh0L3BsYWluJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBwYXJzZShyZXN1bHRzOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHZhciBob3N0czogc3RyaW5nW10gPSByZXN1bHRzLnNwbGl0KCdcXG5cXG4nKSxcbiAgICAgICAgICAgICAgICBkYXRlOiBzdHJpbmcgPSBob3N0cy5zaGlmdCgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fcnVuVGltZS5lLnRleHQoKSA9PT0gJ25ldmVyJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1blRpbWUuZS50ZXh0KGRhdGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL0NsZWFyIHJlc3VsdHNcbiAgICAgICAgICAgIHRoaXMuZS5lbXB0eSgpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBoID0gMDsgaCA8IGhvc3RzLmxlbmd0aDsgaCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmVzOiBzdHJpbmdbXSA9IGhvc3RzW2hdLnNwbGl0KCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWV0YTogc3RyaW5nW10gPSBsaW5lcy5zaGlmdCgpLnNwbGl0KCcgJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgaG9zdDogWmVwdG9Db2xsZWN0aW9uID0gJCgnPGRpdj4nKS5hZGRDbGFzcygnaG9zdCB3ZWxsJyk7XG4gICAgICAgICAgICAgICAgdmFyIGhlYWRlcjogWmVwdG9Db2xsZWN0aW9uID0gJCgnPGgzPicpLnRleHQobWV0YVswXSArICcgJykuYXBwZW5kKCQoJzxzbWFsbD4nKS50ZXh0KG1ldGFbMV0pKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvY2Vzc2VzOiBaZXB0b0NvbGxlY3Rpb24gPSAkKCc8ZGl2PicpLmFkZENsYXNzKCdwcm9jZXNzZXMgdGFibGUtcmVzcG9uc2l2ZScpO1xuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vTWFrZSB0YWJsZVxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFibGU6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzx0YWJsZT4nKS5hZGRDbGFzcygndGFibGUgdGFibGUtc3RyaXBlZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlYWQ6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzx0aGVhZD4nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRib2R5OiBaZXB0b0NvbGxlY3Rpb24gPSAkKCc8dGJvZHk+Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoZWFkLmFwcGVuZCgkKCc8dHI+JykuYXBwZW5kKCc8dGQ+UElEPC90ZD4nKS5hcHBlbmQoJzx0ZD5Db21tYW5kPC90ZD4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPHRkPlVzZXI8L3RkPicpLmFwcGVuZCgnPHRkPkNQVSBVc2FnZTwvdGQ+JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzx0ZD5SQU0gVXNhZ2U8L3RkPicpLmFwcGVuZCgnPHRkPkNQVSBUaW1lPC90ZD4nKSk7XG4gICAgICAgICAgICAgICAgICAgIC8vV2hldGhlciBvciBub3QgdG8gc2hvdyBhIHdhcm5pbmdcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdhcm5pbmcgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmdSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy9QYXJzZSByb3dzXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb3c6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzx0cj4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xzOiBzdHJpbmdbXSA9IGxpbmVzW2ldLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sQ291bnQ6IG51bWJlciA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB2ID0gMDsgdiA8IGNvbHMubGVuZ3RoOyB2KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sc1t2XS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbENvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2w6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzx0ZD4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQ6IHN0cmluZyA9IGNvbHNbdl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50VmFsOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9Gb3JtYXQgQ1BVIHVzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xDb3VudCA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFZhbCA9IHBhcnNlRmxvYXQoY29sc1t2XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudFZhbCA+PSAyMC4wKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnRWYWwgPj0gNDAuMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50VmFsICUgMSA9PT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9ICcnICsgY29udGVudFZhbC50b0ZpeGVkKDApICsgJyUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gJycgKyBjb250ZW50VmFsLnRvRml4ZWQoMSkgKyAnJSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9Gb3JtYXQgUkFNIHVzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbENvdW50ID09PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50VmFsID0gcGFyc2VGbG9hdChjb2xzW3ZdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50VmFsID09PSAwLjApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sLnRleHQoY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5hcHBlbmQoY29sKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0Ym9keS5hcHBlbmQocm93KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL1Nob3cgd2FybmluZyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdhcm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBnbHlwaDogWmVwdG9Db2xsZWN0aW9uID0gJCgnPHNwYW4+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnbHlwaC5hZGRDbGFzcygnZ2x5cGhpY29uIGdseXBoaWNvbi13YXJuaW5nLXNpZ24gcHVsbC1yaWdodCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdhcm5pbmdSZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2x5cGgudG9nZ2xlQ2xhc3MoJ2dseXBoaWNvbi13YXJuaW5nLXNpZ24gZ2x5cGhpY29uLWV4Y2xhbWF0aW9uLXNpZ24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlci5hcHBlbmQoZ2x5cGgpO1xuICAgICAgICAgICAgICAgICAgICB9IC8vVE9ETzogU2hvdyB0aGUgZ3JlZW4gYWxsIGdvb2QgY2hlY2sgbWFyaywgb3RoZXJ3aXNlP1xuXG4gICAgICAgICAgICAgICAgICAgIHRhYmxlLmFwcGVuZCh0aGVhZCk7XG4gICAgICAgICAgICAgICAgICAgIHRhYmxlLmFwcGVuZCh0Ym9keSk7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3Nlcy5hcHBlbmQodGFibGUpO1xuICAgICAgICAgICAgICAgICAgICBob3N0LmFwcGVuZChoZWFkZXIpO1xuICAgICAgICAgICAgICAgICAgICBob3N0LmFwcGVuZChwcm9jZXNzZXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmUuYXBwZW5kKGhvc3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9SZW1vdmUgZW1wdHkgcm93c1xuICAgICAgICAgICAgdGhpcy5lLmZpbmQoJ3RyOmVtcHR5JykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIC8vQ291bnQgZGFuZ2VycyBhbmQgd2FybmluZ3NcbiAgICAgICAgICAgIHZhciBudW1EYW5nZXJzOiBudW1iZXIgPSB0aGlzLmUuZmluZCgnLmdseXBoaWNvbi1leGNsYW1hdGlvbi1zaWduJykuc2l6ZSgpO1xuICAgICAgICAgICAgdmFyIG51bVdhcm5pbmdzOiBudW1iZXIgPSB0aGlzLmUuZmluZCgnLmdseXBoaWNvbi13YXJuaW5nLXNpZ24nKS5zaXplKCk7XG4gICAgICAgICAgICBpZiAobnVtV2FybmluZ3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdhcm5pbmdBbGVydCA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC13YXJuaW5nXCI+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQ6IHN0cmluZyA9IFwiPHN0cm9uZz5IZWFkcyB1cCE8L3N0cm9uZz4gVGhlcmVcIjtcbiAgICAgICAgICAgICAgICBjb250ZW50ICs9IChudW1XYXJuaW5ncyA9PT0gMSA/IFwiJ3Mgc29tZXRoaW5nIGZpc2h5XCIgOiBcIiBhcmUgXCIgKyBudW1XYXJuaW5ncyArXG4gICAgICAgICAgICAgICAgICAgIFwiIChvciBtb3JlKSByZXNvdXJjZSBob2dzXCIpICsgXCIgb3V0IHRoZXJlLlwiO1xuICAgICAgICAgICAgICAgIHdhcm5pbmdBbGVydC5odG1sKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZS5wcmVwZW5kKHdhcm5pbmdBbGVydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobnVtRGFuZ2VycyA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgZGFuZ2VyQWxlcnQ6IFplcHRvQ29sbGVjdGlvbiA9ICQoJzxkaXY+JykuYWRkQ2xhc3MoJ2FsZXJ0IGFsZXJ0LWRhbmdlcicpO1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50OiBzdHJpbmcgPSBcIjxzdHJvbmc+T2ggc25hcCE8L3N0cm9uZz4gVGhlcmUgXCI7XG4gICAgICAgICAgICAgICAgY29udGVudCArPSAobnVtRGFuZ2VycyA9PT0gMSA/IFwiaXMgb25lIGRhbmdlciBcIiA6IFwiYXJlIFwiICsgbnVtRGFuZ2VycyArIFwiIGRhbmdlcnMgXCIpICsgXCIgbHVya2luZy5cIjtcbiAgICAgICAgICAgICAgICBkYW5nZXJBbGVydC5odG1sKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZS5wcmVwZW5kKGRhbmdlckFsZXJ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9HaXZlIHRoZSB1c2VyJ3MgbmFtZXNcbiAgICAgICAgICAgIHRoaXMuZS5maW5kKCd0Ym9keSA+IHRyID4gdGQ6bnRoLWNoaWxkKDMpJykubW91c2VlbnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW06IFplcHRvQ29sbGVjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgaWYgKCFlbGVtLmF0dHIoJ3RpdGxlJykgJiYgIWVsZW0uYXR0cignZGF0YS11bmtub3duJykpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5nZXQoJ2Zpbmdlci5zY3JpcHQ/dXNlcj0nICsgZWxlbS50ZXh0KCksIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSAocmVzcG9uc2UgPyByZXNwb25zZSA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaGluZ1VzZXJuYW1lcyA9ICQoJ3RkOm50aC1jaGlsZCgzKScpLmZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcykudGV4dCgpID09PSBlbGVtLnRleHQoKTt9XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdVc2VybmFtZXMuYXR0cigndGl0bGUnLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBibGlwID0gJCgnPHNwYW4+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxpcC5hZGRDbGFzcygnZ2x5cGhpY29uIGdseXBoaWNvbi1xdWVzdGlvbi1zaWduIHB1bGwtcmlnaHQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibGlwLmF0dHIoJ3RpdGxlJywnVW5rbm93biB1c2VyLCBwcm9iYWJseSBzcGVjaWZpYyB0byBhbiBhcHBsaWNhdGlvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nVXNlcm5hbWVzLmF0dHIoJ2RhdGEtdW5rbm93bicsICd0cnVlJykuYXBwZW5kKGJsaXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCAndGV4dC9wbGFpbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwibW9kdWxlIFJ1bmF3YXkge1xuXG4gICAgZXhwb3J0IGNsYXNzIFJ1bkJ1dHRvbiBleHRlbmRzIENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgICAgIHN1cGVyKCcjcnVuJyk7XG5cbiAgICAgICAgICAgIHRoaXMuX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuZS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYXBwLnJ1bigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGRpc2FibGVkKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkO1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc2FibGVkID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUuYXR0cignZGlzYWJsZWQnLCAnJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwibW9kdWxlIFJ1bmF3YXkge1xuXG4gICAgZXhwb3J0IGNsYXNzIFJ1bm5pbmdMYWJlbCBleHRlbmRzIENvbXBvbmVudCB7XG4gICAgICAgIHByaXZhdGUgX3BlcmNlbnRFbGVtOiBDb21wb25lbnQ7XG5cbiAgICAgICAgcHJpdmF0ZSBfcHJvZ3Jlc3M6IG51bWJlcjtcblxuICAgICAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgICAgICBzdXBlcignI3J1bm5pbmcnKTtcblxuICAgICAgICAgICAgdGhpcy5fcGVyY2VudEVsZW0gPSBuZXcgQ29tcG9uZW50KCcjcnVubmluZ1BlcmNlbnQnKTtcbiAgICAgICAgICAgIHRoaXMuX3BlcmNlbnRFbGVtLmhpZGUoKTtcblxuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG5cbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGdldCBwcm9ncmVzcygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wcm9ncmVzcztcbiAgICAgICAgfVxuICAgICAgICBwdWJsaWMgc2V0IHByb2dyZXNzKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IDAuMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BlcmNlbnRFbGVtLmhpZGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhcHAuaW5pdEJ5VXNlcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wZXJjZW50RWxlbS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGVyY2VudEVsZW0uZS50ZXh0KCcoJyArICh2YWx1ZSAqIDEwMCkudG9GaXhlZCgwKSArICclKScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BlcmNlbnRFbGVtLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJtb2R1bGUgUnVuYXdheS5TZXJ2aWNlcyB7XG5cbiAgICBleHBvcnQgY2xhc3MgUHJvZ3Jlc3Mge1xuICAgICAgICBwcml2YXRlIGV2ZW50czogQnJpZGdlO1xuICAgICAgICBwcml2YXRlIF9wcm9ncmVzczogbnVtYmVyO1xuICAgICAgICBwcml2YXRlIF9ob3N0Q291bnQ6IG51bWJlcjtcbiAgICAgICAgcHJpdmF0ZSBfY3VycmVudEhvc3RJbmRleDogbnVtYmVyO1xuICAgICAgICBwcml2YXRlIF9jdXJyZW50SG9zdE5hbWU6IHN0cmluZztcblxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEJyaWRnZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IHByb2dyZXNzKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJvZ3Jlc3M7XG4gICAgICAgIH1cbiAgICAgICAgc2V0IHByb2dyZXNzKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy50cmlnZ2VyKFwicHJvcGVydHlDaGFuZ2VkXCIsIHtwcm9wZXJ0eTogXCJwcm9ncmVzc1wifSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGhvc3RDb3VudCgpOiBudW1iZXIge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hvc3RDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBwdWJsaWMgc2V0IGhvc3RDb3VudCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXIoXCJwcm9wZXJ0eUNoYW5nZWRcIiwge3Byb3BlcnR5OiBcImhvc3RDb3VudFwifSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZ2V0IGN1cnJlbnRIb3N0SW5kZXgoKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50SG9zdEluZGV4O1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgY3VycmVudEhvc3RJbmRleCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdEluZGV4ID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy50cmlnZ2VyKFwicHJvcGVydHlDaGFuZ2VkXCIsIHtwcm9wZXJ0eTogXCJjdXJyZW50SG9zdEluZGV4XCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBnZXQgY3VycmVudEhvc3ROYW1lKCk6IHN0cmluZyB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudEhvc3ROYW1lO1xuICAgICAgICB9XG4gICAgICAgIHB1YmxpYyBzZXQgY3VycmVudEhvc3ROYW1lKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRIb3N0TmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwiY3VycmVudEhvc3ROYW1lXCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IEJyaWRnZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHJlc2V0KCkge1xuICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEhvc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SG9zdE5hbWUgPSAnJztcblxuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwicHJvZ3Jlc3NcIn0pO1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwiaG9zdENvdW50XCJ9KTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXIoXCJwcm9wZXJ0eUNoYW5nZWRcIiwge3Byb3BlcnR5OiBcImN1cnJlbnRIb3N0SW5kZXhcIn0pO1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcInByb3BlcnR5Q2hhbmdlZFwiLCB7cHJvcGVydHk6IFwiY3VycmVudEhvc3ROYW1lXCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB1cGRhdGUoKTogUGlua3lTd2Vhci5Qcm9taXNlIHtcbiAgICAgICAgICAgIHZhciBwcm9taXNlID0gcGlua3lTd2VhcigpLFxuICAgICAgICAgICAgICAgIHRyYWNrUHJvZ3Jlc3M6IEhlbHBlcnMuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgZG9VcGRhdGVQcm9ncmVzcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQcm9ncmVzcygpLnRoZW4oKHByb2dyZXNzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvZ3Jlc3MgPT09IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrUHJvZ3Jlc3MuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlKHRydWUsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhY2tQcm9ncmVzcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZShmYWxzZSwgW10pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoYXBwLmlzUnVuYXdheUNoZWNrUnVubmluZyAmJiAhYXBwLmluaXRCeVVzZXIpIHtcbiAgICAgICAgICAgICAgICB0cmFja1Byb2dyZXNzID0gSGVscGVycy5pbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvVXBkYXRlUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICBkb1VwZGF0ZVByb2dyZXNzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBnZXRQcm9ncmVzcygpOiBQaW5reVN3ZWFyLkdlbmVyaWNQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBwaW5reVN3ZWFyPG51bWJlcj4oKTtcblxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6ICdwcm9ncmVzcy50eHQnLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHJlc3BvbnNlLnNwbGl0KCdcXG4nKVswXS5zcGxpdCgnICcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VbMV0gPT09IFwiZG9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhvc3RDb3VudCA9IHBhcnNlSW50KHJlc3BvbnNlWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEhvc3RJbmRleCA9IHRoaXMuaG9zdENvdW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlKHRydWUsIFsxLjBdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEhvc3ROYW1lID0gcmVzcG9uc2VbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHJlc3BvbnNlWzBdLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ob3N0Q291bnQgPSBwYXJzZUludChyZXNwb25zZVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3N0SW5kZXggPSBwYXJzZUludChyZXNwb25zZVswXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UodHJ1ZSwgW3RoaXMucHJvZ3Jlc3NdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlKGZhbHNlLCBbMC4wXSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3RleHQnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=