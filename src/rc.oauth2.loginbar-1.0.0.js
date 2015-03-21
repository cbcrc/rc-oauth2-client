﻿//
// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

//--
//activate for Sample using entirely RequireJS modules
// see require.rc-oauth2-testclient.html
//--
//define(["module","rcOAuth2Client"], function (module, rcOAuth2Client) {

var rcOAuth2LoginBar = (function (window) {
    "use strict";
    var debug = false;
    var oauthClient;
    var container;
    var containerId = "rc-oauth2-loginbar";
    var loginLinkId = "rc-oauth2-login-link";
    var logoutLinkId = "rc-oauth2-logout-link";
    var config = {
        isForceLogin: false
        , isVfLogout: false
        , isModalMode: true
        , dropMenuItemsMarkup: []
        , welcomebackMessage: "{0}"
    };
    var log = function (msg) {
        if (debug && console) console.log(msg);
    };
    var $ = function (id) {
        return window.document.getElementById(id);
    };
    var addEvent = function (element, event, fn) {
        if (element.addEventListener) {
            element.addEventListener(event, fn, false);
        } else if (element.attachEvent) {
            //support older browers
            element.attachEvent('on' + event, fn);
        }
    };
    var preventDefault = function(evt) {
        if (evt instanceof Event) {
            if (evt.preventDefault) {
                evt.preventDefault();
                evt.stopPropagation();
            } else if (event) {
                // IE uses the global event variable
                event.returnValue = false;
            }
        }
    };
    var init = function (oauth2Client, settings, isDebug) {
        
        oauthClient = oauth2Client;

        if (isDebug === true) debug = true;

        // check for receiving container
        container = $(containerId);
        if (container == null) {
            throw new Error("Please ensure that you have defined a container element with id " + containerId);
        }

        //update module settings 
        setConfig(config, settings);

        //start markup insertion flow
        oauthClient.getUserInfo({
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
    var getLoginMarkup = function () { return "<div><a id='" + loginLinkId + "' href='javascript:;'>Login</a></div>"; };
    var getWelcomebackMarkup = function (userScreenName) {
        return "<div>" + getConfig(config, "welcomebackMessage").replace(/\{0\}/gi, userScreenName) + "</div>"
    + "<div><a id ='" + logoutLinkId + "' href='javascript:;'>Logout</a></div>";
    };
    var injectLoginMarkup = function (html) {
        container.innerHTML = html;
        addEvent($(loginLinkId), "click", login);
    };
    var injectWelcomebackMarkup = function (html) {
        container.innerHTML = html;
        addEvent($(logoutLinkId), "click", logout);
    };
    var getUserInfoDone = function (httpStatus, data) {
        if (httpStatus === 200) {
            data = JSON.parse(data);
            injectWelcomebackMarkup(getWelcomebackMarkup(data.name));
        } else if (httpStatus === 401) {
            injectLoginMarkup(getLoginMarkup());
            if (getConfig(config, "isForceLogin") === true) {
                login(loginDelegate);
            }
        } else {
            injectLoginMarkup(getLoginMarkup());
        }
    };
    var getUserInfoFail = function (httpStatus, statusText, caseLabel) {
        injectLoginMarkup(getLoginMarkup());
    };
    var login = function () {
        if (getConfig(config, "isModalMode") === true) {
            oauthClient.login(loginDelegate);
        } else {
            oauthClient.login();
        };
    };
    var loginDelegate = function (url) {
        window.open(url, "pop", "scrollbars=yes,resizable=yes,,width=600,height=800");
    };
    var logout = function () {
        var isVfLogout = getConfig(config, "isVfLogout");
        oauthClient.logout(
             function (httpStatus, data) {
                 if (isVfLogout === true) window.viafoura.session.logout();
                 injectLoginMarkup(getLoginMarkup());
             }
        );
    };
    return {
        init: init
    };
}(window));

//    rcOAuth2LoginBar.init( rcOAuth2Client, module.config().settings, module.config().isDebug);
//    return rcOAuth2LoginBar;
//});





