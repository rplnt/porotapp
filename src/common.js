// TODO rewrite
window.onhashchange = function() {
        if (location.hash != App.currentHash) {
            switch (location.hash) {
                case '#main':
                case '#confirmed':
                    App.Local();
                    break;
                case '#sessions':
                    App.Init();
                    break;
                case '#settings':
                    App.configCurrentSession();
                    break;
                default:
                    break;
            }
        }
};

(function(app) {

    app.LIST_MODE = {active: 0, past: 1};

    function changeHash(hash) {
        app.currentHash = hash;
        location.hash = hash;
    }

    app.changePage = function (title, status, hash) {
        if (hash !== undefined) {
            changeHash(hash);
        }
        $('#header .title').fill(title);
        if (status !== undefined && status !== null) {
            $('#header .status').fill(title);
        }
        $('#app').fill();
    };


    app.saveSessionData = function(key, value, overwrite) {
        overwrite = (typeof overwrite !== 'undefined') ?  overwrite : true;
        var sessionObj = JSON.parse(localStorage.getItem(app.currentSessionKey));

        if (!sessionObj[key] || overwrite) {
            sessionObj[key] = value;
            // console.log(sessionObj[key]);
            localStorage.setItem(app.currentSessionKey, JSON.stringify(sessionObj));
        }
    };


    app.getSubsection = function(title) {
        return EE('div', {$: 'sub-header'}, title);
    };


    app.getButton = function(header, body, action, params) {
        var btn = EE('div', {$: 'btn btn-full'}, [EE('span', {$: 'btn-head'}, header), EE('span', {$: 'btn-body'}, body)]);
        if (action !== null) {
            btn.onClick(action, params);
        }

        return btn;
    };


    app.getTeamRow = function(team, action, params) {
        var teamRow = EE('tr', {$: 'team'});

        var times = EE('td', {$: 'times'}, [
                    EE('div', {$: 'time-in'}, '☐'),
                    EE('div', {$: 'time-out'}, '☐')
                ]);

        if (team.timeIn) {
            teamRow.set('%timeIn', team.timeIn);
            $('.time-in', times).fill(_.formatValue('☑HH:mm', new Date(team.timeIn)));
        }

        if (team.timeOut) {
            teamRow.set('%timeOut', team.timeOut);
            $('.time-out', times).fill(_.formatValue('☑HH:mm', new Date(team.timeOut)));
        }


        teamRow.add(EE('td', {$: 'id'}, EE('span', {$: 'team-id'}, team.id)));
        teamRow.add(EE('td', {$: 'name'}, EE('span', {$: 'team-name'}, team.name)));
        teamRow.add(times);
        teamRow.add(EE('td', {$: 'time-diff'}));

        if (team.timeIn) {
            if (team.timeOut === 0) {
                $('.time-diff', teamRow).fill('✘');
            } else {
                var outDate = team.timeOut?(new Date(team.timeOut)):(new Date());
                var diff = parseInt((outDate - new Date(team.timeIn)) / 1000, 10);
                $('.time-diff', teamRow).fill(app.Sec2MinSec(diff));
            }
        }

        if (!team.timeIn && !team.timeOut) {
            $('.time-in', teamRow).set('+hidden');
            $('.time-out', teamRow).set('+hidden');
        }

        if (action) {
            if (params) {
                teamRow.onClick(action, params);
            } else {
                teamRow.onClick(action);
            }
            teamRow.set('+btn');
        }

        /* special case for collapser */
        if (Number.isInteger(team.id)) {
            teamRow.set('%group', Math.floor(team.id/10));
        } else {
            $('.team-id', teamRow).set('+arrow');
        }

        return teamRow;
    };

})(App);