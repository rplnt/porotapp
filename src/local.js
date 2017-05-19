(function(app) {


    var localTimeUpdater;


    app.Local = function() {
        app.changePage('⛽ ', null, '#main');

        if (!localTimeUpdater) {
            localTimeUpdater = setInterval(updateLocalTimers, 1000);
        }

        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));

        // add team
        $('#app').add(app.getButton('⨭Add Team', data.startedCount - teamCategoryCount(true, true) + ' out of ' + data.startedCount + ' teams remaining', addNewTeam, []));

        if (data.teams) {
            $('#app').add(app.getSubsection('Drinking (' + teamCategoryCount(true, false) + ')'));
            $('#app').add(getTeamList(app.LIST_MODE.active));
        }


        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('', 'Visited list (' + teamCategoryCount(false, true) + ')', displayTeamListPage, ['Visited', app.LIST_MODE.past]));
        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('', 'Session Settings', app.configCurrentSession, []));
        $('#app').add(app.getButton('', 'Home', App.Init, []));

        updateLocalTimers();
    };


    function toggleRows(evnt, index) {
        if ($('.arrow', this[index]).get('innerHTML') == '►') {
            $('.arrow', this[index]).fill('▼');
        } else {
            $('.arrow', this[index]).fill('►');
        }
        var row = $(this[index]).next('tr');
        var group = $(row).get('%group');
        var lmt = 0;
        for (var i = 0; i < 10 && group == $(row).get('%group'); i++) {
            $(row).set('hidden');
            row = $(row).next('tr');
        }
    }


    function addNewTeam() {
        app.changePage('Teams', null, '#addteam');
        // location.hash = '#addteam';
        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));

        if ((new Date() - new Date(app.getCurrentSessionStart())) < 0) {
            $('#app').add(EE('span', {$: 'warning'}, 'How Can She Drink?!'));
        }

        var teamTable = EE('table', {$: 'team-table'});

        // startlist must be ordered!
        var lastBreak = -1;
        for (var i = 0; i < startlist.length; i++) {
            if (data.visitedTeams[startlist[i].id]) continue;
            if (Math.floor(startlist[i].id / 10) > lastBreak) {
                lastBreak = Math.floor(startlist[i].id / 10);
                var divRow = app.getTeamRow({name: ((lastBreak * 10) + ' - ' + (lastBreak * 10 + 9)), id: '►'}, toggleRows);
                teamTable.add(divRow);
            }
            teamTable.add(app.getTeamRow(startlist[i], teamStart, [i, startlist[i].id]).set('+hidden'));
        }

        $('#app').add(teamTable);
        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('', 'Back', app.Local, []));

    }


    function teamCategoryCount(entered, left) {
        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));

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


    function teamStart(index, teamId) {
        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));

        if (startlist[index].id != teamId) {
            console.log('Error');
            return;
        }

        var i = data.teams.push(GetTeamObj(startlist[index]));
        i--;
        data.teams[i].timeIn = new Date();
        data.visitedTeams[teamId] = true;
        app.saveSessionData('visitedTeams', data.visitedTeams, true);
        app.saveSessionData('teams', data.teams, true);


        app.Local();
    }


    function confirmTeamEnd(index, teamId) {
        app.changePage('Team End', null, '#confirmend');

        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));

        $('#app').add(EE('table', {id: 'team-list-active', $: 'team-table'}, app.getTeamRow(data.teams[index])));
        // $('#app').add(app.getSubsection('Notes'));
        // $('#app').add(EE('input', {$: 'rating-input', 'type': 'text'}));
        $('#app').add(app.getButton('Confirm', '', teamEnd, [index, teamId]));
        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('', 'Disqualify', confirmDisqualify, [index, teamId]));
        $('#app').add(app.getButton('', 'Back', app.Local, []));
    }


    function teamEnd(index, teamId, teamOK) {
        if (teamOK === undefined) teamOK = true;
        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));

        if (data.teams[index].id != teamId) {
            console.log('Error');
            return;
        }

        if (teamOK === false) {
            data.teams[index].timeOut = 0;
        } else {
            data.teams[index].timeOut = new Date();
        }
        app.saveSessionData('teams', data.teams, true);

        app.Local();
    }


    function confirmDisqualify(index, teamId) {
        app.changePage('Disqualify', null, '#disqualify');

        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));
        $('#app').add(EE('table', {id: 'team-list-active', $: 'team-table'}, app.getTeamRow(data.teams[index])));
        $('#app').add(app.getButton('Disqualify', 'Non-reversible action!', teamEnd, [index, teamId, false]));
        $('#app').add(app.getButton('', 'Back', confirmTeamEnd, [index, teamId]));
    }


    function updateLocalTimers() {
        var now = new Date();

        $('#team-list-active .team').per(function (elmnt, index) {
            var timeIn = elmnt.get('%timeIn');
            if (!timeIn) return;

            var diff = parseInt((now - new Date(timeIn)) / 1000, 10);
            $('.time-diff', elmnt).fill(app.Sec2MinSec(diff));
        });
    }


    function displayTeamListPage(header, mode) {
        app.changePage(header, null, '#teamlist');
        $('#app').add(getTeamList(mode));
        $('#app').add(app.getSubsection());
        $('#app').add(app.getButton('', 'Back', app.Local, []));
    }


    function getTeamList(mode) {
        var data = JSON.parse(localStorage.getItem(app.currentSessionKey));
        var teamList = EE('table', {id: 'team-list' + ((mode == app.LIST_MODE.active)?'-active':''), $: 'team-table'});

        for (var i = 0; i < data.teams.length; i++) {
            var team = data.teams[i];

            if (mode == app.LIST_MODE.active && team.timeIn !== null && team.timeOut === null) {
                teamList.add(app.getTeamRow(team, confirmTeamEnd, [i, team.id]));
            } else if (mode == app.LIST_MODE.past && team.timeOut !== null) {
                teamList.add(app.getTeamRow(data.teams[i]));
            }
        }

        return teamList;
    }


    function GetTeamObj(team) {
        return {
            id: team.id,
            name: team.name,//.substring(0, 20),
            timeIn: null,
            timeOut: null
        };
    }
    

})(App);