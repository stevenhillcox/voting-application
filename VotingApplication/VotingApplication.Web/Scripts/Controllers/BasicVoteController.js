﻿/// <reference path="../Services/IdentityService.js" />
/// <reference path="../Services/PollService.js" />
/// <reference path="../Services/TokenService.js" />
/// <reference path="../Services/VoteService.js" />
(function () {
    'use strict';

    angular
        .module('GVA.Voting')
        .controller('BasicVoteController', BasicVoteController);

    BasicVoteController.$inject = ['$scope', '$routeParams', 'IdentityService', 'PollService', 'TokenService', 'VoteService', 'ngDialog'];

    function BasicVoteController($scope, $routeParams, IdentityService, PollService, TokenService, VoteService, ngDialog) {

        var pollId = $routeParams.pollId;
        var token = null;


        $scope.options = {};
        $scope.optionAddingAllowed = false;

        $scope.addOption = addOption;

        // Register our getVotes strategy with the parent controller
        $scope.setVoteCallback(getVotes);

        activate();

        function activate() {
            PollService.getPoll(pollId, getPollSuccessCallback);

            function getPollSuccessCallback(pollData) {
                $scope.options = pollData.Options;

                $scope.optionAddingAllowed = pollData.OptionAdding;

                TokenService.getToken(pollId, getTokenSuccessCallback);
            }

            function getTokenSuccessCallback(tokenData) {
                token = tokenData;

                VoteService.getTokenVotes(pollId, token, getTokenVotesSuccessCallback);
            }

            function getTokenVotesSuccessCallback(voteData) {

                if (!voteData || voteData.length === 0) {
                    return;
                }

                var vote = voteData[0];

                angular.forEach($scope.options, function (option) {
                    if (option.Id === vote.OptionId) {
                        option.selected = true;
                    }
                });
            }

        }

        function addOption() {
            ngDialog.open({
                template: '/Routes/AddOptionDialog',
                controller: 'AddVoterOptionDialogController',
                scope: $scope,
                data: { pollId: pollId }
            });
        }

        function getVotes(option) {
            return [{
                OptionId: option.Id,
                VoteValue: 1,
                VoterName: IdentityService.identity.name
            }];
        }
    }
})();
