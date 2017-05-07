var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;

var App = {
    defaultStartTime: new Date('2017-05-04T16:00:00.000+02:00'),
    defaultCount: 50,
    year: new Date().getFullYear(),
    sessionsKey: 'PBBSessions' + this.year,
};

$(function() {
    $('body').fill([
        EE('div', {id: 'header'}, [
            EE('span', {$: 'title'}),
            EE('span', {$: 'timer'})
        ]),
        EE('div', {id: 'app'})
    ]);

    App.Init();
    
});


(function(app) {
    var currentSessionKey;
    var currentStopName;
    var currentSessionStart;
    var timeRepeater;

    app.Init = function() {
        changePage('Session Manager');
        currentSessionKey = null;
        currentStopName = false;
        currentSessionStart = null;

        if (timeRepeater) {
            clearInterval(timeRepeater);
            timeRepeater = false;
        }

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
        $('#header .title').fill(title);
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
            // console.log(sessionObj[key]);
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

        /* fill in defaults */
        if (!data.startedCount) saveSessionData('startedCount', app.defaultCount, false);
        if (!data.startedTime) {
            saveSessionData('startedTime', app.defaultStartTime, false);
            currentSessionStart = app.defaultStartTime;
        } else {
            currentSessionStart = data.startedTime;
        }
        if (!data.teams) saveSessionData('teams', [], false);
        if (!data.teams) saveSessionData('visitedTeams', {}, false);

        if (!data.stop) {
            stopSelection();
        } else {
            currentStopName = data.stop;
            timeRepeater = setInterval(updateTimers, 1000);
            runProgress();
        }
    }


    function GetTeamObj(team) {
        return {
            id: team.id,
            name: team.name.substring(0, 20),
            timeIn: null,
            timeOut: null
        };
    }


    function runProgress() {
        changePage(currentStopName);

        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        // add team
        $('#app').add(getButton('⨭Add Team', data.startedCount - teamCategoryCount(true, true) + ' out of ' + data.startedCount + ' teams remaining', addNewTeam, []));

        if (data.teams !== undefined && data.teams !== null) {
            $('#app').add(getSubsection('Drinking (' + teamCategoryCount(true, false) + ')'));
            $('#app').add(getTeamList(LIST_MODE.active));
        }


        $('#app').add(getSubsection());
        $('#app').add(getButton('', 'Visited list (' + teamCategoryCount(false, true) + ')', displayTeamListPage, ['Teams Visited', LIST_MODE.past]));
        $('#app').add(getSubsection());
        $('#app').add(getButton('', 'Session Settings', configCurrentSession, []));
        $('#app').add(getButton('', 'Home', App.Init, []));

        updateTimers();
    }

    /* Time Helpers */
    function ClockOClock(hour) {
        var clocks = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗',  '🕘',  '🕙',  '🕚'];
        return clocks[Math.floor(hour) % 12];
    }

    function Sec2Min(seconds) {
        return Math.floor(seconds/60);
    }

    function Sec2Sec(seconds) {
        var minutes = Math.floor(seconds/60);
        return _.pad(2, seconds - (minutes * 60));
    }

    function Sec2MinSec(seconds) {
        var stamp = ClockOClock(seconds);
        if (Sec2Min(seconds) > 0) {
            stamp += (Sec2Min(seconds) + 'm ');
        }

        return stamp + Sec2Sec(seconds) + 's';
    }


    function updateTimers() {
        var now = new Date();

        /* header */
        if (currentSessionStart !== null) {
            var diff = parseInt((now - new Date(currentSessionStart)) / 1000, 10);
            var minutes = Math.floor(diff/60);
            if (minutes < 0)  {
                minutes = Math.abs(minutes);
                $('#header .timer').set('innerHTML', 'Starts in ' + minutes + ' minute' + (minutes==1?'':'s'));
            } else {
                $('#header .timer').set('innerHTML', _.pad(2, minutes) + ':' + _.pad(2, diff - (minutes * 60)));
            }
        }

        /* times in team lists */
        $('#team-list .team').per(function (elmnt, index) {
            var timeIn = elmnt.get('%timeIn');
            var timeOut = elmnt.get('%timeOut');
            if (timeIn) {
                var diff;
                if (timeOut) {
                    diff = _.dateDiff('seconds', new Date(timeIn), new Date(timeOut));
                    $('.time-out', elmnt).set('innerHTML', _.formatValue('HH:mm', new Date(timeOut)));
                } else {
                    diff = parseInt((now - new Date(timeIn)) / 1000, 10);
                }

                $('.time-diff', elmnt).set('innerHTML',  Sec2MinSec(diff));
            }
        });

    }


    function teamCategoryCount(entered, left) {
        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        var enteredCount = 0;
        var leftCount = 0;
        for (var i = 0; i < data.teams.length; i++) {

            if (data.teams[i].timeOut === null) {
                enteredCount++;
            } else if (data.teams[i].timeOut !== null) {
                leftCount++;
            }

        }

        return (entered?enteredCount:0) + (left?leftCount:0);
    }


    var LIST_MODE = {active: 0, past: 1};


    function addNewTeam() {
        changePage('New Team');
        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        if ((new Date() - new Date(currentSessionStart)) < 0) {
            $('#app').add(EE('span', {$: 'warning'}, 'How Can She Drink?!'));
        }

        for (var i = 0; i < startlist.length; i++) {
            if (data.visitedTeams[startlist[i].id]) continue;
            $('#app').add(getTeamDiv(startlist[i], teamStart, [i, startlist[i].id]));
        }

        $('#app').add(getSubsection());
        $('#app').add(getButton('', 'Back', runProgress, []));

    }


    function displayTeamListPage(header, mode) {
        changePage(header);
        $('#app').add(getTeamList(mode));
        $('#app').add(getSubsection());
        $('#app').add(getButton('', 'Back', runProgress, []));
    }


    function getTeamList(mode) {
        var data = JSON.parse(localStorage.getItem(currentSessionKey));
        var cont = EE('div', {id: 'team-list'});

        for (var i = 0; i < data.teams.length; i++) {
            var team = data.teams[i];

            if (mode == LIST_MODE.active && team.timeIn !== null && team.timeOut === null) {
                cont.add(getTeamDiv(team, confirmTeamEnd, [i, team.id]));
            } else if (mode == LIST_MODE.past && team.timeOut !== null) {
                cont.add(getTeamDiv(data.teams[i]));
            }
        }

        return cont;
    }


    function teamStart(index, teamId) {
        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        if (startlist[index].id != teamId) {
            console.log('Error');
            return;
        }

        var i = data.teams.push(GetTeamObj(startlist[index]));
        i--;
        data.teams[i].timeIn = new Date();
        data.visitedTeams[teamId] = true;
        saveSessionData('visitedTeams', data.visitedTeams, true);
        saveSessionData('teams', data.teams, true);


        runProgress();
    }


    function confirmTeamEnd(index, teamId) {
        changePage('Team leaving');

        var data = JSON.parse(localStorage.getItem(currentSessionKey));

        $('#app').add(EE('div', {id: 'team-list'}, getTeamDiv(data.teams[index])));
        $('#app').add(getButton('Confirm', '', teamEnd, [index, teamId]));
        $('#app').add(getButton('', 'Back', runProgress, []));
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
        var teamCountInput = EE('input', {'type': 'text'}).set('value', data.startedCount);
        teamCountInput.onChange(function(input) {
            saveSessionData('startedCount', input, true);
        });
        $('#app').add(teamCountInput);

        // start time

        $('#app').add(getSubsection('Start Time'));

        var startTimeInput = EE('input', {'type': 'text'}).set('value', _.formatValue('HH:mm', new Date(data.startedTime)));
        startTimeInput.onChange(function(input) {
            startTime = _.parseDate('YYMMdd HH:mm', _.formatValue('YYMMdd', app.defaultStartTime) + ' ' + input);
            if (startTime !== null && startTime !== undefined) {
                saveSessionData('startedTime', startTime, true);
                currentSessionStart = startTime;
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


    function getButton(header, body, action, params) {
        var btn = EE('div', {$: 'btn btn-full'}, [EE('span', {$: 'btn-head'}, header), EE('span', {$: 'btn-body'}, body)]);
        if (action !== null) {
            btn.onClick(action, params);
        }

        return btn;
    }


    function getTeamDiv(team, action, params) {
        var teamDiv = EE('div', {$: 'team'}, [
                EE('span', {$: 'id'}, team.id),
                EE('span', {$: 'name'}, team.name),
                EE('span', {$: 'time-out'}),
                EE('span', {$: 'time-diff'})
            ]);

        if (team.timeIn !== null) {
            teamDiv.set('%timeIn', team.timeIn);
        }

        if (team.timeOut !== null) {
            teamDiv.set('%timeOut', team.timeOut);
        }

        if (action) {
            teamDiv.onClick(action, params);
            teamDiv.set('+btn');
        }

        return teamDiv;
    }


    function getTeamRow(team, action, params) {
        var teamRow = EE('div', {$: 'team'}, [
                EE('tr', EE('span', {$: 'id'}, team.id)),
                EE('tr', {$: 'name'}, team.name),
                EE('tr', {$: 'times'}, [
                    EE('span', {$: 'time-in'}),
                    EE('span', {$: 'time-out'})
                ]),
                EE('tr', {$: 'time-diff'})
            ]);

        if (team.timeIn !== null) {
            teamRow.set('%timeIn', team.timeIn);
        }

        if (team.timeOut !== null) {
            teamRow.set('%timeOut', team.timeOut);
        }

        if (action) {
            teamRow.onClick(action, params);
            teamRow.set('+btn');
        }

        return teamRow;
    }


})(App);