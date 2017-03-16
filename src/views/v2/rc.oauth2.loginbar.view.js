//
// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

//
// Loginbar View JS v2
//
(function (root, factory) {
    //
    //AMD support
    //
    if (typeof define === "function" && define.amd) {
        define(["module"], function (module) {
            var instance = factory;
            if (module.config().hasOwnProperty("settings")) {
                instance.init(module.config().settings, module.config().debug);
            }
            return instance;
        });
        //
        //CommonJS support
        //
        //} else if (typeof module === "object" && module.exports) {
        //    module.exports = factory;
    }
    //
    //Standard support (add instance to window
    //
    else {
        root.rcOAuth2LoginBarView = factory;
    }
}(this,

    (function (window) {
        "use strict";
        var debugActive = false;
        var container;
        var containerLogout;
        var config = {
            locale: "fr"
         ,i18n: {} 
        };
        var markupElemSelector = {
            id: {
                container: "rc-oauth2-loginbar", 
                loginLink: "rc-oauth2-login-link",
                logoutLink: "rc-oauth2-logout-link",
                connectedLink: "rc-oauth2-connected-link",
                username: "rc-oauth2-username"
            },
            className: { 
            }
        };

        //
        //Utilities / Helpers
        //
        var $ = function (needle, targetScope) {
            if (needle.indexOf("#") === 0) {
                return window.document.getElementById(needle.split("#")[1]);// get by Id must use window.document
            } else { 
                var scope = targetScope || container || window.document;//privilege limiting searching to our container, or other specified target scope!
                if (needle.indexOf(".") === 0) {
                    return scope.getElementsByClassName(needle.split(".")[1]);
                }else{
                    return scope.getElementsByTagName(needle);
                }
            }  
        };
        var log = function (msg) {
            if ((debugActive === true) && console) { console.log("rcOAuth2LoginBarView: " + msg); }
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
        var setI18n = function () {
            config.i18n = config.i18n || {};

            if (!config.i18n.fr) config.i18n.fr = {};
           // config.i18n.fr.loginWidgetAriaLabel = "Barre de connexion au centre des membres";
            config.i18n.fr.loginLinkLabel = "Connexion";
            config.i18n.fr.loginLinkAriaLabel = "Connexion au centre des membres";
            config.i18n.fr.logoutLinkLabel = "Déconnexion";
            config.i18n.fr.logoutLinkAriaLabel = "Déconnexion du centre des membres"; 
            config.i18n.fr.profileImgAlt = "Avatar d'utilisateur"; 
            // config.i18n.fr.targetBlankText = "(nouvelle fenêtre)";
            if (!config.i18n.fr.myAccountLinkLabel) config.i18n.fr.myAccountLinkLabel = "Mon espace";
            if (!config.i18n.fr.myAccountLink) config.i18n.fr.myAccountLink = "https://ici.radio-canada.ca/mon-espace/";
            if (!config.i18n.fr.loggedInMessage) config.i18n.fr.loggedInMessage = "{0}";

            if (!config.i18n.en) config.i18n.en = {};
           // config.i18n.en.loginWidgetAriaLabel = "Members Center account information";
            config.i18n.en.loginLinkLabel = "Sign-in";
            config.i18n.en.loginLinkAriaLabel = "Sign-in to the members center";
            config.i18n.en.logoutLinkLabel = "Sign-out";
            config.i18n.en.logoutLinkAriaLabel = "Sign-out of the members center"; 
            config.i18n.en.profileImgAlt = "User profile picture";
            //config.i18n.en.targetBlankText = "(new window)";  
            if (!config.i18n.en.myAccountLinkLabel) config.i18n.en.myAccountLinkLabel = "My Account";
            if (!config.i18n.en.myAccountLink) config.i18n.en.myAccountLink = "https://ici.radio-canada.ca/mon-espace/";
            if (!config.i18n.en.loggedInMessage) config.i18n.en.loggedInMessage = "{0}";
        };

        //
        // Intitialization
        //
        var init = function (settings, debug) {

            if (debug === true) {
                debugActive = true;
            }

            log("init");

            // check for receiving container
            container = $("#" + markupElemSelector.id.container);
            containerLogout = $("#" + markupElemSelector.id.container + "-logout");//for now, this is optional
            if (container == null) {
                throw new Error("Please ensure that you have defined a container element with id " + markupElemSelector.id.container);
            } 

            //a11y concerns on main HMTL element
             container.setAttribute("aria-live","assertive");


            //update module settings 
            setConfig(config, settings);

            //add settings to i18n
            setI18n();
        };

        var getLoginMarkup = function () {
            var locale = config.locale;
            var i18n = config.i18n;
            var html = '<button type="button" id="' + markupElemSelector.id.loginLink + '" class="cdm-button cbcrc-icon-profile" aria-label="' + i18n[locale].loginLinkAriaLabel + '">' + i18n[locale].loginLinkLabel + '</button>';
            return html;
        };

       var getLogoutMarkup = function () {
            var locale = config.locale;
            var i18n = config.i18n;
            var html = '<button type="button" id="' + markupElemSelector.id.logoutLink + '" class="cdm-button logout-link cbcrc-icon-exit" aria-label="' + i18n[locale].logoutLinkAriaLabel + '">' + i18n[locale].logoutLinkLabel + '</button>';
            return html;
        };

        var getLoggedInMarkup = function (userInfo) {
            var locale = config.locale;
            var i18n = config.i18n;
            var html = '<a href="' + i18n[locale].myAccountLink + '" class="cdm-button login-link" id="' + markupElemSelector.id.connectedLink + '">'
                     +  '<span class="wgt-connected-content">';
             if (userInfo.picture && userInfo.picture != " " && userInfo.picture.indexOf("avatar_default") == -1) {
                html +=     '<span class="wgt_userAvatar"><img alt="' + i18n[locale].profileImgAlt + " " + userInfo.name + '" src="' + userInfo.picture + '"/></span>';
             } else {
                html +=     '<span class="wgt_userAvatar  cbcrc-icon-profile-circle-outline"></span>';
            }
            html +=         '<strong id="' + markupElemSelector.id.username + '" class="wgt_userName">'+getLoggedInMessage(userInfo) +'</strong>'
                 +          '<span class="wgt_MySpace">'+i18n[locale].myAccountLinkLabel+'</span>'
                 +      '</span>'
                 +   '</a>';  
            return html;
        };

        var getLoggedInMessage = function (userInfo) {
            var locale = config.locale;
            var i18n = config.i18n;
            var msg = i18n[locale].loggedInMessage.replace(/\{0\}/gi, ((userInfo.given_name) ? userInfo.given_name : ((userInfo.name) ? userInfo.name.split(" ")[0] : "")));
            return msg;
        };

        var injectLoginMarkup = function (loginFunction) {
            log("injectLoginMarkup");
            container.innerHTML = getLoginMarkup();
            addEvent($("#" + markupElemSelector.id.loginLink), "click", loginFunction);
            //we also need to explicitly hide the logout markkup because
            //it is in a separate HTML element (div).
             if (containerLogout!= null){
                containerLogout.innerHTML = "";
             }
        };

        var injectLoggedInMarkup = function (userInfo, logoutFunction) {
            log("injectLoggedInMarkup");
            container.innerHTML = getLoggedInMarkup(userInfo); 
            if (containerLogout!= null){
                containerLogout.innerHTML = getLogoutMarkup();
                 addEvent($("#" + markupElemSelector.id.logoutLink), "click", logoutFunction);
            }  
        };

        var updateLoggedInMarkup = function (userInfo) {
            log("updateLoggedInMarkup");
            var elem = $("#" + markupElemSelector.id.username);
            elem.innerHTML = getLoggedInMessage(userInfo);
        };

        return {
            init: init,
            injectLoginMarkup: injectLoginMarkup,
            injectLoggedInMarkup: injectLoggedInMarkup,
            updateLoggedInMarkup: updateLoggedInMarkup
        };
    }(window))

    ));