﻿'use strict';

describe('Results Page Controller', function () {

    beforeEach(module('GVA.Voting'));

    var scope;

    var mockVoteService;

    var voteGetResultsPromise;

    beforeEach(function () {
        jasmine.clock().install();
    });

    beforeEach(inject(function ($rootScope, $q, $controller) {

        scope = $rootScope.$new();

        mockVoteService = {
            refreshLastChecked: function () { },
            getResults: function () { }
        };

        voteGetResultsPromise = $q.defer();
        spyOn(mockVoteService, 'getResults').and.callFake(function () { return voteGetResultsPromise.promise; });

        $controller('ResultsPageController', { $scope: scope, VoteService: mockVoteService });
    }));

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it('Calls vote service to get results', function () {

        expect(mockVoteService.getResults).toHaveBeenCalled();
    });

    it('Calls vote service to get results after 3 seconds', function () {

        mockVoteService.getResults.calls.reset();

        expect(mockVoteService.getResults).not.toHaveBeenCalled();

        jasmine.clock().tick(3000);

        expect(mockVoteService.getResults).toHaveBeenCalled();
    });

    it('Removes the timer if the vote service returns an error code (400+) from get results', function () {

        var response = { data: {}, status: 404 };

        voteGetResultsPromise.reject(response);

        scope.$apply();
        jasmine.clock().tick(3000);

        // First tick calls getResults, which then fails, and removes the timer.
        // Second tick should therefore not call it.

        mockVoteService.getResults.calls.reset();
        jasmine.clock().tick(3000);


        expect(mockVoteService.getResults).not.toHaveBeenCalled();

    });

    it('Does not remove the timer if the vote service returns a success from get results', function () {

        voteGetResultsPromise.resolve({});

        scope.$apply();
        jasmine.clock().tick(3000);

        mockVoteService.getResults.calls.reset();
        jasmine.clock().tick(3000);


        expect(mockVoteService.getResults).toHaveBeenCalled();

    });

    it('Sets voteCount to be number of votes cast', function () {
        var resultData = {
            Votes: [{}, {}, {}]
        };

        var response = { data: resultData };

        voteGetResultsPromise.resolve(response);

        scope.$apply();
        jasmine.clock().tick(3000);


        expect(scope.voteCount).toBe(3);
    });

    it('Sets Winner to the single winning option', function () {
        var resultData = {
            Winners: [{ Name: 'Winning option' }]
        };

        var response = { data: resultData };

        voteGetResultsPromise.resolve(response);

        scope.$apply();
        jasmine.clock().tick(3000);


        expect(scope.winner).toBe('Winning option');
    });

    it('Sets Winner to the combined list of all winners', function () {
        var resultData = {
            Winners: [{ Name: 'Winning option' }, { Name: 'Another Winning option' }]
        };

        var response = { data: resultData };

        voteGetResultsPromise.resolve(response);

        scope.$apply();
        jasmine.clock().tick(3000);


        expect(scope.winner).toBe('Winning option, Another Winning option');
    });

    it('Sets plural to empty if there is a single winner', function() {
        var resultData = {
            Winners: [{ Name: 'Winning option' }]
        };

        var response = { data: resultData };

        voteGetResultsPromise.resolve(response);

        scope.$apply();
        jasmine.clock().tick(3000);


        expect(scope.plural).toBe('');
    });

    it('Sets plural if there is more than one winner', function() {
        var resultData = {
            Winners: [{ Name: 'Winning option' }, { Name: 'Another Winning option' }]
        };

        var response = { data: resultData };

        voteGetResultsPromise.resolve(response);

        scope.$apply();
        jasmine.clock().tick(3000);


        expect(scope.plural).toBe('s (Draw)');
    });
});