﻿define('RankedVote', ['jquery', 'knockout', 'jqueryUI', 'Common', 'PollOptions', 'insight', 'jqueryTouch'], function ($, ko, jqueryUI, Common, PollOptions, insight) {

    return function RankedVote(pollId, token) {

        var self = this;
        self.pollOptions = new PollOptions(pollId);
        self.selectedOptions = ko.observableArray();

        self.resultOptions = ko.observableArray();

        self.chartVisible = ko.observable(false);

        var selectPickedOptions = function (votes) {
            var selected = votes.map(function (vote) {
                return ko.utils.arrayFirst(self.pollOptions.options(), function (item) {
                    return item.Id == vote.OptionId;
                });
            });
            self.selectedOptions(selected);
        };

        self.remainOptions = ko.computed(function () {
            var notSelected = function (option) {
                return self.selectedOptions().filter(function (o) { return o.Id === option.Id; }).length === 0;
            };

            return self.pollOptions.options().filter(notSelected);
        });

        var resultsByRound = [];
        var orderedNames = [];
        var chart;
        var roundIndex = 0;
        
        var sortByPollValue = function (a, b) {
            return a.PollValue - b.PollValue;
        }
        
        var sortByBallotCount = function (a, b) {
            return a.ballots.length - b.ballots.length;
        };

        var countVotes = function (votes) {
            var options = [];
            var orderedOptions = [];
            var ballots = [];
            var totalBallots = 0;
            var totalOptions = self.pollOptions.options().length;
            resultsByRound = [];

            for (var k = 0; k < totalOptions; k++) {
                var optionId = self.pollOptions.options()[k].Id;
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

            // Start counting
            while (options.length > 0) {

                // Clear out all ballots from previous round
                options = options.map(function (d) {
                    d.ballots = [];
                    return d;
                });

                var availableOptions = options.map(function (d) { return d.Id; });

                // Sort the votes on the ballots and assign each ballot to first choice
                ballots.forEach(function (ballot) {
                    ballot.sort(sortByPollValue);
                    var availableChoices = ballot.filter(function (option) { return $.inArray(option.OptionId, availableOptions) != -1; })
                    if (availableChoices.length > 0) {
                        var firstChoiceId = availableChoices[0].OptionId
                        var firstChoiceOption = options.filter(function (option) { return option.Id == firstChoiceId })[0];
                        firstChoiceOption.ballots.push(ballot)
                    }
                });

                options.sort(sortByBallotCount);

                //Convert into a chartable style
                var roundOptions = options.map(function (d) {
                    var matchingOption = $.grep(self.pollOptions.options(), function (opt) { return opt.Id == d.Id })[0];
                    return {
                        Name: matchingOption.Name,
                        BallotCount: d.ballots.length,
                        Voters: d.ballots.map(function (x) { return x[0].User.Name + " (#" + (x.map(function (y) { return y.OptionId }).indexOf(matchingOption.Id) + 1) + ")"; })
                    }
                });

                //Add in removed options as 0-value
                orderedOptions.forEach(function (d) {
                    var matchingOption = $.grep(self.pollOptions.options(), function (opt) { return opt.Id == d.Id })[0];
                    roundOptions.push({
                        Name: matchingOption.Name,
                        BallotCount: 0,
                        Voters: []
                    });
                })

                // End if we have a majority
                if (options[options.length - 1].ballots.length > totalBallots / 2) {

                    //Mark all other remaining results as having lost
                    for (var i = 0; i < options.length - 1; i++) {
                        options[i].rank = 2;
                    }

                    resultsByRound.push(roundOptions);
                    break;
                }

                if (options[0].ballots.length > 0) {
                    resultsByRound.push(roundOptions);
                }

                // Remove all last place options
                var lastPlaceOption = options[0];
                var lastPlaceBallotCount = lastPlaceOption.ballots.length;

                var removedOptions = options.filter(function (d) { return d.ballots.length == lastPlaceBallotCount; });
                // Track at what point an option was removed from the running
                removedOptions.map(function (d) {
                    d.rank = options.length - removedOptions.length + 1;
                    return d;
                });
                orderedOptions.push.apply(orderedOptions, removedOptions);

                options = options.filter(function (d) { return d.ballots.length > lastPlaceBallotCount; });
            }

            orderedOptions.push.apply(orderedOptions, options);
            orderedOptions.reverse();

            return orderedOptions;
        }

        var displayResults = function (votes) {
            var orderedResults = countVotes(votes);

            orderedNames = orderedResults.map(function (d) {
                var matchingOption = $.grep(self.pollOptions.options(), function (opt) { return opt.Id == d.Id })[0];
                return matchingOption.Name;
            });

            //Exit early if data has not changed
            if (chart && JSON.stringify(resultsByRound) == JSON.stringify(chart.series().slice(0, chart.series().length - 1).map(function (d) { return d.data.rawData() })))
                return;

            // Fill in the table
            self.resultOptions.removeAll();
            for (var i = 0; i < orderedResults.length; i++) {

                var option = ko.utils.arrayFirst(self.pollOptions.options(), function (item) {
                    return item.Id == orderedResults[i].Id;
                });
                option.Rank = orderedResults[i].rank || 1;
                self.resultOptions.push(option);
            }

            self.drawChart(resultsByRound.slice(0));
        }

        self.doVote = function (data, event) {
            var userId = Common.currentUserId(pollId);

            if (userId && pollId) {
                var token = token || Common.sessionItem("token", pollId);
                // Convert selected options to ranked votes
                var selectedOptionsArray = self.selectedOptions().map(function (option, index) {
                    return {
                        OptionId: option.Id,
                        PollId: pollId,
                        PollValue: index + 1,
                        Token: { TokenGuid: token }
                    };
                });
                
                $.ajax({
                    type: 'PUT',
                    url: '/api/user/' + userId + '/poll/' + pollId + '/vote',
                    contentType: 'application/json',
                    data: JSON.stringify(selectedOptionsArray),

                    success: function (returnData) {
                        if (self.onVoted) self.onVoted();
                    },

                    error: Common.handleError
                });
            }
        };

        self.getVotes = function (pollId, userId) {
            $.ajax({
                type: 'GET',
                url: '/api/user/' + userId + '/poll/' + pollId + '/vote',
                contentType: 'application/json',

                success: function (data) {
                    data.sort(sortByPollValue);
                    selectPickedOptions(data);
                },

                error: Common.handleError
            });
        };

        self.displayResults = function (data) {
            displayResults(data);
        }

        self.initialise = function (pollData) {

            self.pollOptions.initialise(pollData);

            $(".sortable").sortable({
                items: 'tbody > tr:not(#newOptionRow)',
                connectWith: '.sortable',
                axis: 'y',
                dropOnEmpty: true,
                receive: function (e, ui) {
                    var votes = [];
                    $('#selectionTable tr.clickable').each(function (i, row) {
                        votes.push({
                            OptionId: $(row).attr('data-id')
                        });
                    });

                    $(".sortable").sortable("cancel");
                    selectPickedOptions(votes);
                }
            });
        };

        // TODO: Extract chart code from viewModel class - ideally
        // into a shared custom knockout binding to bind to data
        self.drawChart = function (data) {
            // Hack to fix insight's lack of data reloading
            $("#chart-results").html('');
            $("#chart-buttons").html('');

            if (!self.chartVisible() || data.length == 0)
                return;

            //Get voter count
            var voterCount = 0;
            data[0].forEach(function (d) {
                voterCount += d.Voters.length;
            });

            chart = new insight.Chart('', '#chart-results')
            .width($("#chart-results").width())
            .height($("#chart-results").width());

            var xAxis = new insight.Axis('', insight.scales.ordinal)
                .isOrdered(true)
                .orderingFunction(function (a, b) {
                    var finalAIndex = orderedNames.indexOf(a.Name);
                    var finalBIndex = orderedNames.indexOf(b.Name);
                    return finalAIndex - finalBIndex;
                })
                .tickLabelRotation(45);

            var yAxis = new insight.Axis('Votes', insight.scales.linear)
                .tickFrequency(1)
                .axisRange(-0.1, voterCount);
            chart.xAxis(xAxis);
            chart.yAxis(yAxis);
            chart.legend(new insight.Legend());

            chart.series([]);

            var seriesIndex = roundIndex;

            //Add a button to display individual rounds
            var button = $("#chart-buttons").append('<button class="btn btn-primary" onclick="self.filterRounds(0)">All Rounds</button>');

            for (var i = 1; i <= data.length; i++) {
                $("#chart-buttons").append('<button class="btn btn-primary" onclick="self.filterRounds(' + i + ')">Round ' + i + '</button>');
            }

            //Disable the currently selected button
            var currentRoundButton = $("#chart-buttons").children()[roundIndex];
            $(currentRoundButton).attr('disabled', 'disabled');

            //Filter to a specific round
            if (roundIndex > 0) {
                data = data.slice(roundIndex - 1, roundIndex);
                seriesIndex = roundIndex - 1;
            }

            //Map out each round
            data.forEach(function (roundData) {

                var voteData = new insight.DataSet(roundData);
                var series = new insight.ColumnSeries('votes_' + (seriesIndex++), voteData, xAxis, yAxis)
                .keyFunction(function (d) {
                    return d.Name;
                })
                .valueFunction(function (d) {

                    return d.BallotCount;
                })
                .title('Round ' + seriesIndex)
                .tooltipFunction(function (d) {
                    if (d.Voters.length > 0) {
                        return d.Voters.toString().replace(/,/g, "<br />");
                    }
                    else
                        return "Option eliminated";
                });

                var newSeries = chart.series()
                newSeries.push(series);
                chart.series(newSeries);
            });

            //Annotate the decision line
            var series = new insight.MarkerSeries('marker', new insight.DataSet(data[0]), xAxis, yAxis)
            .keyFunction(function (d) {
                return d.Name;
            })
            .valueFunction(function (d) {
                return voterCount / 2;
            })
            .tooltipFunction(function (d) {
                return "50% Majority";
            })
            .widthFactor(1.1)
            .thickness(2)
            .title('Majority');

            var newSeries = chart.series()
            newSeries.push(series);
            chart.series(newSeries);

            chart.draw();
        };

        self.toggleChartVisible = function () {
            self.chartVisible(!self.chartVisible());

            //Redraw with all results
            self.filterRounds(0);
        }

        self.filterRounds = function (filterIndex) {
            roundIndex = filterIndex;
            self.drawChart(resultsByRound);
        }

    }
});