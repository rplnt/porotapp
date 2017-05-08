var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;

var App = {
    defaultStartTime: (new Date()).setHours(16, 0), /* always today, session settings would overwite */
    year: new Date().getFullYear(),
    sessionsKey: 'PBBSessions' + this.year,
    runDurationHours: 4,
};

$(function() {
    $('body').fill([
        EE('div', {$: 'head', id: 'header'}, [
            EE('span', {$: 'name'}),
            EE('span', {$: 'title'}),
            EE('span', {$: 'timer'})
        ]),
        EE('div', {id: 'app', $: 'app-container'})
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
        $('#header .name').fill('');
        currentSessionKey = null;
        currentStopName = false;
        currentSessionStart = null;

        if (timeRepeater) {
            clearInterval(timeRepeater);
            timeRepeater = false;
            $('#header .timer').fill();
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


    function changePage(title, status) {
        $('#header .title').fill(title);
        if (status !== undefined && status !== null) {
            $('#header .status').fill(title);
        }
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
        if (!data.startedCount) saveSessionData('startedCount', startlist.length, false);
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
            $('#header .name').fill(currentStopName);
            timeRepeater = setInterval(updateTimers, 1000);
            runProgress();
        }
    }


    function GetTeamObj(team) {
        return {
            id: team.id,
            name: team.name,//.substring(0, 20),
            timeIn: null,
            timeOut: null
        };
    }


    function runProgress() {
        changePage('⛽ ');

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

    function Sec2Hr(seconds) {
        return Math.floor(seconds/(60*60));
    }

    function Sec2Min(seconds) {
        return Math.floor(seconds/60);
    }

    function Sec2Sec(seconds) {
        var minutes = Math.floor(seconds/60);
        return seconds - (minutes * 60);
    }

    function Sec2MinSec(seconds, stamp) {
        if (stamp === undefined) stamp = '';
        if (Sec2Min(seconds) > 0) {
            stamp += (Sec2Min(seconds) + 'm ');
        }

        return stamp + Sec2Sec(seconds) + 's';
    }

    function Sec2HrMinSec(seconds) {
        var hrms = ClockOClock(seconds) + ' ';
        hrms += Sec2Hr(seconds) + ':';
        hrms += (_.pad(2, Sec2Min(seconds) - Sec2Hr(seconds)*60) + ':');
        hrms += _.pad(2, Sec2Sec(seconds));
        return hrms;
    }


    function updateTimers() {
        var now = new Date();

        /* header */
        if (currentSessionStart !== null) {
            var diff = parseInt((now - new Date(currentSessionStart)) / 1000, 10);
            var minutes = Sec2Min(diff);
            if (minutes < 0)  {
                // minutes = Math.abs(minutes);
                $('#header .timer').fill('T' + minutes + ' min' + (minutes==1?'':'s'));
            } else if (Sec2Hr(diff) > app.runDurationHours) {
                $('#header .timer').fill('💊');
            } else {
                $('#header .timer').fill(Sec2HrMinSec(diff));
            }
        }

        /* times in team lists */
        $('#team-list-active .team').per(function (elmnt, index) {
            var timeIn = elmnt.get('%timeIn');
            if (!timeIn) return;

            var diff = parseInt((now - new Date(timeIn)) / 1000, 10);
            $('.time-diff', elmnt).fill(Sec2MinSec(diff));
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

        var teamTable = EE('table', {$: 'team-table'});

        for (var i = 0; i < startlist.length; i++) {
            if (data.visitedTeams[startlist[i].id]) continue;
            teamTable.add(getTeamRow(startlist[i], teamStart, [i, startlist[i].id]));
        }

        $('#app').add(teamTable);
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
        var teamList = EE('table', {id: 'team-list' + ((mode == LIST_MODE.active)?'-active':''), $: 'team-table'});

        for (var i = 0; i < data.teams.length; i++) {
            var team = data.teams[i];

            if (mode == LIST_MODE.active && team.timeIn !== null && team.timeOut === null) {
                teamList.add(getTeamRow(team, confirmTeamEnd, [i, team.id]));
            } else if (mode == LIST_MODE.past && team.timeOut !== null) {
                teamList.add(getTeamRow(data.teams[i]));
            }
        }

        return teamList;
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

        $('#app').add(EE('table', {id: 'team-list-active', $: 'team-table'}, getTeamRow(data.teams[index])));
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
            startTime = _.parseDate('YYMMdd HH:mm', _.formatValue('YYMMdd', new Date()) + ' ' + input);
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


    function getTeamRow(team, action, params) {
        var teamRow = EE('tr', {$: 'team'});

        var times = EE('td', {$: 'times'}, [
                    EE('div', {$: 'time-in'}, '--:--'),
                    EE('div', {$: 'time-out'}, '--:--')
                ]);

        if (team.timeIn) {
            teamRow.set('%timeIn', team.timeIn);
            $('.time-in', times).fill(_.formatValue('HH:mm', new Date(team.timeIn)));
        }

        if (team.timeOut) {
            teamRow.set('%timeOut', team.timeOut);
            $('.time-out', times).fill(_.formatValue('HH:mm', new Date(team.timeOut)));
        }


        teamRow.add(EE('td', {$: 'id'}, EE('span', {$: 'team-id'}, team.id)));
        teamRow.add(EE('td', {$: 'name'}, EE('span', {$: 'team-name'}, team.name)));
        teamRow.add(times);
        teamRow.add(EE('td', {$: 'time-diff'}));

        if (team.timeIn) {
            var outDate = team.timeOut?(new Date(team.timeOut)):(new Date());
            var diff = parseInt((outDate - new Date(team.timeIn)) / 1000, 10);
            $('.time-diff', teamRow).fill(Sec2MinSec(diff));
        }

        if (action) {
            teamRow.onClick(action, params);
            teamRow.set('+btn');
        }

        return teamRow;
    }


})(App);