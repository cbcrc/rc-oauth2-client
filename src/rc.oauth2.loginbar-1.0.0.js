//
// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//


//**
// define() must be activated for Sample using solely RequireJS modules
// see readme.md for more details
//**
//define(["module","rcOAuth2Client"], function (module, rcOAuth2Client) {

var rcOAuth2LoginBar = (function (window) {
    "use strict";
    var debugActive = false;
    var oauthClient;
    var container;
    var containerId = "rc-oauth2-loginbar";
    var loginLinkId = "rc-oauth2-login-link";
    var logoutLinkId = "rc-oauth2-logout-link";
    var config = {
        locale:"fr"
        ,i18n: {}
        ,forceLogin: false
        ,vfDependant: false
        ,modalMode: false
        ,dropMenuItems: []
        ,loginComplete: null
        ,logoutComplete: null
    };

    var $ = function (needle) {
        if (needle.indexOf(".") === 0) {
            return window.document.getElementsByClassName(needle.split(".")[1]);
        } else {
            return window.document.getElementById(needle);
        }
    };
    var log = function (msg) {
        if ((debugActive === true) && console) { console.log("rcOAuth2LoginBar: " + msg); }
    };
    var isFunction = function (fn) {
        return (typeof fn === "function");
    };
    var addEvent = function (element, event, fn) {
        if (element.addEventListener) {
            element.addEventListener(event, fn, false);
        } else if (element.attachEvent) {
            //support older browers
            element.attachEvent('on' + event, fn);
        }
    };
    var preventDefault = function (evt) {
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
    var toggleSlide = function (elem, height) {
        if (elem) {
            var initSpeed = config.dropMenuItems.length || 1;
            var initIncrement = config.dropMenuItems.length || 1;
            var show =
                function () {
                    var currHeight = 0;
                    var speed = initSpeed;
                    var increment = initIncrement;
                    if (elem.style && elem.style.height) {
                        currHeight = parseInt(elem.style.height.split("px")[0]);
                    } else {
                        elem.style.height = "0px";
                    }
                    if (currHeight < height) {
                        //add easing
                        if (currHeight >= (height * .90)) {
                            speed = 10;
                            increment = 1;
                        }
                        elem.style.height = (currHeight + increment) + "px";
                        setTimeout(show, speed);
                    } else {
                        elem.style.overflow = "";
                        elem.style.height = "";
                    }
                };
            var hide = function () {
                elem.style.display = "none";
            };

            if (elem.style.display == "none") {
                elem.style.overflow = "hidden";
                elem.style.display = "block";
                show();
            } else {
                hide();
            }
        } else {
            log("toggleSlide: element is undefined");
        }
    };
    var hasClass = function (elem, className) {
        return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
    };
    var addClass = function (elem, className) {
        if (!hasClass(elem, className)) {
            elem.className += ' ' + className;
        }
    };
    var removeClass = function (elem, className) {
        var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, ' ') + ' ';
        if (hasClass(elem, className)) {
            while (newClass.indexOf(' ' + className + ' ') >= 0) {
                newClass = newClass.replace(' ' + className + ' ', ' ');
            }
            elem.className = newClass.replace(/^\s+|\s+$/g, '');
        }
    };
    var toggleClass = function (elem, className) {
        if (elem) {
            if (hasClass(elem, className)) {
                removeClass(elem, className);
            } else {
                addClass(elem, className);
            }
        }
    }; 

    var isVf = function () {
        return (config.vfDependant === true) && window.viafoura;
    };
    var setI18n = function () {

        config.i18n = config.i18n || {};

        if (!config.i18n.fr) config.i18n.fr = {};
        config.i18n.fr.signin = "Connexion";
        config.i18n.fr.signout = "Déconnexion";
        if (!config.i18n.fr.loggedInMessage) config.i18n.fr.loggedInMessage = "{0}";

        if (!config.i18n.en) config.i18n.en = {};
        config.i18n.en.signin = "Sign-in";
        config.i18n.en.signout = "Sign-out";
        if (!config.i18n.en.loggedInMessage) config.i18n.en.loggedInMessage = "{0}";

    };

    var init = function (oauth2Client, settings, debug) {

        oauthClient = oauth2Client;

        if (debug === true) {
            debugActive = true;
            log("init");
        }

        // check for receiving container
        container = $(containerId);
        if (container == null) {
            throw new Error("Please ensure that you have defined a container element with id " + containerId);
        }

        //update module settings 
        setConfig(config, settings);
        //add settings to i18n
        setI18n();

        //start markup insertion flow
        oauthClient.getUserInfo({
            done: function (httpStatus, data) { getUserInfoDone(httpStatus, data); },
            fail: function (httpStatus, statusText, caseLabel) { getUserInfoFail(httpStatus, statusText, caseLabel); }
        });
    };

    var getLoginMarkup = function () {
        var locale = config.locale;
        var i18n = config.i18n;
        var html =
            '<div id="widgetLogin_btnLogin"><a id="' + loginLinkId + '" href="javascript:;">' + i18n[locale].signin + '</a></div>';
        return html;
    };
    var injectLoginMarkup = function () {
        container.innerHTML = getLoginMarkup();
        addEvent($(loginLinkId), "click", login);
    };

    var getLoggedInMarkup = function (data) {
        var locale = config.locale;
        var i18n = config.i18n;
        var html = '<div id="widgetLogin">'
            + '<div id="widgetLogin_MainContainer">'
            + '<div id="widgetLogin_containerUserInfo">'
            + '<span class="wgt_userName">' + i18n[locale].loggedInMessage.replace(/\{0\}/gi, ((data.given_name) ? data.given_name : ((data.name) ? data.name.split(" ")[0] : ""))) + '</span>'
            + '<span class="wgt_userImg">';
        if (data.picture) {
            html += '<span class="wgt_userProfileImage"><img id="smallProfilPict" class="smallCircular" width="37" alt="' + data.name + '" src="' + data.picture + '"/></span>';
        }
        html += '</span>'
        + '<span class="wgt_containerIconeFleche">'
        + '<span class="wgt_iconeFleche"></span>'
        + ' </span>'
        + '</div>'
        + '<div id="widgetLogin_containerSousMenu">'
        + '<div class="wgt_sousMenuWrapper">'
        + '<ul id="widgetLogin_DropMenuItems">'
        + '<li>'
        + '<div class="wgt_arrow"></div>'
        + '</li>'
        + '<li><a id ="' + logoutLinkId + '" href="javascript:;">' + i18n[locale].signout + '</a></li>'
                    + '</ul>'
                + '</div>'
            + '</div>'
        + '</div>'
    + '</div>';
        return html;
    };
    var injectLoggedInMarkup = function (userInfo) {
        container.innerHTML = getLoggedInMarkup(userInfo);
        injectLoggedInMarkupDropMenuItems();
        addEvent($(logoutLinkId), "click", logout);
        addDropMenuEvents();
    };
    var injectLoggedInMarkupDropMenuItems = function () {
        //
        // add drop menu items specified by client
        //ATTENTION: injectLoggedInMarkup() should have been called before
        var items = config.dropMenuItems;
        var l = items.length - 1;
        var n = l;
        var itemsContainer = $("widgetLogin_DropMenuItems");
        var i18n = config.i18n;
        var locale = config.locale;
        for (n; n >= 0; n--) {
            var liElem = document.createElement("LI");
            var aElem = document.createElement("A");
            var aText = window.document.createTextNode(i18n[locale][items[n].i18nLabel]);
            aElem.appendChild(aText);
            if (isFunction(items[n].action)) {
                addEvent(aElem, "click", items[n].action);
                aElem.setAttribute("href", "javascript:;");
            } else if (typeof items[n].action === "string") {
                aElem.setAttribute("href", items[n].action);
            }
            liElem.appendChild(aElem);
            itemsContainer.insertBefore(liElem, itemsContainer.lastElementChild);
        }
    };
    var addDropMenuEvents = function () {
        var el = $("widgetLogin_containerSousMenu");
        var arrowEl = $(".wgt_iconeFleche")[0];
        el.style.display = "block";
        var height = el.clientHeight;
        el.style.display = "none";
        el.style.height = "0px";

        addEvent($("widgetLogin"), "click", function (event) {
            preventDefault(event);
            toggleSlide(el, height);
            toggleClass(arrowEl, "flecheToggleRotate");
        });
        addEvent(window.document, "click", function () {
            el.style.display = "none";
            removeClass(arrowEl, "flecheToggleRotate");
        });
    };

    var getUserInfoDone = function (httpStatus, data) {
        log("getUserInfoDone");
        if (httpStatus === 200) {
            log(">> status=" + httpStatus);
            injectLoggedInMarkup(data);
            if (isFunction(config.loginComplete)) {
                var accessToken = oauthClient.getAccessToken();
                config.loginComplete(accessToken);
            }
        } else { //4xx (401) or 5xx
            getUserInfoFail(httpStatus, "getUserInfoDone called with a 4xx/5xx HTTP status", "loginbar: getUserInfoDone");
        }
    };
    var getUserInfoFail = function (httpStatus, statusText, caseLabel) {
        log("getUserInfoFail");
        log(">> status= " + httpStatus + ", text= " + statusText + ", case= " + caseLabel);
        injectLoginMarkup();
        if (config.forceLogin === true) {
            login();
        }
    };

    var login = function (event) {
        if (config.modalMode) {
            oauthClient.login(loginDelegate);
        } else {
            oauthClient.login();
        };
    };
    var loginDelegate = function (url) {
        //
        //temporary pop-up window functionality. Will be replaced with properly branded modal
        window.open(url, "pop", "scrollbars=yes,resizable=yes,,width=600,height=800");
    };
    var logout = function (event) {

        oauthClient.logout(
             function (httpStatus, data) {
                 log("logout");

                 if (data) {
                     var result = data.result;
                 }
                 if (isVf()) {
                     window.viafoura.session.logout();
                 }
                 injectLoginMarkup(getLoginMarkup());

                 if (isFunction(config.logoutComplete)) {
                     config.logoutComplete(event);
                 }
             }
        );
    };
    return {
        init: init
    };
}(window));

//    rcOAuth2LoginBar.init( rcOAuth2Client, module.config().settings, module.config().debug);
//    return rcOAuth2LoginBar;
//});