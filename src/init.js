var MINI = require('minified');
var _=MINI._, $=MINI.$, $$=MINI.$$, EE=MINI.EE, HTML=MINI.HTML;


var App = {
    defaultStartTime: (new Date()).setHours(16, 0), /* always today, session settings would overwite */
    year: new Date().getFullYear(),
    sessionsKey: 'PBBSessions' + this.year,
    runDurationHours: 4,
    currentHash: '',
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