﻿(function () {
    angular.module('GVA.Voting').factory('PollService', ['$location', '$http', function ($location, $http) {
        var self = this;

        var lastCheckedTimestamps = {};

        self.currentPollId = function () {
            var urlParams = $location.url().split("/");

            if (urlParams.length < 3)
                return;

            var pollId = urlParams[2];

            return pollId;
        }

        self.submitVote = function (pollId, votes, token, callback, failureCallback) {

            if (!pollId || !votes || !token) {
                return null;
            }

            $http({
                method: 'PUT',
                url: '/api/token/' + token + '/poll/' + pollId + '/vote',
                data: votes
            })
            .success(function (data, status) { if (callback) { callback(data) } })
            .error(function (data, status) { if (failureCallback) { failureCallback(data, status) } });
        }

        self.getPoll = function (pollId, callback, failureCallback) {

            if (!pollId) {
                return null;
            }

            $http({
                method: 'GET',
                url: '/api/poll/' + pollId
            })
            .success(function (data, status) { if (callback) { callback(data) } })
            .error(function (data, status) { if (failureCallback) { failureCallback(data, status) } });

        }

        self.getResults = function (pollId, callback, failureCallback) {

            if (!pollId) {
                return null;
            }

            if (!lastCheckedTimestamps[pollId]) {
                lastCheckedTimestamps[pollId] = 0;
            }

            $http({
                method: 'GET',
                url: '/api/poll/' + pollId + '/vote?lastPoll=' + lastCheckedTimestamps[pollId]
            })
            .success(function (data, status) { if (callback) { callback(data) } })
            .error(function (data, status) { if (failureCallback) { failureCallback(data, status) } });

            lastCheckedTimestamps[pollId] = Date.now();
        }

        self.getTokenVotes = function (pollId, token, callback, failureCallback) {

            if (!pollId || !token) {
                return null;
            }

            $http({
                method: 'GET',
                url: '/api/token/' + token + '/poll/' + pollId + '/vote'
            })
            .success(function (data, status) { if (callback) { callback(data) } })
            .error(function (data, status) { if (failureCallback) { failureCallback(data, status) } });

        }

        self.createPoll = function (question) {
            var request = {
                method: 'POST',
                url: 'api/poll',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                data: JSON.stringify({
                    Name: question,
                    Creator: 'Anonymous',
                    Email: undefined,
                    TemplateId: 0,
                    VotingStrategy: 'Basic',
                    MaxPoints: 7,
                    MaxPerVote: 3,
                    InviteOnly: false,
                    AnonymousVoting: false,
                    RequireAuth: false,
                    Expires: false,
                    ExpiryDate: undefined,
                    OptionAdding: false
                })
            }

            $http(request).success(function (data) {
                window.alert(data.ManageId);
                window.location.href = "/Manage/" + data.ManageId;
            });

        };

        return self;
    }]);
})();
