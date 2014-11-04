﻿function HomeViewModel() {
    var self = this;

    self.sessions = ko.observableArray();

    self.keyIsEnter = function (key, callback) {
        if (key && key.keyCode == 13)
        {
            callback();
        }
    }

    // Do login
    self.submitLogin = function () {
        $.ajax({
            type: 'PUT',
            url: '/api/user',
            contentType: 'application/json',
            data: JSON.stringify({
                Name: $("#Name").val()
            }),

            success: function (data) {
                userId = data;
                localStorage["userId"] = userId;
                window.location = "vote?session=" + self.sessionId;
            }
        });
    }

    self.submitSession = function () {
        self.sessionId = $("#session-select").val();
        window.location = "?session=" + self.sessionId;
    }

    self.createSession = function () {
        $.ajax({
            type: 'POST',
            url: '/api/session',
            contentType: 'application/json',

            data: JSON.stringify({
                Name: $("#session-create").val(),
                OptionSetId: 1
            }),

            success: function (data) {
                self.sessionId = data;
                window.location = "?session=" + self.sessionId;
            }
        })
    }

    self.allSessions = function () {
        $.ajax({
            type: 'GET',
            url: '/api/session',

            success: function (data) {
                self.sessions(data);
            }
        })
    }

    $(document).ready(function () {
        self.sessionId = getSessionId();
        self.userId = localStorage["userId"];

        if (!self.sessionId) {
            self.allSessions();
            $("#login-box").hide();
            $("#sessions").show();
        }
        else if(!self.userId){
            $("#sessions").hide();
            $("#login-box").show();
        } else {
            window.location = "vote/?session=" + self.sessionId;
        }

        $("#Name-submit").click(self.submitLogin);
        //Submit on pressing return key
        $("#Name").keypress(function (event) { self.keyIsEnter(event, self.submitLogin); });

        //Add option on pressing return key
        $("#newOptionRow").keypress(function (event) { self.keyIsEnter(event, self.addOption); });

        //Create session on pressing return key
        $("#session-create").keypress(function (event) { self.keyIsEnter(event, self.createSession); });
    });
}

ko.applyBindings(new HomeViewModel());
