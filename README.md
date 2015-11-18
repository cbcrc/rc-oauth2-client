**rc-oauth2-client**
======================
A JavaScript OAuth 2.0 Implicit Code Flow client with accompanying (optional) login-bar widget.

##APIs

### rcOAuth2Client

  + **init(** clientId, context, settings, [debug] **)**

    Point of entry.
     
    Returns: --
    
    Parameters:
    + `clientId` //*String*

      OAuth 2.0 client id  

    + `context`  //*Number*

     The context in which the client will be executing. Possible values: 1 (login)  or 2 (callback).  

    + `settings` //*Object literal*

    The settings parameter will differ depending on what *mode* is used.

    If you have set *context* to 1, then the settings will accept the following object:
    ```javascript
    {
        domain: "",             //optional - oauth 2.0 server domain.
                                //default = dev-services.radio-canada.ca
        authorizePath: "",      //optional - oauth 2.0 server authorize path
                                //default = /auth/oauth/v2/authorize
        logoutPath: "",         //optional - oauth 2.0 server logout path
                                //default = /auth/oauth/v2/logout
        userInfoPath: "",       //optional - oauth 2.0 server oidc userinfo path
                                //default = /openid/connect/v1/userinfo
        redirectUri: "",        //oauth 2.0 redirect_uri parameter
        scope: "",              //oauth 2.0 scope paramter
        state: "",              //optional - oauth 2.0 state paramter
                                //default = ""
        persistUserInfo:false,  //optional - if we should locally persist (cache) userinfo payload. 
                                //           A value of true places emphasis on performance over data consistancy
                                //default = false 
        cookieMode:false        //optional - persist userinfo payload using cookies rather 
                                //           than the default (and recommended!) local storage mechanism
                                //           The setting is only used if persistUserInfo setting is set to true 
                                //default = false 
        cookieDomain:undefined  //optional - define the domain value to which cookies will be bound
                                //           The setting is used to persist userinfo payload cookie (if cookieMode is set to true) 
                                //default = undefined (therfore, the current request's domain)
                                //Attention: the value of cookieDomain MUST be the same in as context #2 settings 
    }
    ```
      If you have set *context* to 2, then the settings will accept the following object: 
    ```javascript
    {
        vfDependant: false,     //if Viafoura dependant actions must be taken. Ex: Write viafoura session cookie
                                //default = false
         done: null,            //a function/delegate with signature function(state /*String*/){}
                                //called when an access token has been granted 
         fail: null,            //a function/delegate with signature 
                                //function(errorMessage /*String*/, state /*String*/){}
                                //on access token grant error
        cookieMode:false        //optional - persist access token payload using cookies rather 
                                //           than the default (and recommended!) local storage mechanism
                                //default = false 
        cookieDomain:undefined  //optional - define the domain value to which cookies will be bound
                                //           The setting is used to persist viafoura session cookie (if vfDependant is set to true) 
                                //           and/or the access token payload cookie (if cookieMode is set to true) 
                                //default = undefined (therfore, the current request's domain)
                                //Attention: the value of cookieDomain MUST be the same as context #1 settings 
    }
    ```

    + `debug` //*Boolean*

     Optional - When set to true, will output data to the console for debugging. 

  + **getAccessToken()**

    Attempts to retrieve a locally persisted access token.
    **Attention**: Even if an access token is retrieved, your application should handle a possible 401 HTTP status response when
    using the access token, as there is no way of ensuring that the access token in question has not been invalidated by the authorization server.
   
    Returns: Empty string or an access token

  + **getUserInfo(settings)**

     Wraps a call to the authorization server's OpenId Connect userinfo endpoint.
   
    Returns: Please see *Parameters* section below for return values. 
    
    Parameters:
    + `settings` //*Object literal*
    
     The parameter takes the following object:
    ```javascript
    {
        forceRefresh: false     //optional - refresh cached user info by forcing a call to the 
                                //user info endpoint; this option should be judicially used
                                //Default = false
        ,done: null             //function delegate with signature function(httpStatus /*number*/, data /*user info object*/){}
                                //called on ajax call success
        ,fail: null             //function delegate with signature function(httpStatus /*number*/, statusText /*string*/, caseLabel /*string*/){}
                                //called on ajax call error
    }
    ```

  + **login(** urlHandler, locale **)**

    Generates the OAuth 2.0 authorize URL and will, by default, redirect the user's browser to the endpoint in question.
    The default behaviour can be altered using the optional *urlHandler* parameter.
    
    Returns: -
    
    Parameters:
    + `urlHandler` //*Function*
      
      If set, the function delegate is called to handle the display of the authorize url/endpoint, with signature:
    ```javascript 
    function(url /*String*/){} 
    ```
    
    + `locale` //*String*
	   If set, the authorize url/endpoint will be displayed in the specified locale. Valid values: "fr" | "en". Default = "fr".
	    
  + **logout(** [complete] **)**

    This function will clear the user's session with the authorization server and revoke the client's access token
    
    Returns: -
    
    Parameters:
    + `complete` //*Function*

      Optional - If set, the function delegate will be called once logout has completed, with signature
   ```javascript 
    function(){}
    ``` 


### rcOAuth2LoginBar 

  + **init(** rcOAuth2Client, settings, [debug] **)**

    Point of entry.
     
    Returns: ---
  
    Parameters:
    + `rcOAuth2Client` //*Object*

       rcOAuth2Client object.
    
    + `settings` //*Object literal*

    The parameter takes the following object:
  ```javascript 
   {
        locale: "fr"            // optional -  i18n settings that should be used.
                                // Default = "fr"
        ,i18n:{}                // optional - 
                                // Default: 
                                //      { fr:{loggedInMessage:"{0}"},
                                //        en : {loggedInMessage:"{0}"}
                                //      }
                                // Note: the {0} token is replaced by the logged-in user's display name
        ,forceLogin: false      // optional -  if true, the user will be automatically  prompted to login
                                // Default = false
        ,vfDependant: false     // if Viafoura dependant actions must be taken. Ex: Delete viafoura session cookie
                                // Default = false
        ,modalMode: false       // optional - whether or not the login page should be shown in a modal
                                // Default = false (a redirection to the login page will occur)
        ,dropMenuItems: []      // optional - an array of user action objects to add to the base action of 'Logout'
                                // An action object has the following properties: label, title, action 
                                // label: the name of the property in your i18n configuration object above 
                                // title: optional - the name of the property in your i18n configuration object above
                                //        This property should only be set for a11y purposes: when the item's label/text 
                                //        used is not descriptive enough.
                                // action: supports either a URL string (will create <a href="{action}"> tag) or a function 
                                //         (will create <button> tag  with an click event and your function will recieve the
                                //         click event object as a parameter)
                                // target: optional - the value of a the target attribute that will be added to 
                                //         your <a href="{action}> tag 
        ,loginComplete:null     // optional - a function to be invoked when the user has succesfully logged
                                //            in to the client application, with signature
                                //            function(accessToken){}
        ,logoutComplete:null    // optional - a function to be invoked when hte logout process completes, with signature
                                //            function(){}
    }
  ```
    
    
   + `debug` //*Boolean*

       An optional parameter that when set to true, will output messages to the console. 
 
+ **refresh()**

    Updates (force refreshes) the user info displayed on screen with a call to the authorization server's userinfo endpoint.
     
    Returns: ---
  
    Returns: Please see *Parameters* section below for return values. 
    
    Parameters:
    + `settings` //*Object literal*
    
     The parameter takes the following object:
    ```javascript
    {
        done: null             //function delegate with signature function(httpStatus /*number*/, data /*user info object*/){}
                                //called on ajax call success
        ,fail: null             //function delegate with signature function(httpStatus /*number*/, statusText /*string*/, caseLabel /*string*/){}
                                //called on ajax call error
    }
    ```
    

##Integration

Because the code is AMD ready (!) , you have 3 integration options:

  + Standard JS file includes
  + RequireJS wrapper
  + RequireJS modules

#### Standard JS file includes
 
samples/js-includes.html
samples/js-includes-callback.html 

#### RequireJS wrapper

Please see the 
samples/requirejs.wrapper.html 
samples/requirejs.wrapper-callback.html  

#### RequireJS modules

Please see the 
samples/requirejs.module.html 
samples/requirejs.module-callback.html 
 