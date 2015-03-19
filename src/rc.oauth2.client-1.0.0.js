//
// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//
var rcOAuth2 = rcOAuth2 || {};

rcOAuth2.client = (function (window) {
    //"use strict";
    var debug = false;
    var useLocalStorage = true;
    var callbackKeys = { accessToken: "access_token", expiresIn: "expires_in", tokenType: "token_type", state: "state", scope: "scope" };
    var urlHash;
    var _settings = {
        domain: "services.radio-canada.ca",
        path: "/cdm/oauth2/authorize",
        clientId: "",
        redirectUri: "",
        scope: "",
        state: "",
        responseType: "token",
        callbackDone: null 
    };
    var log = function (msg) {
        if (debug) console.log(msg);
    };
    var init = function (settings, isDebug) {

        //
        //settings supported:  see _settings
        //

        if (isDebug === true) debug = true;
        setConfig(_settings, settings);
        setUrlHash();

        //
        //store access token if in callback mode
        if (urlHash[callbackKeys.accessToken] != undefined) {
            persistAccessToken();
            if (typeof urlHash[callbackKeys.state] === "string" && urlHash[callbackKeys.state].indexOf("http") >= 0 && typeof (_settings.callbackDone) === "function") {
                _settings.callbackDone(decodeURIComponent(urlHash[callbackKeys.state]).toString());
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
    var getConfig = function (target, prop) {
        return target[prop];
    };
    var setUrlHash = function () {
        urlHash = {};
        var hash = document.location.hash.substring(1).split("&");
        if (hash.length >= 1 && hash[0] != "") {
            for (var h in hash) {
                for (var k in callbackKeys) {
                    var key = callbackKeys[k];
                    if (hash[h].indexOf(key) >= 0) {
                        urlHash[key] = hash[h].split("=")[1];
                    }
                }
            }
        }
    };
    var parseUrl = function (url) {
        var div, a, addToBody, props, details;

        props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

        // add the url to an anchor and let the browser parse the URL
        a = document.createElement('A');
        a.setAttribute("href", url);

        // IE8 (and 9?) Fix
        // ie8 doesn't parse the URL correctly until the anchor is actually
        // added to the body, and an innerHTML is needed to trigger the parsing
        addToBody = (a.host === '' && a.protocol !== 'file:');
        if (addToBody) {
            div = document.createElement('DIV');
            div.innerHTML = '<a href="' + url + '"></a>';
            a = div.firstChild;
            // prevent the div from affecting layout
            div.setAttribute('style', 'display:none; position:absolute;');
            document.body.appendChild(div);
        }

        // Copy the specific URL properties to a new object
        // This is also needed for IE8 because the anchor loses its
        // properties when it's removed from the dom
        details = {};
        for (var i = 0; i < props.length; i++) {
            details[props[i]] = a[props[i]];
        }

        if (addToBody) {
            document.body.removeChild(div);
        }

        return details;
    };
    var isLocalStorageSupported = function () {
        try {
            return (useLocalStorage && ('localStorage' in window) && (window['localStorage'] !== null));
        } catch (e) {
            return false;
        }

    };
    var ajax = function (settings) {

        //
        //settings supported:  done fail method bearerToken withCredentials
        //
        var fileUrl, request, urlInfo, winLoc, crossOrigin;

        //onError = settings.fail || function () { };

        if (typeof XMLHttpRequest === 'undefined') {
            // Shim XMLHttpRequest for older IEs
            window.XMLHttpRequest = function () {
                try {
                    return new window.ActiveXObject('Msxml2.XMLHTTP.6.0');
                } catch (e) {
                }
                try {
                    return new window.ActiveXObject('Msxml2.XMLHTTP.3.0');
                } catch (f) {
                }
                try {
                    return new window.ActiveXObject('Msxml2.XMLHTTP');
                } catch (g) {
                }
                throw new Error('This browser does not support XMLHttpRequest.');
            };
        }

        request = new XMLHttpRequest();

        urlInfo = parseUrl(settings.url);
        winLoc = window.location;
        // check if url is for another domain/origin
        // ie8 doesn't know location.origin, so we won't rely on it here
        crossOrigin = (urlInfo.protocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);

        // Use XDomainRequest for IE if XMLHTTPRequest2 isn't available
        // 'withCredentials' is only available in XMLHTTPRequest2
        // Also XDomainRequest has a lot of gotchas, so only use if cross domain
        if (crossOrigin && window.XDomainRequest && !('withCredentials' in request)) {
            request = new window.XDomainRequest();
            request.onload = function () {
                settings.done(request.responseText);
            };
            request.onerror = function () { settings.fail(request.status, request.statusText, "onerror"); };
            // these blank handlers need to be set to fix ie9 http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
            request.onprogress = function () { };
            request.ontimeout = function () { settings.fail(request.status, request.statusText, "ontimeout"); };

            // XMLHTTPRequest
        } else {
            fileUrl = (urlInfo.protocol == 'file:' || winLoc.protocol == 'file:');

            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    if (request.status === 200 || request.status === 401 || fileUrl && request.status === 0) {
                        settings.done(request.status, request.responseText);
                    } else {
                        settings.fail(request.status, request.statusText, "onreadystatechange");
                    }
                }
            };
        }

        // open the connection
        try {
            // Third arg is async, or ignored by XDomainRequest
            request.open(settings.method, settings.url, true /*(settings.async === true ? true : false)*/);
            if (typeof (settings.bearerToken) === "string") {
                request.setRequestHeader("Authorization", "Bearer " + settings.bearerToken);
                request.setRequestHeader("Content-Type", "application/json;charset=utf-8");
            }
            // withCredentials only supported by XMLHttpRequest2
            if (settings.withCredentials) {
                request.withCredentials = true;
            }
        } catch (e) {
            settings.fail(request.status, e, "onconnectionopen");
            return;
        }

        // send the request
        try {
            request.send();
        } catch (e) {
            settings.fail(request.status, e, "onsend");
        }
    };
    var setCookie = function (key, value, expireDate) {
        var cookieValue = escape(value) + "; expires=" + expireDate;
        document.cookie = key + "=" + cookieValue;
    };
    var getCookie = function (key) {
        var cookie = document.cookie;
        var start = cookie.indexOf(" " + key + "=");
        if (start == -1) {
            start = cookie.indexOf(key + "=");
        }
        if (start == -1) {
            cookie = null;
        } else {
            start = cookie.indexOf("=", start) + 1;
            var end = cookie.indexOf(";", start);
            if (end == -1) {
                end = cookie.length;
            }
            cookie = unescape(cookie.substring(start, end));
        }
        return cookie;
    };
    var deleteCookie = function (key) {
        // Delete a cookie by setting the date of expiry to yesterday
        var date = new Date();
        date.setDate(date.getDate() - 1);
        document.cookie = escape(key) + '=;expires=' + date;
    };
    var getPersistDataBaseKey = function () {
        return "rcoac." + getConfig(_settings, "clientId");
    };
    var persistAccessToken = function () {
        var accessToken = urlHash[callbackKeys.accessToken];
        var expiresIn = urlHash[callbackKeys.expiresIn];
        var scope = urlHash[callbackKeys.scope];

        //all values must be present for persistance
        if (typeof accessToken === "string" && accessToken != "" && accessToken != " " && typeof expiresIn === "string" && typeof scope === "string") {
            var accessTokenPersistKey = getPersistDataBaseKey() + "." + callbackKeys.accessToken;
            var expireDate = new Date();
            expireDate.setSeconds(parseInt(expiresIn));
            expireDate = expireDate.toUTCString();
            //todo: put try catch around localstorage, always use cookie as backup??
            //persist to local storage or cookie 
            if (isLocalStorageSupported()) {
                // set access token
                localStorage.setItem(accessTokenPersistKey, accessToken);
                //set expires 
                localStorage.setItem(getPersistDataBaseKey() + "." + callbackKeys.expiresIn, expireDate);
                //set scope 
                // localStorage.setItem(getPersistDataBaseKey() + "." + callbackKeys.scope, scope.replace(/\+/gi, ' '));
            } else { 
                setCookie(accessTokenPersistKey, accessToken, expireDate);
            }
        }
    };
    var getAccessToken = function () {
        var accessTokenPersistKey = getPersistDataBaseKey() + "." + callbackKeys.accessToken;
        var accessToken = "";
        //check local storage or cookie
        if (isLocalStorageSupported()) {
            // set access token
            var at = localStorage.getItem(accessTokenPersistKey);
            //set expires 
            var expireDate = localStorage.getItem(getPersistDataBaseKey() + "." + callbackKeys.expiresIn);
            //set scope
            //var scope = localStorage.getItem(getPersistDataBaseKey() + "." + callbackKeys.scope);

            var now = new Date(); 
            if (Date.parse(expireDate) > now) {
                accessToken = at;
            } 
        } else {
            var cookie = getCookie(accessTokenPersistKey);
            if (typeof (cookie) === "string") {
                accessToken = cookie;
            }
        }
        return accessToken;
    };
    var deleteAccessToken = function (httpStatus) {
        var accessTokenPersistKey = getPersistDataBaseKey() + "." + callbackKeys.accessToken;
        //check local storage or cookie
        if (httpStatus === 401) {
            if (isLocalStorageSupported()) {
                // set access token
                localStorage.removeItem(accessTokenPersistKey);
                //set expires 
                localStorage.removeItem(getPersistDataBaseKey() + "." + callbackKeys.expiresIn);
                //set scope
                //localStorage.removeItem(getPersistDataBaseKey() + "." + callbackKeys.scope);
            } else {
                deleteCookie(accessTokenPersistKey);
            }
        }
    };
    var getUserInfo = function (settings) {
        //
        //settings supported: done fail  
        //
        settings = settings || {};

        //
        //configure settings for ajax call settings:  done fail method bearerToken withCredentials
        // 
        settings.method = "GET";
        settings.url = "https://" + getConfig(_settings, "domain") + "/openid/connect/v1/userinfo";
        settings.bearerToken = getAccessToken();
        settings.withCredentials = false;
        var oldDone = settings.done;
        settings.done = function (old) {
            return function (httpStatus, data) {
                //data properties: 
                /*  "rcid"
                    "name"
                    "given_name"
                    "family_name"
                    "email"
                    "session"
                    "info"
                */
                if (typeof (old) === "function") {
                    old(httpStatus, data);
                }
            };
        }(oldDone);
        var oldFail = settings.fail;
        settings.fail = function (old) {
            return function (httpStatus, statusText, caseLabel) {
                deleteAccessToken(httpStatus);
                if (typeof (old) === "function") {
                    old(httpStatus, statusText, caseLabel);
                }
            };
        }(oldFail);
        ajax(settings);
    };
    var getAuthorizeUrl = function () { 
        var out = "https://" + getConfig(_settings, "domain") + getConfig(_settings, "path");
        out += "?client_id=" + getConfig(_settings, "clientId");
        out += "&redirect_uri=" + encodeURIComponent(getConfig(_settings, "redirectUri"));
        out += "&response_type=" + getConfig(_settings, "responseType");
        out += "&scope=" + getConfig(_settings, "scope").replace(/\W/gi, '+');
        out += "&state=" + encodeURIComponent(getConfig(_settings, "state"));
        return out;
    };
    var login = function (modalWindow) {
        if (typeof (modalWindow) === "function") {
            modalWindow(getAuthorizeUrl());
        }
        else {
            document.location.href = getAuthorizeUrl();
        }
    };
    var logout = function (settings) {
        //
        //supported settings: done
        //
        settings = settings || {};

        var accessToken = getAccessToken();
        //
        //call session logout endpoint
        var iframe = document.createElement('iframe');
        if(!debug) iframe.style.display = "none";
        iframe.src = "https://" + getConfig(_settings, "domain") + "/cdm/oauth2/logout?access_token=" + accessToken + "&token_type_hint=access_token";
        document.body.appendChild(iframe);


        deleteAccessToken(401);//we always want to revoke the token, even if the auth server faulted on this 
        if (settings && typeof (settings.done) === "function") {
            settings.done(200, { "result": "ok" });
        }
    };

    return {
        init: init,
        getAccessToken: getAccessToken,
        getUserInfo: getUserInfo,
        login: login,
        logout: logout
    };
}(window));
