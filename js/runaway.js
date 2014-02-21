$(function () {

    //Bind rerun button
    $('#run').click(runScript);

    $('#progress').click(function () {
        $(this).fadeOut('fast');
        $('#results').removeClass('dirty');
    });

    //Hide/show shit
    $('#progress').hide();
    $('#results').hide();

    //Get, parse, and show previous results, if any
    $.get('results.txt', function(response){
        parseResults(response);
        $('#noResults').fadeOut('fast');
        delay(function () {
            $('#results').fadeIn();
        }, 225);
        $('#progress').addClass('fixed').show();
        var left = $(window).width() / 2 - $('#progress').width() / 2;
        $('#progress').css('left',left + 'px').hide();
    }, 'text/plain');
});

function parseResults(response) { 
    //Parse process tables
    var results = $('#results');
    var hosts = response.split('\n\n');
    var date = hosts.shift();
    var runTime = $('#runTime');
    if (runTime.text() === 'never')
        runTime.text(date);

    //Clear results
    results.empty()

    for (var h = 0; h < hosts.length; h++) {
        var lines = hosts[h].split('\n');
        var meta = lines.shift();
        meta = meta.split(' ');
        var host = $('<div class="host well">');
        var header = $('<h3>').text(meta[0] + ' ').append($('<small>').text(meta[1]));
        var processes = $('<div class="processes table-responsive">');
        if (lines.length > 1) {
            //Make table
            var table = $('<table class="table table-striped">');
            var thead = $('<thead>');
            var tbody = $('<tbody>');
            thead.append($('<tr>').append('<td>PID</td>').append('<td>Command</td>').append('<td>User</td>').append('<td>CPU Usage</td>').append('<td>RAM Usage</td>').append('<td>CPU Time</td>'));
            //Whether or not to show a warning
            var warning = false;
            var warningRed = false;
            //Parse rows
            for (var i = 0; i < lines.length; i++) {
                var row = $('<tr>');
                var cols = lines[i].split(' ');
                var colCount = 0;
                for (var v = 0; v < cols.length; v++) {
                    if (cols[v].length > 0) {
                        colCount++;
                        var col = $('<td>');
                        var content = cols[v];
                        var text = true;
                        //Format CPU usage
                        if (colCount === 4) {
                            content = parseFloat(content);
                            if (content >= 20.0)
                                warning = true;
                            if (content >= 35.0)
                                warningRed = true;
                            if (content % 1 === 0.0) {
                                content = '' + content.toFixed(0) + '%';
                            } else {
                                content = '' + content.toFixed(1) + '%';
                            }
                        }
                        //Format RAM usage
                        else if (colCount === 5) {
                            content = parseFloat(content);
                            if (content === 0.0)
                                content = "";
                        }
                        if (text)
                            col.text(content);
                        row.append(col);
                    }
                } 
                tbody.append(row);
            }
            //Show warning if necessary
            if (warning) {
                var glyph = $('<span class="glyphicon glyphicon-warning-sign pull-right"></span>');
                if (warningRed)
                    glyph.toggleClass('glyphicon-warning-sign glyphicon-exclamation-sign');
                header.append(glyph);
            }

            table.append(thead);
            table.append(tbody);
            processes.append(table);
            host.append(header);
            host.append(processes);
            results.append(host);
        }
    }

    //Remove empty rows
    results.find('tr:empty').remove();

    //Count dangers and warnings
    var numDangers = $('#results .glyphicon-exclamation-sign').size();
    var numWarnings = $('#results .glyphicon-warning-sign').size(); 
    if (numWarnings > 0) {
        var warningAlert = $('<div class="alert alert-warning">');
        var content = "<strong>Heads up!</strong> There";
        content += (numWarnings === 1 ? "'s something fishy" : " are " + numWarnings + " (or more) resource hogs") + " out there.";
        warningAlert.html(content);
        $('#results').prepend(warningAlert);
    }
    if (numDangers > 0) {
        var dangerAlert = $('<div class="alert alert-danger">');
        var content = "<strong>Oh snap!</strong> There ";
        content += (numDangers === 1 ? "is one danger " : "are " + numDangers + " dangers ") + " lurking.";
        dangerAlert.html(content);
        $('#results').prepend(dangerAlert);
    }

    //Give the user's names
    $('tbody > tr > td:nth-child(3)').on('mouseenter', function () {
        var elem = $(this);
        if (!elem.attr('title') && !elem.attr('data-unknown')) {
            $.get('finger.script?user=' + elem.text(), function (response) {
                response = (response ? response : false);
                var matchingElems = $('td').filter(function(){ return $(this).text() === elem.text();});
                if (response) {
                    matchingElems.attr('title',response);
                } else {
                    var blip = $('<span class="glyphicon glyphicon-question-sign pull-right">');
                    blip.attr('title','Unknown user, probably specific to an application');
                    matchingElems.attr('data-unknown','true').append(blip);
                }
            }, 'text/plain');
        }
    });
}

function runScript() {
    var progressWell = $('#progress');
    var curHostElem = $('#curHostIndex');
    var hostName = $('#hostName');
    var progressBar = $('#progressBar');
    var results = $('#results');

    var currentHost = 1.0;
    var hostCount = null;

    //Show progress
    $('#noResults').fadeOut('fast');
    if (progressWell.hasClass('fixed')) {
        results.removeAttr('style');
        results.addClass('dirty');
    }
        
    var keepGoing = true;
    
    $.ajax({
        url: 'run.script',
        async: false,
        success: function(response) {
            var response = response.split('\n');
            response = response[0];
            if (response === "error: running") {
                $('#progress .text-danger').text('Runaway! is currently performing a runaway check.');
                setProgressStatus('error');
                keepGoing = false;
            } else if (response === "error: no hosts") {
                $('#progress .text-danger').text('There are no hosts to check.');
                setProgressStatus('error');
                keepGoing = false;
            }
        },
        dataType: 'text'});
    
    if (!keepGoing) {
        progressWell.fadeIn('fast');
        $('#run').attr('disabled','');
        //Break from running script
        return;
    }
    
    Title.change('Running...');
    
    setProgressStatus('loading');
    progressBar.css('width','0%');
    delay(function () {
        progressWell.fadeIn('fast');
    }, 250);
    $('#run').attr('disabled','');

    //Do request
    var request = new XMLHttpRequest();
    //Completed handler
    request.onload = function () {
        //Check for errors
        var lines = request.responseText.split('\n');
        lines.pop();
        lines.pop();

        setProgressStatus('success');
        curHostElem.text(hostCount);
        progressBar.css('width','100%');
        delay(function () {
            progressWell.fadeOut(300);
            results.fadeOut(300);
            delay(function () {
                //Center progress well horizontally
                if (!progressWell.hasClass('fixed')) {
                    progressWell.addClass('fixed').show();
                    var left = $(window).width() / 2 - progressWell.width() / 2;
                    progressWell.css('left',left + 'px').hide();
                }
                //Get, parse, and show results
                $.get('results.txt', function(response) {
                    parseResults(response);
                    results.removeClass('dirty').fadeIn();
                    $('#run').removeAttr('disabled');
                }, 'text/plain');
            }, 500);
        }, 700);
        Title.change();
    };
    request.onprogress = function () {
        //Parse progress
        var response = request.responseText;
        var lines = response.split('\n');
        //Remove junk line
        lines.pop();
        //Get metadata if needed
        if (!hostCount) {
            var meta = lines[0].split('|');
            hostCount = parseInt(meta[0]);
            var date = meta[1];
            //Update labels
            $('#runTime').text(date);
            $('#hostCount').text(hostCount);
            curHostElem.text(currentHost.toFixed(0));
        }
        //Update progress
        if (lines.length > 2) {
            //Update labels and progress
            if (lines.length > 3)
                currentHost += 1.0;
            hostName.text(lines[lines.length - 1]);
            curHostElem.text(currentHost.toFixed(0));
            progressBar.css('width', ((currentHost / hostCount) * 100).toFixed(0) + '%');
        }
    };
    request.open("get", "runaway.script", true);
    delay(function () {
        request.send();
    }, 200);
}

function setProgressStatus(status) {
    var progressWell = $('#progress');
    var progressBar = $('#progressBar');
    var icon = $('#icon');

    progressWell.find('p').hide();
    progressBar.removeClass('progress-bar-danger progress-bar-success');
    progressBar.parent().show();
    icon.find('span').removeClass('glyphicon-ok-circle glyphicon-exclamation-sign'); 

    if (status === 'error') {
        progressWell.find('.text-danger').show();
        progressBar.addClass('progress-bar-danger');
        progressBar.parent().hide();
        icon.find('img').hide();
        icon.find('span').addClass('glyphicon-exclamation-sign');
        icon.find('span').show();
    } else if (status === 'success') {
        progressWell.find('.text-success').show();
        progressBar.addClass('progress-bar-success');
        progressBar.parent().hide();
        icon.find('img').hide();
        icon.find('span').addClass('glyphicon-ok-circle');
        icon.find('span').show();
    } else {
        progressWell.find('p').first().show();
        icon.find('span').hide();
        icon.find('img').show();
    }
}

//Delay utility function
function delay(func, time) {
    setTimeout(func, time);
}

//Title changer helper singleton
var Title = {
    oldTitle: $('title').text(),
    change: function (newTitle) {
        newTitle = (newTitle === undefined ? Title.oldTitle : newTitle);
        $('title').text(newTitle);
    }
};
