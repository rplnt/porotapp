var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;

var App = {
    defaultStartTime: new Date('2017-05-20T16:00:00.000+02:00'),
    defaultCount: 50,  // also equals limit
    year: new Date().getFullYear(),
    sessionsKey: 'PBBSessions' + this.year,
};

$(function() {
    $('body').fill([EE('div', {id: 'header'}), EE('div', {id: 'app'})]);

    App.Init();
    
});


(function(app) {
    var currentSessionKey;
    var currentStopName;

    app.Init = function() {
        changePage('Session Manager');
        currentSessionKey = null;
        currentStopName = null;

        /* Select session */
        var sessions = JSON.parse(localStorage.getItem(app.sessionsKey));
        if (sessions) {
            for (var i = sessions.length - 1; i >= 0; i--) {
                $('#app').add(getButton('Resume Session', sessions[i].name, openSession, [sessions[i].key]));
            }
        }

        $('#app').add(getSubsection());
        $('#app').add(getButton('Start New Session', '', startNewSession, []));
    };


    function changePage(title) {
        // location.hash = '#' + hash;
        $('#header').fill(title);
        $('#app').fill();
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


    function saveSessionData(key, value, overwrite) {
        overwrite = (typeof overwrite !== 'undefined') ?  overwrite : true;
        var sessionObj = JSON.parse(localStorage.getItem(currentSessionKey));

        if (!sessionObj[key] || overwrite) {
            sessionObj[key] = value;
            console.log(sessionObj[key]);
            localStorage.setItem(currentSessionKey, JSON.stringify(sessionObj));
        }
    }


    function openSession(key) {
        var data = JSON.parse(localStorage.getItem(key));
        if (data === null) {
            changePage('Error');
            $('#app').add(getButton('Home', '', app.Init, []));
            return;
        }

        currentSessionKey = key;

        if (!data.teams) {
            saveSessionData('teams', GetTeams(), false);
        }

        if (!data.stop) {
            stopSelection();
        } else {
            currentStopName = data.stop;
            runProgress();
        }
    }


    function GetTeams() {
        console.log('Loading teams...');
        var teams = [];
        for (var i = 0; i < startlist.length; i++) {
            var team = {
                id: startlist[i].id,
                name: startlist[i].name,
                timeIn: null,
                timeOut: null
            };

            teams.push(team);
        }

        console.log('Loaded ' + teams.length + ' teams');

        return teams;
    }


    function runProgress() {
        changePage(currentStopName);

        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        // add team
        $('#app').add(getButton('Add Team', data.startedCount - teamCategoryCount(true, false) + ' out of ' + data.startedCount + ' teams remaining', viewUnvisitedTeamList, []));

        if (data.teams !== undefined && data.teams !== null) {
            $('#app').add(getSubsection('Drinking (' + teamCategoryCount(true, false) + ')'));

            // "active" teams
            for (var i = 0; i < data.teams.length; i++) {
                if (data.teams[i].timeIn !== null && data.teams[i].timeOut === null) {
                    $('#app').add(getButton(data.teams[i].id, data.teams[i].name, teamEnd, [i, data.teams[i].id]));
                }
            }

        }


        $('#app').add(getSubsection());
        $('#app').add(getButton('', 'Session Settings', configCurrentSession, []));
        $('#app').add(getButton('', 'Home', App.Init, []));
    }


    function teamCategoryCount(entered, left) {
        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        var categoryCount = 0;
        for (var i = 0; i < data.teams.length; i++) {
            if (entered === true && data.teams[i].timeIn !== null) {
                categoryCount++;
            }
            if (left === true && data.teams[i].timeOut !== null) {
                categoryCount++;
            }
        }

        return categoryCount;
    }


    function viewUnvisitedTeamList() {
        changePage('Add team');
        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        for (var i = 0; i < data.teams.length; i++) {
            if (data.teams[i].timeIn !== null) continue;
            $('#app').add(getButton(data.teams[i].id, data.teams[i].name, teamStart, [i, data.teams[i].id]));
        }

        $('#app').add(getButton('', 'Back', app.Init, []));
    }


    function teamStart(index, teamId) {
        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        if (data.teams[index].id != teamId) {
            console.log('Error');
            return;
        }

        data.teams[index].timeIn = new Date();
        saveSessionData('teams', data.teams, true);

        runProgress();
    }


    function teamEnd(index, teamId) {
        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        if (data.teams[index].id != teamId) {
            console.log('Error');
            return;
        }

        data.teams[index].timeOut = new Date();
        saveSessionData('teams', data.teams, true);

        runProgress();
    }


    function configCurrentSession() {
        changePage('Session Settings');
        var data = JSON.parse(localStorage.getItem(currentSessionKey));
        $('#app').add(getSubsection());

        // start count
        $('#app').add(getSubsection('Teams'));
        var teamCountInput = EE('input', {'type': 'text'}).set('value', data.startedCount?data.startedCount:app.defaultCount);
        teamCountInput.onChange(function(input) {
            saveSessionData('startedCount', input, true);
        });
        $('#app').add(teamCountInput);

        // start time

        $('#app').add(getSubsection('Start Time'));

        var startTimeInput = EE('input', {'type': 'text'}).set('value', _.formatValue('HH:mm', data.startedTime?(new Date(data.startedTime)):app.defaultStartTime));
        startTimeInput.onChange(function(input) {
            startTime = _.parseDate('YYMMdd HH:mm', _.formatValue('YYMMdd', app.defaultStartTime) + ' ' + input);
            if (startTime !== null && startTime !== undefined) {
                saveSessionData('startedTime', startTime, true);
            }
        });
        $('#app').add(startTimeInput);

        $('#app').add(getSubsection());


        // dump to json
        $('#app').add(getButton('', 'Dump current session to json', dumpCurrentSession, [currentSessionKey]));


        // remove
        $('#app').add(getButton('', 'Remove Session', deleteSessionConfirm, [currentSessionKey]));

        // back!
        $('#app').add(getSubsection());
        $('#app').add(getButton('', 'Back', runProgress, []));
    }


    function dumpCurrentSession(key) {
        var data = JSON.parse(localStorage.getItem(key));
        var strData = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 4));
        $('#app').add(EE('a', {'href': strData, 'download': key + '.json', id: 'json-download'}, ''));
        $$('#json-download').click();
    }


    function stopSelection() {
        changePage('Select stop');

        selectStop = function(stopName) {
            saveSessionData('stop', stopName);
            openSession(currentSessionKey);
        };

        for (var i = 0; i < stops.length; i++) {
            $('#app').add(getButton(stops[i], '', selectStop, [stops[i]]));
        }


        $('#app').add(getSubsection());
        $('#app').add(getButton('', 'Home', app.Init, []));
        // $('#app').add(getButton('', 'Remove Session', deleteSessionConfirm, [sessionKey]));
    }


    function deleteSessionConfirm(key) {
        changePage('Delete session "' + key + '"?');
        $('#app').add(getButton('Delete', 'This action cannot be reversed (maybe)', deleteSession, [key]));
        $('#app').add(getButton('', 'Home', app.Init, []));
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


    function getSubsection(title) {
        return EE('h4', {$: 'sub-header'}, title);
    }


    function getButton(header, body, callback, params) {
        var btn = EE('div', {$: 'btn'}, [EE('span', {$: 'btn-head'}, header), EE('span', {$: 'btn-body'}, body)]);
        if (callback !== null) {
            btn.onClick(callback, params);
        }

        return btn;
    }

})(App);