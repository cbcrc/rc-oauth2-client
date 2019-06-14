//
// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

//
// Loginbar JS
// 

(function (root, factory) {
    //
    //AMD support
    //
    if (typeof define === "function" && define.amd) {
        define(["module", "rcOAuth2ClientDep", "rcOAuth2LoginBarViewDep"], function (module, rcOAuth2Client, rcOAuth2LoginbarView) {
            var instance = factory;
            if (module.config().hasOwnProperty("settings")) {
                instance.init(rcOAuth2Client, rcOAuth2LoginbarView, module.config().settings, module.config().debug);
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
        root.rcOAuth2LoginBar = factory;
    }
}(this,
 (function (window) {
     "use strict";
     var debugActive = false;
     var oauthClient;
     var loginbarView;
     var isLoggedIn = false;
   
     var config = { 
            forceLogin: false 
         , modalMode: false 
         , loginComplete: null
         , logoutComplete: null
     };

     //
     //Utilities / Helpers
     // 
     var log = function (msg) {
         if ((debugActive === true) && console) { console.log("rcOAuth2LoginBar: " + msg); }
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

     //
     // Intitialization
     //
     var init = function (jsClient, htmlView, settings, debug) {

         oauthClient = jsClient;

         if (debug === true) {
             debugActive = true;
         }

         log("init");

         //check for HTML views/templates
         loginbarView = htmlView;
         if (loginbarView == null) {
             throw new Error("Please ensure that you have defined the login bar views to be used");
         }
         
         //update module settings 
         setConfig(config, settings);

         //start markup insertion flow
         getUserInfo();
     };

     //
     // Logic
     // 
     var injectLoginMarkup = function () { 
         log("injectLoginMarkup");
         loginbarView.injectLoginMarkup(login);
     }; 
     var injectLoggedInMarkup = function (userInfo) { 
         log("injectLoggedInMarkup");
         loginbarView.injectLoggedInMarkup(userInfo, logout);
     }; 
     var updateLoggedInMarkup = function (userInfo) { 
         log("updateLoggedInMarkup");
         loginbarView.updateLoggedInMarkup(userInfo);
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

             isLoggedIn = true;

             injectLoggedInMarkup(data);

             if (isFunction(config.loginComplete)) {
                 var accessToken = oauthClient.getAccessToken();
                 config.loginComplete(accessToken, data);
             }
         } else { //4xx (401) or 5xx
             getUserInfoFail(httpStatus, "getUserInfoDone called with a 4xx/5xx HTTP status", "loginbar: getUserInfoDone");
         }
     };
     var getUserInfoFail = function (httpStatus, statusText, caseLabel) {
         log("getUserInfoFail");
         log(">> status= " + httpStatus + ", text= " + statusText + ", case= " + caseLabel);
         if (config.forceLogin === true) {
             login();
         }
         injectLoginMarkup();
     };

     var login = function (event) {
         if (config.modalMode) {
             oauthClient.login(loginUrlHandler, config.locale);
         } else {
             oauthClient.login(null, config.locale);
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

         if (window.viafoura && window.viafoura.session) { 
             window.viafoura.session.logout();
         }

         isLoggedIn = false;
 
         injectLoginMarkup();
 
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

         // if user is not logged in 
         if (!isLoggedIn) {
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
 }(window))
));