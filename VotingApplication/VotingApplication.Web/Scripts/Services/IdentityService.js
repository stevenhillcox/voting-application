﻿(function () {
    angular.module('GVA.Voting').factory('IdentityService', ['$localStorage', 'ngDialog',
        function ($localStorage, ngDialog) {

            var self = this;

            var observerCallbacks = [];

            var notifyObservers = function () {
                angular.forEach(observerCallbacks, function (callback) {
                    callback();
                });
            };

            self.identity = $localStorage.identity;

            self.registerIdentityObserver = function (callback) {
                observerCallbacks.push(callback);
            }

            self.setIdentityName = function (name) {
                var identity = { 'name': name }
                self.identity = identity;
                $localStorage.identity = identity;
                notifyObservers();
            }

            self.clearIdentityName = function () {
                self.identity = null;
                delete $localStorage.identity;
                notifyObservers();
            }

            self.openLoginDialog = function (scope, callback) {
                ngDialog.open({
                    template: '../Routes/IdentityLogin',
                    controller: 'IdentityLoginController',
                    'scope': scope,
                    data: { 'callback': callback }
                });
            }

            return self;
        }]);
})();