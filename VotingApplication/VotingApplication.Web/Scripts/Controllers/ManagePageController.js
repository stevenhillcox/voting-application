﻿(function () {
    angular
        .module('GVA.Creation')
        .controller('ManagePageController', ['$scope', '$routeParams', 'AccountService', 'ManageService',
        function ($scope, $routeParams, AccountService, ManageService) {

            var manageId = $routeParams.manageId;

            $scope.poll = {};
            $scope.manageId = manageId;

            $scope.openLoginDialog = function () {
                AccountService.openLoginDialog($scope);
            };

            $scope.updatePoll = function () {
                ManageService.poll = $scope.poll;
                ManageService.updatePoll($routeParams.manageId, $scope.poll);
            };

            $scope.formatPollExpiry = function () {
                if (!$scope.poll.Expires || !$scope.poll.ExpiryDate) {
                    return 'Never';
                }

                var expiryDate = new Date($scope.poll.ExpiryDate);
                return expiryDate.toLocaleString();
            };

            $scope.selectText = function ($event) {
                $event.target.select();
            };

            ManageService.getPoll(manageId, function (data) {
                $scope.poll = data;
            });

        }]);
})();