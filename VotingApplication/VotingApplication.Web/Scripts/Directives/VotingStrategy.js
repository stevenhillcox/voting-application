﻿(function () {
    angular.module('GVA.Voting').directive('votingStrategy', ['PollService', function (PollService) {

        var pollStrategy = null;

        PollService.getPoll(PollService.currentPollId(), function (data) {
            pollStrategy = data.VotingStrategy;
        });

        var votingTemplate = function () {
            if (!pollStrategy) {
                return '';
            }

            return '../Routes/' + pollStrategy + 'Vote';
        }

        return {
            replace: true,
            link: function (scope, element, attrs) {
                scope.votingTemplate = votingTemplate;
            },

            template: '<div ng-include="votingTemplate()"></div>'
        }
    }]);
})();