//
// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//


//**
// define() must be activated for Sample using solely RequireJS modules
// see readme.md for more details
//**
//define(["module"],function(module) { 
var rcOAuth2Client = (function (window) {
    //"use strict";
    var debugActive = false;
    var useLocalStorage = true;
    var callbackKeys = {
        accessToken: "access_token"
        , expiresIn: "expires_in"
        , tokenType: "token_type"
        , state: "state"
        , scope: "scope"
        , error: "error"
        , vfsession: "vfsession" /*viafoura session id*/
    };
    var persistedDataKeys = {
        accessToken: "at"
        , userInfo: "ui"
        ,vfSession :"VfSess"
            
    };
    var config = {
        clientId: ""
        , responseType: "token"
    };
    var callConfig = {
        domain: "dev-services.radio-canada.ca"
        , authorizePath: "/auth/oauth/v2/authorize"
        , logoutPath: "/auth/oauth/v2/logout"
        , userInfoPath: "/openid/connect/v1/userinfo"
        , redirectUri: ""
        , scope: ""
        , state: ""
    };
    var callbackConfig = {
        vfDependant: false
        , done: null
        , fail: null
    };

    //
    // Utilities / Helpers
    //
    var log = function (msg) {
        if ((debugActive === true) && console) { console.log("rcOauth2Client: " + msg); }
    };
    var isFunction = function (fn) {
        return (typeof fn === "function");
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
    var setCookie = function (key, value, expireDate) {
        var cookieValue = escape(value) + "; expires=" + expireDate + "; path=/";
        window.document.cookie = key + "=" + cookieValue;
    };
    var getCookie = function (key) {
        var cookie = window.document.cookie;
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
        window.document.cookie = escape(key) + '=;expires=' + date;
    };
    var isLocalStorage = function () {
        try {
            return (useLocalStorage && ('localStorage' in window) && (window['localStorage'] !== null));
        } catch (e) {
            return false;
        }

    };
    var parseUrl = function (url) {
        var div;
        var a;
        var addToBody;
        var props;
        var details;

        props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

        // add the url to an anchor and let the browser parse the URL
        a = window.document.createElement('A');
        a.setAttribute("href", url);

        // IE8 (and 9?) Fix
        // ie8 doesn't parse the URL correctly until the anchor is actually
        // added to the body, and an innerHTML is needed to trigger the parsing
        addToBody = (a.host === '' && a.protocol !== 'file:');
        if (addToBody) {
            div = window.document.createElement('DIV');
            div.innerHTML = '<a href="' + url + '"></a>';
            a = div.firstChild;
            // prevent the div from affecting layout
            div.setAttribute('style', 'display:none; position:absolute;');
            window.document.body.appendChild(div);
        }

        // Copy the specific URL properties to a new object
        // This is also needed for IE8 because the anchor loses its
        // properties when it's removed from the dom
        details = {};
        for (var i = 0; i < props.length; i++) {
            details[props[i]] = a[props[i]];
        }

        if (addToBody) {
            window.document.body.removeChild(div);
        }

        return details;
    };
    var ajax = function (settings) {
        //
        //settings supported:  async done fail method bearerToken withCredentials
        // 

        var request;

        //
        // XMLHttpRequest is compatible with IE7+, Firefox, Chrome, Opera, Safari
        // Shim XMLHttpRequest for older IEs 
        if (!XMLHttpRequest) {
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
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status === 200 || request.status === 401) {
                    settings.done(request.status, request.responseText);
                } else {
                    settings.fail(request.status, request.statusText, "client: ajax onreadystatechange");
                }
            }
        };


        // open the connection
        try {
            request.open(settings.method, settings.url, ((settings.async === false) ? false : true));
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
            settings.fail(request.status, e, "client: ajax onsend");
        }
    };
    var isVf = function () {
        return (callbackConfig.vfDependant === true) /*&& window.viafoura*/;
    };

    //
    // Intitialization
    //
    var init = function (clientId, context, settings, debug) {

        if (debug === true) {
            debugActive = true;
        }

        log("init");

        //
        //init hidden settings
        if (!clientId || clientId == " ") {
            throw new Error("clientId parameter: Please provide a valid client id.");
        }
        config.clientId = clientId;

        //
        // init login call context
        if (context == 1) {
            setConfig(callConfig, settings);
        }
            //
            //callback mode
        else if (context == 2) {
            setConfig(callbackConfig, settings);
            actOnCallback();
        } else {
            throw new Error("context parameter: Please provide a valid context.");
        }
    };
    var actOnCallback = function () {
        var url = parseUrl(window.document.location.href);
        var urlHash = getCallbackUrlKeyValues(url.hash);
        var urlSearch = getCallbackUrlKeyValues(url.search);
        var stateEchoed;
        var isPersisted;

        if (typeof (urlHash[callbackKeys.accessToken]) === "string") {
            isPersisted = tryPersistAccessToken(urlHash);
            stateEchoed = decodeURIComponent(urlHash[callbackKeys.state]).toString();
            if (isPersisted) {
                if (isFunction(callbackConfig.done)) {
                    callbackConfig.done(stateEchoed);
                }
            } else {
                if (isFunction(callbackConfig.fail)) {
                    callbackConfig.fail("access token could not be persisted", stateEchoed);
                }
            }
        } else {
            stateEchoed = decodeURIComponent(urlSearch[callbackKeys.state]).toString();
            if (typeof (urlSearch[callbackKeys.error]) === "string") {
                if (isFunction(callbackConfig.fail)) {
                    callbackConfig.fail(urlSearch[callbackKeys.error], stateEchoed);
                }
            }
        }

    };

    //
    // Logic
    //
    var getPersistedDataKey = function (persistedDataKey) {
        return "rcoac." + config.clientId + "." + persistedDataKey;
    };
    var getCallbackUrlKeyValues = function (urlSegment) {
        var kvs = {};
        var hash = urlSegment.substring(1);

        //
        //loop through keys
        hash = typeof (hash) === "string" ? hash.split("&") : [];
        if (hash.length >= 1 && hash[0] != "") {
            for (var h in hash) {
                for (var k in callbackKeys) {
                    var key = callbackKeys[k];
                    if (hash[h].indexOf(key) >= 0) {
                        kvs[key] = hash[h].split("=")[1];
                    }
                }
            }
            //end loop
        }
        return kvs;
    };

    var getAuthorizeUrl = function () {
        var out = "https://" + callConfig.domain + callConfig.authorizePath;
        out += "?client_id=" + config.clientId;
        out += "&redirect_uri=" + encodeURIComponent(callConfig.redirectUri);
        out += "&response_type=" + config.responseType;
        out += "&scope=" + callConfig.scope.replace(/\s/gi, '+');
        if (typeof (callConfig.state) === "string") {
            out += "&state=" + encodeURIComponent(callConfig.state);
        }
        return out;
    };

    var getAccessToken = function () {
        log("getAccessToken");

        var accessTokenPersistKey = getPersistedDataKey(persistedDataKeys.accessToken);
        var at;
        var result = "";
        var now;
        var cookie;

        //check local storage or cookie
        if (isLocalStorage()) {
            // set access token
            at = localStorage.getItem(accessTokenPersistKey);
            at = JSON.parse(at);
            now = new Date();
            if (at && Date.parse(at.expires) > now) {
                result = at.token;
            }
        } else {
            cookie = getCookie(accessTokenPersistKey);
            if (typeof (cookie) === "string") {
                at = JSON.parse(cookie);
                if (at) {
                    result = at.token;
                };
            }
        }
        return result;
    };
    var tryPersistAccessToken = function (urlHash) {
        var accessToken = urlHash[callbackKeys.accessToken];
        var expiresIn = urlHash[callbackKeys.expiresIn];
        var scope = urlHash[callbackKeys.scope];
        var viafouraSession = urlHash[callbackKeys.vfsession];
        var accessTokenPersistKey;
        var expireDate;
        var dataToPersist;

        //all values must be present for persistance
        if (typeof accessToken === "string" && accessToken != "" && accessToken != " " && typeof expiresIn === "string" && typeof scope === "string") {
            accessTokenPersistKey = getPersistedDataKey(persistedDataKeys.accessToken);
            expireDate = new Date();
            expireDate.setSeconds(parseInt(expiresIn));
            expireDate = expireDate.toUTCString();
            dataToPersist = JSON.stringify({ token: accessToken, expires: expireDate });


            //persist access token to localstorage or cookie 
            if (isLocalStorage()) {
                localStorage.setItem(accessTokenPersistKey, dataToPersist);
            } else {
                setCookie(accessTokenPersistKey, dataToPersist, expireDate);
            }


            // viafoura session support
            if (isVf()) {
                setCookie(persistedDataKeys.vfSession, viafouraSession, expireDate);
            }

            return true;
        } else {
            return false;
        }
    };
    var deletePersistedAccessToken = function (httpStatus) {
        var key = getPersistedDataKey(persistedDataKeys.accessToken);

        //check local storage or cookie
        if (httpStatus === 401) {
            if (isLocalStorage()) {
                localStorage.removeItem(key);
            } else {
                deleteCookie(key);
            }

            // viafoura session support
            if (isVf()) {
                deleteCookie(persistedDataKeys.vfSession);
            }
        }
    };

    var getUserInfo = function (settings) {
        log("getUserInfo");

        //
        //settings supported: async done fail forceRefresh
        //
        settings = settings || {};

        var done = settings.done;
        var fail = settings.fail;
        var forceRefresh = settings.forceRefresh || false;
        var accessToken = getAccessToken();
        var userInfo;

        if (accessToken) {

            log(">> forceRefresh=" + forceRefresh);

            //check for locally persisted info first
            if (forceRefresh !== true) {
                userInfo = getPersistedUserInfo();
            }

            //if we got persisted user info
            if (userInfo) {
                if (isFunction(done)) {
                    //userInfo = JSON.parse(userInfo);
                    //if (!userInfo) userInfo = {};
                    done(200, userInfo);
                }

                // else get info from server
            } else {

                //
                //configure settings for ajax call settings:  done fail method bearerToken withCredentials
                // 
                settings.method = "GET";
                settings.url = "https://" + callConfig.domain + callConfig.userInfoPath;
                settings.bearerToken = accessToken;
                settings.withCredentials = false;
                settings.async = (settings.async === false) ? false : true;
                settings.done = function (done, isFunction) {
                    return function (httpStatus, data) {
                        data = JSON.parse(data);
                        if (!data) data = {};
                        if (httpStatus == 200) {
                            tryPersistUserInfo(data);
                        }
                        if (isFunction) {
                            done(httpStatus, data);
                        }
                    };
                }(done, isFunction(done));
                settings.fail = function (fail, isFunction) {
                    return function (httpStatus, statusText, caseLabel) {
                        deletePersistedAccessToken(httpStatus);
                        if (isFunction) {
                            fail(httpStatus, statusText, caseLabel);
                        }
                    };
                }(fail, isFunction(fail));

                ajax(settings);
            }
        } else {
            if (isFunction(fail)) {
                fail(401, "No valid access token found", "client: getUserInfo");
            }
        }
    };
    var getPersistedUserInfo = function () {
        log("getPersistedUserInfo");

        var userInfo;
        var result;
        var key = getPersistedDataKey(persistedDataKeys.userInfo);

        if (isLocalStorage()) {
            userInfo = sessionStorage.getItem(key);
        } else {
            userInfo = getCookie(key);
        }
        if (userInfo) {
            result = JSON.parse(userInfo);
        }
        return result;
    };
    var tryPersistUserInfo = function (data) {
        var key;
        var dataToPersist;

        //
        //all values must be present for persistance
        if (data) {
            key = getPersistedDataKey(persistedDataKeys.userInfo);
            dataToPersist = (typeof (data) !== "string") ? JSON.stringify(data) : data;

            //
            //we want to persist userinfo data only for duration of browser session
            if (isLocalStorage()) {
                sessionStorage.setItem(key, dataToPersist);
            } else {
                setCookie(key, dataToPersist, "");
            }

            return true;
        } else {
            return false;
        }
    };
    var deletePersistedUserInfo = function (httpStatus) {
        var key = getPersistedDataKey(persistedDataKeys.userInfo);
        //check local storage or cookie
        if (httpStatus === 401) {
            if (isLocalStorage()) {
                sessionStorage.removeItem(key);
            } else {
                deleteCookie(key);
            }
        }
    };

    var login = function (urlHandler) {
        log("login");

        var url = getAuthorizeUrl();

        if (isFunction(urlHandler)) {
            urlHandler(url);
        }
        else {
            document.location.href = url;
        }
    };
    var logout = function (complete) {
        log("logout");

        var accessToken = getAccessToken();
        var iframe;

        //
        //take mandatory action...
        deletePersistedAccessToken(401);//we always want to revoke the token, even if the auth server faulted on logout call
        deletePersistedUserInfo(401);//we always want to remove user info, even if the auth server faulted on logout call 

        //
        //call auth server session logout endpoint 
        iframe = document.createElement('iframe');
        if (!debugActive) iframe.style.display = "none";
        iframe.height = "1px";
        iframe.width = "1px";

        //
        //setting the ‘onload’ event function before setting source and appending to the page. In this case it cannot be loaded before the callback is set; 
        iframe.onload = function (iframe, complete, isFunction) {
            return function () {
                document.body.removeChild(iframe);
                iframe = null;
                if (isFunction) {
                    complete(200, { "result": "ok" });
                }
            };
        }(iframe, complete, isFunction(complete));


        iframe.src = "https://" + callConfig.domain + callConfig.logoutPath + "?access_token=" + accessToken;

        document.body.appendChild(iframe);
    };

    return {
        init: init,
        getAccessToken: getAccessToken,
        getUserInfo: getUserInfo,
        login: login,
        logout: logout
    };
}(window));


//    rcOAuth2Client.init(module.config().clientId, module.config().context, module.config().settings, module.config().debug);
//    return rcOAuth2Client;
//});
