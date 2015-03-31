﻿(function () {
    angular
        .module('GVA.Creation')
        .controller('ManagePollTypeController', ManagePollTypeController);

    ManagePollTypeController.$inject = ['$scope', '$routeParams', '$location', 'ngDialog', 'ManageService', 'RoutingService'];

    function ManagePollTypeController($scope, $routeParams, $location, ngDialog, ManageService, RoutingService) {

        $scope.poll = ManageService.poll;
        $scope.manageId = $routeParams.manageId;

        $scope.updatePoll = updatePoll;
        $scope.return = navigateToManagePage;
        $scope.updateStrategy = updateStrategy;

        activate();

        function updatePoll() {
            ManageService.updatePoll($routeParams.manageId, $scope.poll, navigateToManagePage);
        }

        function navigateToManagePage() {
            RoutingService.navigateToManagePage($scope.manageId);
        }

        function updateStrategy(strategy) {

            ManageService.getVotes($scope.poll.UUID, function (votes) {
                if (votes.length > 0) {
                    openPollChangeDialog(function () {
                        $scope.poll.VotingStrategy = strategy;
                    });
                } else {
                    $scope.poll.VotingStrategy = strategy;
                }
            });
        }

        function activate() {
            ManageService.registerPollObserver(function () {
                $scope.poll = ManageService.poll;
            });

            ManageService.getPoll($scope.manageId);
        }

        function openPollChangeDialog(callback) {
            ngDialog.open({
                template: '../Routes/PollTypeChange',
                controller: 'PollTypeChangeController',
                'scope': $scope,
                data: { 'callback': callback }
            });
        }
    }
})();
