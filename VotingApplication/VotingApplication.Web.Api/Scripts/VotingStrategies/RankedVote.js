﻿define(['jquery', 'knockout', 'jqueryUI', 'Common'], function ($, ko, jqueryUI, Common) {

    return function RankedVote(options) {

        self = this;
        self.options = ko.observableArray(options);
        self.selectedOptions = ko.observableArray();
        self.resultOptions = ko.observableArray();

        var selectOption = function (option) {
            var $option = $('#optionTable > tbody > tr').filter(function () {
                return $(this).attr('data-id') == option.Id;
            });

            $('#selectionTable > tbody').append($option.remove());
            self.selectedOptions.push(option)
        }

        var selectPickedOptions = function (pickedOptions) {
            self.selectedOptions.removeAll();

            pickedOptions.forEach(function (option) {
                var pickedOption = ko.utils.arrayFirst(self.options(), function (item) {
                    return item.Id == option.OptionId;
                });

                selectOption(pickedOption);
            });
        }

        var resetOptions = function () {
            $('#optionTable > tbody').append($('#selectionTable > tbody').remove('tr').children());
        }

        var countVotes = function (votes) {
            var options = [];
            var orderedOptions = [];
            var ballots = [];
            var totalBallots = 0;
            var totalOptions = self.options().length;

            for (var k = 0; k < totalOptions; k++) {
                var optionId = self.options()[k].Id;
                options[k] = { Id: optionId, ballots: [] };
            }

            // Group votes into ballots (per user)
            votes.forEach(function (vote) {
                if (!ballots[vote.UserId]) {
                    ballots[vote.UserId] = [];
                    totalBallots++;
                }
                ballots[vote.UserId].push(vote);
            });

            // Sort the votes on the ballots and assign each ballot to first choice
            ballots.forEach(function (ballot) {
                ballot.sort(function (a, b) {
                    return a.PollValue - b.PollValue;
                });
                var firstChoiceId = ballot[0].OptionId
                options.filter(function (option) { return option.Id == firstChoiceId })[0].ballots.push(ballot);
            });

            // Start counting
            var majorityReached = false;
            while (options.length > 1) {

                // Sort the options based on number of ballots
                options.sort(function (a, b) {
                    var diff = a.ballots.length - b.ballots.length;
                    if (diff == 0) {
                        return a.Id - b.Id;
                    } else {
                        return diff;
                    }
                });

                // End if we have a majority
                if (options[options.length - 1].ballots.length > totalBallots / 2) {
                    break;
                }

                // Redistribute votes
                var lastPlaceOption = options.shift();
                var lastPlaceOptionId = lastPlaceOption.Id;

                lastPlaceOption.ballots.forEach(function (ballot) {
                    while (ballot.length > 0) {
                        var nextOptionChoiceId = ballot[0].OptionId;
                        var nextOptionChoice = options.filter(function (option) {
                            return option.Id == nextOptionChoiceId;
                        })[0];
                        if (nextOptionChoice) {
                            nextOptionChoice.ballots.push(ballot);
                            break;
                        } else {
                            ballot.shift();
                        }
                    }
                });

                orderedOptions.push(lastPlaceOption);
            }

            orderedOptions.push.apply(orderedOptions, options);
            orderedOptions.reverse();

            return orderedOptions;
        }

        var displayResults = function (votes) {
            var orderedResults = countVotes(votes);
            self.resultOptions.removeAll();
            for (var i = 0; i < orderedResults.length; i++) {

                var option = ko.utils.arrayFirst(self.options(), function (item) {
                    return item.Id == orderedResults[i].Id;
                });

                option.Rank = i + 1;

                self.resultOptions.push(option);
            }
        }

        self.doVote = function (data, event) {
            var userId = Common.currentUserId();
            var pollId = Common.getPollId();

            if (userId && pollId) {

                var selectionRows = $('#selectionTable > tbody > tr');

                var selectedOptionsArray = [];
                ko.utils.arrayForEach(self.selectedOptions(), function (selection) {

                    var $optionElement = selectionRows.filter(function () {
                        return $(this).attr('data-id') == selection.Id;
                    });

                    var rank = $optionElement[0].rowIndex;

                    selectedOptionsArray.push({
                        OptionId: selection.Id,
                        PollId: pollId,
                        PollValue: rank
                    });
                });

                // Offset by the first value to account for table headers and sort out 0 index
                var lowestValue = selectedOptionsArray[0].PollValue - 1;
                selectedOptionsArray.map(function (option) {
                    option.PollValue -= lowestValue;
                });

                $.ajax({
                    type: 'PUT',
                    url: '/api/user/' + userId + '/vote',
                    contentType: 'application/json',
                    data: JSON.stringify(selectedOptionsArray),

                    success: function (returnData) {
                        $('#resultSection > div')[0].click();
                    }
                });


            }
        };

        self.getVotes = function (pollId, userId) {
            resetOptions();

            $.ajax({
                type: 'GET',
                url: '/api/user/' + userId + '/poll/' + pollId + '/vote',
                contentType: 'application/json',

                success: function (data) {
                    selectPickedOptions(data);
                }
            });
        };

        self.getResults = function (pollId) {

            $.ajax({
                type: 'GET',
                url: '/api/poll/' + pollId + '/vote',

                success: function (data) {
                    displayResults(data);
                }
            });
        };

        $(document).ready(function () {
            $(".sortable").sortable({
                items: 'tbody > tr',
                connectWith: '.sortable',
                axis: 'y',
                dropOnEmpty: true,
                receive: function (e, ui) {
                    var itemId = ui.item.attr('data-id');
                    var item = ko.utils.arrayFirst(self.options(), function (item) {
                        return item.Id == itemId;
                    });

                    if ($(e.target).hasClass('selection-content')) {
                        self.selectedOptions.push(item);
                    } else {
                        self.selectedOptions.remove(item);
                    }

                    $(this).find("tbody").append(ui.item);
                }
            });
        });

        $.ajax({
            type: 'GET',
            url: '/Partials/VotingStrategies/RankedVoteResults.html',
            dataType: 'html',

            success: function (data) {
                $("#results").append(data);
                ko.applyBindings(self, $('#results')[0]);
            }
        });
    }

});