import Progress = require('./services/Progress');
import Application = require('./Application');

var services = {
    progress: new Progress()
};

var app = new Application();

services.progress.app = app;
