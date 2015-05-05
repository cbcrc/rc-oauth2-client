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
    var markupElemSelector = {
        id: {
            container: "rc-oauth2-loginbar",
            dropMenuContainer: "widgetLogin_containerSousMenu",
            dropMenuItems: "widgetLogin_DropMenuItems",
            dropMenuToggler: "widgetLogin_DropMenuToggler",
            loginWidget: "widgetLogin",
            loginLink: "rc-oauth2-login-link",
            logoutLink: "rc-oauth2-logout-link"
        },
        className: {
            userName: "wgt_userName",
            arrowIcon: "wgt_iconeFleche",
            arrowContainer: "wgt_containerIconeFleche"
        }
    };
    var config = {
        locale: "fr"
        , i18n: {}
        , forceLogin: false
        , vfDependant: false
        , modalMode: false
        , dropMenuItems: []
        , loginComplete: null
        , logoutComplete: null
    };

    //
    //Utilities / Helpers
    //
    var $ = function (needle) {
        var scope = container || window.document;//limit searching to our container!
        if (needle.indexOf(".") === 0) {
            return scope.getElementsByClassName(needle.split(".")[1]);
        } else if (needle.indexOf("#") === 0) {
            return window.document.getElementById(needle.split("#")[1]);// get by Id must use window.document
        } else {
            return scope.getElementsByTagName(needle);
        }
    };
    var log = function (msg) {
        if ((debugActive === true) && console) { console.log("rcOAuth2LoginBar: " + msg); }
    };
    var isFunction = function (fn) {
        return (typeof fn === "function");
    };
    var addEvent = function (elem, evt, fn) {
        if (elem.addEventListener) {
            elem.addEventListener(evt, fn, false);
        } else if (elem.attachEvent) {
            //support older browers
            elem.attachEvent('on' + evt, fn);
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
            var initSpeed = 1;//config.dropMenuItems.length || 1;
            var initIncrement = 8;//config.dropMenuItems.length || 1;
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
                        //log( toggleSlide: "speed:" + speed + ", "increment:"  + increment);
                        setTimeout(show, speed);
                    } else {
                        elem.style.overflow = "";
                        elem.style.height = ""; 
                        elem.style.display = "block";
                    }
                };
            var hide = function () {
                elem.style.display = "none";
            };

            if (elem.style.display == "none") {
                //
                //set-up
                elem.style.overflow = "hidden";
                elem.style.display = "block";
                //
                //action
                show();
            } else {
                //
                //action
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
    var toggleAttribute = function (elem, attrName, valueA, valueB) {
        if (elem) {
            var attr = elem.getAttribute(attrName);
            if (attr === valueA) {
                elem.setAttribute(attrName, valueB);
            } else if (attr === valueB) {
                elem.setAttribute(attrName, valueA);
            }
        }
    };
    var isVf = function () {
        return (config.vfDependant === true) && window.viafoura;
    };
    var setI18n = function () {

        config.i18n = config.i18n || {};

        if (!config.i18n.fr) config.i18n.fr = {};
        config.i18n.fr.loginWidgetAriaLabel = "Barre de connexion au centre des membres";
        config.i18n.fr.loginLinkLabel = "Connexion";
        config.i18n.fr.loginLinkTitle = "Connexion au centre des membres";
        config.i18n.fr.logoutLinkLabel = "Déconnexion";
        config.i18n.fr.logoutLinkTitle = "Déconnexion du centre des membres";
        config.i18n.fr.dropMenuTogglerLabel = "Ouvrez le menu d'options de compte";
        config.i18n.fr.dropMenuContainerAriaLabel = "Menu d'options de compte";
        config.i18n.fr.profileImgAlt = "Avatar d'utilisateur";
        config.i18n.fr.targetBlankText = "(nouvelle fenêtre)";
        if (!config.i18n.fr.loggedInMessage) config.i18n.fr.loggedInMessage = "{0}";

        if (!config.i18n.en) config.i18n.en = {};
        config.i18n.en.loginWidgetAriaLabel = "Members Center account information";
        config.i18n.en.loginLinkLabel = "Sign-in";
        config.i18n.en.loginLinkTitle = "Sign-in to the members center";
        config.i18n.en.logoutLinkLabel = "Sign-out";
        config.i18n.en.logoutLinkTitle = "Sign-out of the members center";
        config.i18n.en.dropMenuTogglerLabel = "Expand the account options menu";
        config.i18n.en.dropMenuContainerAriaLabel = "Account options menu";
        config.i18n.en.profileImgAlt = "User profile picture";
        config.i18n.en.targetBlankText = "(new window)";
        if (!config.i18n.en.loggedInMessage) config.i18n.en.loggedInMessage = "{0}";

    };

    //
    // Intitialization
    //
    var init = function (oauth2Client, settings, debug) {

        oauthClient = oauth2Client;

        if (debug === true) {
            debugActive = true;
            log("init");
        }

        // check for receiving container
        container = $("#" + markupElemSelector.id.container);
        if (container == null) {
            throw new Error("Please ensure that you have defined a container element with id " + markupElemSelector.id.container);
        }

        //update module settings 
        setConfig(config, settings);

        //add settings to i18n
        setI18n();

        //start markup insertion flow
        getUserInfo();
    };

    //
    // Logic
    //
    var getLoginMarkup = function () {
        var locale = config.locale;
        var i18n = config.i18n;
        var html =
            '<div id="widgetLogin_btnLogin" aria-label="' + i18n[locale].loginWidgetAriaLabel + '"><button type="button" id="' + markupElemSelector.id.loginLink + '"  title="' + i18n[locale].loginLinkTitle + '">' + i18n[locale].loginLinkLabel + '</button></div>';
        return html;
    };
    var injectLoginMarkup = function () {
        container.innerHTML = getLoginMarkup();
        addEvent($("#" + markupElemSelector.id.loginLink), "click", login);
    };

    var getLoggedInMarkup = function (userInfo) {
        var locale = config.locale;
        var i18n = config.i18n;
        var html = '<div id="' + markupElemSelector.id.loginWidget + '" aria-label="' + i18n[locale].loginWidgetAriaLabel + '">'
            + '<div id="widgetLogin_MainContainer">'
            + '<div id="widgetLogin_containerUserInfo">'
            + '<button type="button" id="' + markupElemSelector.id.dropMenuToggler + '" aria-controls="' + markupElemSelector.id.dropMenuContainer + '" aria-expanded="false">'
            + '<span class="wgt_userImg">'
            + '     <span class="wgt_userProfileImage">';
        if (userInfo.picture && userInfo.picture != " " && userInfo.picture.indexOf("avatar_default") == -1) {
            html += '<img id="smallProfilPict" class="smallCircular" width="37" alt="' + i18n[locale].profileImgAlt + " " + userInfo.name + '" src="' + userInfo.picture + '"/>';
        } else {
            html += '<span class="icon-avatar_default"></span>';
        }
        html += '</span>'
            + '     </span>'
            + '<span class="' + markupElemSelector.className.userName + '">' + getLoggedInMessage(userInfo) + '</span>'
            + '<span class="wgt_label">' + i18n[locale].dropMenuTogglerLabel + '</span>'
            + '<span class="' + markupElemSelector.className.arrowContainer + '" >'
            + '<span class="' + markupElemSelector.className.arrowIcon + '"></span>'
            + '</span>'
            + '</button>'
            + '</div>'
            + '<div id="' + markupElemSelector.id.dropMenuContainer + '" aria-label="' + i18n[locale].dropMenuContainerAriaLabel + '">'
            + '<div class="wgt_sousMenuWrapper">'
            + '<ul id="' + markupElemSelector.id.dropMenuItems + '" role="menu">'
                // + '<li>'
                //+ '<div class="wgt_arrow"></div>'
                // + '</li>'
            + '<li role="menuitem"><button type="button" id ="' + markupElemSelector.id.logoutLink + '"  title="' + i18n[locale].logoutLinkTitle + '">' + i18n[locale].logoutLinkLabel + '</button></li>'
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
        addEvent($("#" + markupElemSelector.id.logoutLink), "click", logout);
        addDropMenuEvents();
    };
    var injectLoggedInMarkupDropMenuItems = function () {
        //
        // add drop menu items specified by client
        //ATTENTION: injectLoggedInMarkup() should have been called before
        var items = config.dropMenuItems;
        var l = items.length - 1;
        var n = 0;
        var ulElem = $("#" + markupElemSelector.id.dropMenuItems);
        var i18n = config.i18n;
        var locale = config.locale;
        for (n; n <= l; n++) {
            var item = items[n];

            var liElem = document.createElement("LI");
            liElem.setAttribute("role", "menuitem"); //a11y prop 

            var aElem;
            if (isFunction(item.action)) {
                aElem = document.createElement("BUTTON");
                addEvent(aElem, "click", item.action);
                aElem.setAttribute("type", "button");
            } else if (typeof item.action === "string") {
                aElem = document.createElement("A");
                aElem.setAttribute("href", item.action);
            }
            var aText = window.document.createTextNode(i18n[locale][item.label]);
            aElem.appendChild(aText);
            var aTitle = i18n[locale][item.title];
            var aTarget = item.target;
            var targetBlankText = i18n[locale]["targetBlankText"];
            if (aTitle) { // a11y note: title is not needed if label is descriptive enough
                if (aTarget) {
                    aElem.setAttribute("target", aTarget);
                    if (targetBlankText && aTarget == "_blank") {
                        aTitle += " " + targetBlankText; //a11y 
                    }
                }
                aElem.setAttribute("title", aTitle); //a11y prop
            }

            liElem.appendChild(aElem);
            ulElem.insertBefore(liElem, ulElem.lastElementChild);
        }
    };
    var getLoggedInMessage = function (userInfo) {
        var locale = config.locale;
        var i18n = config.i18n;
        var msg = i18n[locale].loggedInMessage.replace(/\{0\}/gi, ((userInfo.given_name) ? userInfo.given_name : ((userInfo.name) ? userInfo.name.split(" ")[0] : "")));
        return msg;
    };
    var updateLoggedInMarkup = function (userInfo) {
        var elem = $("." + markupElemSelector.className.userName)[0];
        elem.innerHTML = getLoggedInMessage(userInfo);
    };
    var addDropMenuEvents = function () {
        var togglerElem = $("#" + markupElemSelector.id.dropMenuToggler);
        var el = $("#" + markupElemSelector.id.dropMenuContainer);
        var arrowEl = $("." + markupElemSelector.className.arrowIcon)[0];
        el.style.display = "block";
        var height = el.clientHeight;
        el.style.display = "none";
        el.style.height = "0px";

        addEvent(togglerElem, "click", function (event) {
            preventDefault(event);
            toggleSlide(el, height);
            toggleClass(arrowEl, "flecheToggleRotate");
            toggleAttribute(this, "aria-expanded", "true", "false"); //a11y prop
        });
        addEvent(window.document, "click", function (event) {
            el.style.display = "none";
            removeClass(arrowEl, "flecheToggleRotate");
            toggleAttribute(togglerElem, "aria-expanded", "true", "false"); //a11y prop
        });
    };

    var getUserInfo = function () {
        oauthClient.getUserInfo({
            forceRefresh: config.forceLogin,
            done: getUserInfoDone,
            fail: getUserInfoFail
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
            oauthClient.login(loginUrlHandler);
        } else {
            oauthClient.login();
        };
    };
    var loginUrlHandler = function (url) {
        //
        //temporary pop-up window functionality. Will be replaced with properly branded modal
        window.open(url, "pop", "scrollbars=yes,resizable=yes,,width=600,height=800");
    };

    var logout = function (event) {
        oauthClient.logout(logoutComplete);
    };
    var logoutComplete = function (httpStatus, data) {
        log("logout");
        log(">> httpStatus=" + httpStatus + ", result:" + data.result);

        if (data) {
            var result = data.result;
        }
        if (isVf()) {
            window.viafoura.session.logout();
        }
        injectLoginMarkup(getLoginMarkup());

        if (isFunction(config.logoutComplete)) {
            config.logoutComplete();
        }
    };

    var refresh = function (settings) {
        //
        //settings supported: done fail
        //   
        settings = settings || {};

        log("refresh");

        // if user is logged in
        if (!$("." + markupElemSelector.className.userName)[0]) {
            if (isFunction(settings.fail)) {
                settings.fail(403, "user is not logged in; refresh call not applicable", "loginbar: refresh");
            }
        } else {
            oauthClient.getUserInfo({
                forceRefresh: true,
                done: (function (settings) {
                    return function (httpStatus, data) {
                        refreshDone(httpStatus, data, settings);
                    };
                })(settings),
                fail: (function (settings) {
                    return function (httpStatus, statusText, caseLabel) {
                        refreshFail(httpStatus, statusText, caseLabel, settings);
                    };
                })(settings)
            });
        }
    };
    var refreshDone = function (httpStatus, data, settings) {
        log("refreshDone");
        log(">> status = " + httpStatus);
        if (httpStatus === 200) {
            updateLoggedInMarkup(data);
            if (settings && isFunction(settings.done)) {
                settings.done(httpStatus, data);
            }
        } else { //4xx (401) or 5xx
            refreshFail(httpStatus, "refreshDone called with a 4xx/5xx HTTP status", "loginbar: refreshDone", settings);
        }
    };
    var refreshFail = function (httpStatus, statusText, caseLabel, settings) {
        log("refreshFail");
        log(">> status = " + httpStatus + ", text= " + statusText + ", case= " + caseLabel);
        if (settings && isFunction(settings.fail)) {
            settings.fail(httpStatus, statusText, caseLabel);
        }
        injectLoginMarkup();
        if (config.forceLogin === true) {
            login();
        }
    };

    return {
        init: init,
        refresh: refresh
    };
}(window));

//    rcOAuth2LoginBar.init( rcOAuth2Client, module.config().settings, module.config().debug);
//    return rcOAuth2LoginBar;
//});