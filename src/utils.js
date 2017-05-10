(function(app) {

    /* Time Helpers */
    function ClockOClock(hour) {
        var clocks = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗',  '🕘',  '🕙',  '🕚'];
        return clocks[Math.floor(hour) % 12];
    }

    function Sec2Hr(seconds) {
        return Math.floor(seconds/(60*60));
    }

    function Sec2Min(seconds) {
        return Math.floor(Math.abs(seconds/60));
    }

    function Sec2Sec(seconds) {
        seconds = Math.abs(seconds);
        var minutes = Math.floor(seconds/60);
        return seconds - (minutes * 60);
    }

    app.Sec2MinSec = function(seconds, stamp) {
        if (stamp === undefined) stamp = '';
        if (Sec2Min(seconds) > 0) {
            stamp += (Sec2Min(seconds) + 'm');
        }

        return stamp + Sec2Sec(seconds) + 's';
    };

    app.Sec2HrMinSec = function(seconds) {
        var hrms = ''; // = ClockOClock(seconds) + ' ';
        hrms += Sec2Hr(seconds) + ':';
        hrms += (_.pad(2, Sec2Min(seconds) - Sec2Hr(seconds)*60) + ':');
        hrms += _.pad(2, Sec2Sec(seconds));
        return hrms;
    };

})(App);