﻿/// <reference path="../Services/AccountService.js" />
/// <reference path="../Services/RoutingService.js" />
/// <reference path="../Services/PollService.js" />
/// <reference path="../Services/TokenService.js" />
(function () {
    'use strict';

    angular
        .module('GVA.Manage')
        .controller('UnregisteredDashboardController', UnregisteredDashboardController);

    UnregisteredDashboardController.$inject = ['$scope', 'AccountService', 'RoutingService', 'TokenService', 'PollService'];

    function UnregisteredDashboardController($scope, AccountService, RoutingService, TokenService, PollService) {

        $scope.openLoginDialog = showLoginDialog;
        $scope.openRegisterDialog = showRegisterDialog;
        $scope.createPoll = createNewPoll;


        function showLoginDialog() {
            AccountService.openLoginDialog($scope);
        }

        function showRegisterDialog() {
            AccountService.openRegisterDialog($scope);
        }

        function createNewPoll(question, options) {
            PollService.createPoll(question)
            .then(createPollSuccessCallback);
        }

        function createPollSuccessCallback(response) {
            var data = response.data;

            TokenService.setManageId(data.UUID, data.ManageId)
                .then(TokenService.setToken(data.UUID, data.CreatorBallot.TokenGuid)
                .then(function () {
                    RoutingService.navigateToVotePage(data.UUID, data.CreatorBallot.TokenGuid);
                }));
        }
    }

})();
