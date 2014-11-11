/*! VLCPlayer 2014-11-10 09:11:06 */
angular.module('kdarcel.vlc-player', [])
    .filter('range', function() {
        return function(input, total) {
            total = parseInt(total);
            for (var i = 0; i < total; i++)
                input.push(i);
            return input;
        };
    })
    .filter('time2String', function() {
        return function duration(duration) {
            if (!duration)
                return "";

            var seconds = parseInt((duration / 1000) % 60);
            var minutes = parseInt((duration / (1000 * 60)) % 60);
            var hours   = parseInt((duration / (1000 * 60 * 60)) % 24);

            var durationString = "";

            if (hours) durationString += ((hour < 10) ? "0" + hours : hours) + ":";
            durationString += ((minutes < 10) ? "0" + minutes : minutes) + ":";
            durationString += (seconds < 10) ? "0" + seconds : seconds;

            return durationString;
        };
    })
    .factory("poollingFactory", function ($timeout) {
        var timeIntervalInSec = 1;

        function callFnOnInterval(fn, timeInterval) {
            var promise = $timeout(fn, 1000 * timeIntervalInSec);

            return promise.then(function(){
                callFnOnInterval(fn, timeInterval);
            });
        };

        return {
            callFnOnInterval: callFnOnInterval
        };
    })
    .directive('vlcplayer', function (poollingFactory) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'VLCPlayer.tpl.html',
            link: function (scope, element, attributes) {
                var setupVlcPlayer = function(vlcData) {
                    if (vlcData.url && vlcData.filename) {
                        scope.vlc = document.getElementById("vlc");
                        if (scope.vlc)
                        {
                            if (scope.vlc.playlist.items.count > 0)
                                scope.vlc.playlist.items.clear();

                            var options = [":vout-filter=deinterlace", ":deinterlace-mode=linear"];
                            var id = scope.vlc.playlist.add(vlcData.url, vlcData.filename, options);

                            if (vlcData.autoplay == 'true')
                                scope.vlc.playlist.playItem(id);

                            // Until the video is completly launch
                            // It's to avoid useless call on input lenght later, and set it once at beginning
                            while (scope.vlc.input.hasVout == false);

                            scope.videoDuration = scope.vlc.input.length;
                        }
                    }
                }

                scope.$watch(function () {
                    return {
                        'url': attributes.vlcUrl,
                        'filename': attributes.vlcFilename,
                        'autoplay': attributes.vlcAutoplay
                    };
                }, setupVlcPlayer, true);

                scope.vlcTogglePause = function() {
                    scope.vlc.playlist.togglePause();
                }

                scope.vlcToggleMute = function() {
                    scope.vlc.audio.toggleMute();
                }

                scope.vlcSwitchAudioTrack = function(trackNumber) {
                    scope.vlc.audio.track = trackNumber;
                }

                scope.vlcSwitchSubtitleTrack = function(trackNumber) {
                    scope.vlc.subtitle.track = trackNumber
                }

                scope.vlcToggleFullscreen = function() {
                    scope.vlc.video.toggleFullscreen();
                }

                poollingFactory.callFnOnInterval(function () {
                    scope.videoCurrentTime = scope.vlc.input.time;
                });
            }
        }
    });

angular.module('kdarcel.vlc-player.tpl', ['VLCPlayer.tpl.html']);

angular.module("VLCPlayer.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("VLCPlayer.tpl.html",
    "<div>\n" +
    "    <div class=\"video-container\">\n" +
    "        <div class=\"video\">\n" +
    "            <object classid=\"clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921\" events=\"true\" width=\"100%\" height=\"100%\">\n" +
    "                <embed pluginspage=\"http://www.videolan.org\"\n" +
    "                       type=\"application/x-vlc-plugin\"\n" +
    "                       version=\"VideoLAN.VLCPlugin.2\"\n" +
    "                       width=\"100%\"\n" +
    "                       height=\"100%\"\n" +
    "                       toolbar=\"false\"\n" +
    "                       branding=\"true\"\n" +
    "                       id=\"vlc\"\n" +
    "                ></embed>\n" +
    "            </object>\n" +
    "        </div>\n" +
    "        <div class=\"video-controls\">\n" +
    "            <div class=\"toolbar\">\n" +
    "                <button type=\"button\" class=\"btn btn-default pull-left\" ng-click=\"vlcTogglePause()\">\n" +
    "                    <span class=\"glyphicon\" ng-class=\"vlc.playlist.isPlaying ? 'glyphicon-pause' : 'glyphicon-play'\"></span>\n" +
    "                </button>\n" +
    "                <span>{{ videoCurrentTime | time2String }} / {{ videoDuration | time2String }}</span>\n" +
    "                <div class=\"form-inline pull-right\">\n" +
    "                    <button type=\"button\" class=\"btn btn-default\" ng-click=\"vlcToggleMute()\">\n" +
    "                        <span class=\"glyphicon\" ng-class=\"vlc.audio.mute ? 'glyphicon-volume-off' : 'glyphicon-volume-up'\"></span>\n" +
    "                    </button>\n" +
    "                    <div class=\"btn-group\">\n" +
    "                        <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "                            <span class=\"glyphicon glyphicon-sound-5-1\"></span>\n" +
    "                        </button>\n" +
    "                        <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "                            <li ng-repeat=\"n in [] | range:vlc.audio.count\">\n" +
    "                                <a href=\"\" ng-click=\"vlcSwitchAudioTrack(n)\">\n" +
    "                                    {{ vlc.audio.description(n) }}&nbsp;<span class=\"glyphicon glyphicon-ok\" ng-show=\"vlc.audio.track == n\"></span>\n" +
    "                                </a>\n" +
    "                            </li>\n" +
    "                        </ul>\n" +
    "                    </div>\n" +
    "                    <div class=\"btn-group\">\n" +
    "                        <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "                            <span class=\"glyphicon glyphicon-subtitles\"></span>\n" +
    "                        </button>\n" +
    "                        <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "                            <li ng-repeat=\"n in [] | range:vlc.subtitle.count\">\n" +
    "                                <a href=\"\" ng-click=\"vlcSwitchSubtitleTrack(n)\">\n" +
    "                                    {{ vlc.subtitle.description(n) }}&nbsp;<span class=\"glyphicon glyphicon-ok\" ng-show=\"vlc.subtitle.track == n\"></span>\n" +
    "                                </a>\n" +
    "                            </li>\n" +
    "                        </ul>\n" +
    "                    </div>\n" +
    "                    <button type=\"button\" class=\"btn btn-default\" ng-click=\"vlcToggleFullscreen()\">\n" +
    "                        <span class=\"glyphicon glyphicon-resize-full\"></span>\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
