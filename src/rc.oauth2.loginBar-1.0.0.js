//
// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//


var rcOAuth2 = rcOAuth2 || {};

 

rcOAuth2.loginBar = (function (window, oauth2Client) {
    "use strict";
    var debug = false;
    var _settings = {
        isForceLogin: false
        , isVfLogout: false
        , isModalMode: true
        , dropMenuItemsMarkup: {
            /*valid settings: */
        }
        , welcomebackMessage: "{0}"
    };
    var log = function (msg) {
        if (debug) console.log(msg);
    };
    var $ = function (id) {
        return window.document.getElementById(id);
    };
    var container;
    var init = function (settings, isDebug) {
        if (isDebug === true) debug = true;
        // check for receiving container
        var containerId = "rc-oauth-loginbar";
        container = $(containerId);
        if (container == null) {
            throw new Error("Please ensure that you have defined a container element with id " + containerId);
        }

        //update module settings 
        setConfig(_settings, settings);

        //start markup insertion flow
        oauth2Client.getUserInfo({
            done: function (httpStatus, data) { getUserInfoDone(httpStatus, data); },
            fail: function (httpStatus, statusText, caseLabel) { getUserInfoFail(httpStatus, statusText, caseLabel); }
        });
    };
    var setConfig = function (target, source) {
        for (var t in target) {
            for (var s in source) {
                if (t == s) {
                    target[t] = source[s];
                    break;
                }
            }
        }
    };
    var getConfig = function (target, prop) {
        return target[prop];
    };
    var getLoginMarkup = function () { return "<div><a href='javascript:;' onclick='rcOAuth2.loginBar.login();return false;'>Login</a></div>"; };
    var getWelcomebackMarkup = function (userScreenName) {
        return "<div>" + getConfig(_settings, "welcomebackMessage").replace(/\{0\}/gi, userScreenName) + "</div>"
    + "<div><a href='javascript:;' onclick='rcOAuth2.loginBar.logout();return false;'>Logout</a></div>";
    };
    var injectMarkup = function (html) {
        container.innerHTML = html;
    };
    var getUserInfoDone = function (httpStatus, data) {

        if (httpStatus === 200) {
            data = JSON.parse(data);
            injectMarkup(getWelcomebackMarkup(data.name));
        } else if (httpStatus === 401) {
            container.innerHTML = getLoginMarkup();
            if (getConfig(_settings, "isForceLogin") === true) {
                login(loginDelegate);
            }
        } else {
            injectMarkup(getLoginMarkup());
        }
    };
    var getUserInfoFail = function (httpStatus, statusText, caseLabel) {
        container.innerHTML = getLoginMarkup();
    };
    var login = function () {
        if (getConfig(_settings, "isModalMode") === true) {
            oauth2Client.login(loginDelegate);
        } else {
            oauth2Client.login();
        };
    };
    var loginDelegate = function (url) {
        window.open(url, "pop", "scrollbars=yes,resizable=yes,,width=600,height=800");
    };
    var logout = function () {
        var isVfLogout = getConfig(_settings, "isVfLogout");
        oauth2Client.logout({
            done: function (httpStatus, data) {
                if (isVfLogout === true) window.viafoura.session.logout();
                injectMarkup(getLoginMarkup());
            }
        });
    };
    return {
        init: init,
        login: login,
        logout: logout
    };
}(window, rcOAuth2.client));


