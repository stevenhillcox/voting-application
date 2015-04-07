﻿/// <reference path="../Services/AccountService.js" />
/// <reference path="../Services/ErrorService.js" />
(function () {
    'use strict';

    angular
        .module('GVA.Common')
        .controller('AccountRegisterController', AccountRegisterController);

    AccountRegisterController.$inject = ['$scope', '$rootScope', 'AccountService'];

    function AccountRegisterController($scope, $rootScope, AccountService) {

        $scope.registerAccount = function (form) {
            AccountService.register(form.email, form.password).success(function () {
                return AccountService.getAccessToken(form.email, form.password);
            }).success(function (data) {
                AccountService.setAccount(data.access_token, form.email);

                $scope.closeThisDialog();
                if ($scope.ngDialogData.callback) {
                    $scope.ngDialogData.callback();
                }
            }).error(loginFailureCallback);

            function loginFailureCallback() {
                $scope.displayError = $rootScope.error.readableMessage;
                $rootScope.error = null;
            }
        };

    }

})();
