(function () {
    'use strict';

    angular
    .module('GVA.Voting')
    .directive('pollInfoBox', PollInfoBox);

    function PollInfoBox() {

        function link(scope) {

            activate();

            function activate() {

            }
        }

        return {
            templateUrl: '/Routes/PollInfoBox',
            restrict: 'A',
            link: link,
            scope: {
                poll: '=',
            }
        };
    }
})();