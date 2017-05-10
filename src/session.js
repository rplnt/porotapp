(function(app) {

    app.currentSessionKey = null;
    var currentStopName;
    var currentSessionStart;
    var headerTimeRepeater;

    app.Init = function() {
        app.changePage('Sessions');
        $('#header .name').fill('');
        app.currentSessionKey = null;
        currentStopName = false;
        currentSessionStart = null;

        if (headerTimeRepeater) {
            clearInterval(headerTimeRepeater);
            headerTimeRepeater = false;
            $('#header .timer').fill();
        }

        /* Select session */
        var sessions = JSON.parse(localStorage.getItem(app.sessionsKey));
        if (sessions) {
            for (var i = sessions.length - 1; i >= 0; i--) {
                $('#app').add(app.getButton('Resume Session', sessions[i].name, openSession, [sessions[i].key]));
            }
        }

        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('Start New Session', '', startNewSession, []));
    };


    function updateHeaderTimer() {
        var now = new Date();

        if (currentSessionStart !== null) {
            var diff = parseInt((now - new Date(currentSessionStart)) / 1000, 10);
            if (diff < 0)  {
                $('#header .timer').fill('T-' + app.Sec2MinSec(diff));
            } else if (diff/(60*60) > app.runDurationHours) {
                $('#header .timer').fill('💊');
            } else {
                $('#header .timer').fill(app.Sec2HrMinSec(diff));
            }
        }
    }


    function startNewSession() {
        var session = {};
        session.date = new Date();
        session.name = 'Started at ' + _.formatValue('dd.MM.YYYY h:mm:ss', session.date);
        session.key = 'PBB_SESS_' + Math.floor(session.date.getTime()/1000);

        var sessions = JSON.parse(localStorage.getItem(app.sessionsKey));

        if (sessions) {
            sessions.push(session);
        } else {
            sessions = [session];
        }

        localStorage.setItem(app.sessionsKey, JSON.stringify(sessions));
        localStorage.setItem(session.key, JSON.stringify({}));

        openSession(session.key);
    }



    function openSession(key) {
        var data = JSON.parse(localStorage.getItem(key));
        if (data === null) {
            app.changePage('Error');
            $('#app').add(app.getButton('Home', '', app.Init, []));
            return;
        }

        app.currentSessionKey = key;

        /* fill in defaults */
        if (!data.startedCount) app.saveSessionData('startedCount', startlist.length, false);
        if (!data.startedTime) {
            app.saveSessionData('startedTime', app.defaultStartTime, false);
            currentSessionStart = app.defaultStartTime;
        } else {
            currentSessionStart = data.startedTime;
        }
        if (!data.teams) app.saveSessionData('teams', [], false);
        if (!data.teams) app.saveSessionData('visitedTeams', {}, false);

        if (!data.stop) {
            stopSelection();
        } else {
            currentStopName = data.stop;
            $('#header .name').fill(currentStopName);
            headerTimeRepeater = setInterval(updateHeaderTimer, 1000);
            app.Local();
        }
    }


    function stopSelection() {
        app.changePage('Select stop');

        selectStop = function(stopName) {
            app.saveSessionData('stop', stopName);
            openSession(app.currentSessionKey);
        };

        for (var i = 0; i < stops.length; i++) {
            $('#app').add(app.getButton(stops[i], '', selectStop, [stops[i]]));
        }


        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('', 'Home', app.Init, []));
        // $('#app').add(app.getButton('', 'Remove Session', deleteSessionConfirm, [sessionKey]));
    }



    /* CONFIG */
    app.configCurrentSession = function() {
        app.changePage('Settings');
        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));

        // start count
        $('#app').add(app.getSubsection('Teams'));
        var teamCountInput = EE('input', {$: 'option-input', 'type': 'text'}).set('value', data.startedCount);
        teamCountInput.onChange(function(input) {
            app.saveSessionData('startedCount', input, true);
        });
        $('#app').add(teamCountInput);

        // start time
        $('#app').add(app.getSubsection('Start Time'));

        var startTimeInput = EE('input', {$: 'option-input', 'type': 'text'}).set('value', _.formatValue('HH:mm', new Date(data.startedTime)));
        startTimeInput.onChange(function(input) {
            startTime = _.parseDate('YYMMdd HH:mm', _.formatValue('YYMMdd', new Date()) + ' ' + input);
            if (startTime !== null && startTime !== undefined) {
                app.saveSessionData('startedTime', startTime, true);
                currentSessionStart = startTime;
            }
        });
        $('#app').add(startTimeInput);

        $('#app').add(app.getSubsection());


        // dump to json
        $('#app').add(app.getButton('', 'Dump current session to json', dumpCurrentSession, [app.currentSessionKey]));


        // remove
        $('#app').add(app.getButton('', 'Remove Session', deleteSessionConfirm, [app.currentSessionKey]));

        // back!
        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('', 'Back', app.Local, []));
    };


    function dumpCurrentSession(key) {
        var data = JSON.parse(localStorage.getItem(key));
        var strData = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 4));
        $('#app').add(EE('a', {'href': strData, 'download': key + '.json', id: 'json-download'}, ''));
        $$('#json-download').click();
    }


    function deleteSessionConfirm(key) {
        app.changePage('Delete session "' + key + '"?');
        $('#app').add(app.getButton('Delete', 'This action cannot be reversed (maybe)', deleteSession, [key]));
        $('#app').add(app.getButton('', 'Home', app.Init, []));
    }


    function deleteSession(key) {
        var sessions = JSON.parse(localStorage.getItem(app.sessionsKey));

        for (var i = sessions.length - 1; i >= 0; i--) {
            if (sessions[i].key == key) {
                sessions.splice(i, 1);
                break;
            }
        }

        localStorage.setItem(app.sessionsKey, JSON.stringify(sessions));
        app.Init();
    }


    app.getCurrentSessionStart = function() {
        return currentSessionStart;
    };

})(App);