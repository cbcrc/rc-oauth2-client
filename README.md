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
        domain: "",         //optional - oauth 2.0 server domain.
                            // Default = dev-services.radio-canada.ca
        authorizePath: "",  //optional - oauth 2.0 server authorize path
                            // Default = /auth/oauth/v2/authorize
        logoutPath: "",     //optional - oauth 2.0 server logout path
                            // Default = /auth/oauth/v2/logout
        userInfoPath: "",   //optional - oauth 2.0 server oidc userinfo path
                            // Default = /openid/connect/v1/userinfo
        redirectUri: "",    // oauth 2.0 redirect_uri parameter
        scope: "",          //oauth 2.0 scope paramter
        state: "",          //optional - oauth 2.0 state paramter
                            //Default = ""
    }
    ```
      If you have set *context* to 2, then the settings will accept the following object: 
    ```javascript
    {
         done: null //a function/delegate with signature function(state /*String*/){}
                    //called when an access token has been granted 
         fail: null //a function/delegate with signature 
                    //function(errorMessage /*String*/, state /*String*/){}
                    //on access token grant error
    }
    ```

    + `debug` //*Boolean*

     An optional parameter that when set to true, will output data to the console. 

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
        done: null  //function delegate with signature function(httpStatus,data){}
                    //called on ajax call success
        ,fail: null //function delegate with signature function(httpStatus, statusText, caseLabel){}
                    //called on ajax call error
    }
    ```

  + **login(** [urlHandler] **)**

    Generates the oauth 2.0 authorize URL and will either redirect the user's browser to the latter, or returns the URL(authorize endpoint) as a parameter to the *urlHandler* delegate so that you can, for example, open the URL in a pop-up window.
    
    Returns: -
    
    Parameters:
    + `urlHandler` //*Function*
      Function delegate with signature
    ```javascript 
    function(url /*String*/){} 
    ```
    
  + **logout(** [continueWith] **)**

    This function will clear the user's session with the authorization server and revoke the client's access token
    
    Returns: -
    
    Parameters:
    + `continueWith` //*Function*

      Function delegate called once logout has completed, with signature
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
        ,locale: "fr"       // optional -  i18n settings that should be used.
                            // Default = "fr"
        ,i18n:{}            // optional - 
                            // Default: 
                            //      { fr:{loggedInMessage:"{0}", signin:"Connexion", signout:"Déconnexion"},
                            //        en : {loggedInMessage:"{0}", signin:"Sign-in", signout:"Sign-out"}
                            //      }
                            // Note: the {0} token is replaced by the logged-in user's display name
        ,forceLogin: false  // optional -  if true, the user will be automatically  prompted to login
                            // Default = false
        ,vfDependant: true  // if Viafoura dependant actions must be taken
                            // Default = true
        ,modalMode: false   // optional - whether or not the login page should be shown in a modal
                            // Default = false (a redirection to the login page will occur)
        ,dropMenuItems: []  // optional - an array of user action objects to add to the base action of 'Logout'
                            // An action object has the following properties: i18nLabel, action 
                            // i18nLabel: the name of the property in your i18n configuration object above 
                            // action: supports either a string (will create a href attribute) or a function (will create an onclick attribute)
    }
  ```
    
    
   + `debug` //*Boolean*

       An optional parameter that when set to true, will output messages to the console. 
 
##Integration

Because the code is AMD ready (!) , you have 3 integration options:

  + Standard JS file includes
  + RequireJS wrapper
  + RequireJS modules

#### Standard JS file includes

   ```html  
       <html>
       <head> 
           <link type="text/css" rel="stylesheet" href="/src/rc.oauth2.loginbar-1.0.0.css" />
       </head>
       <body>
         <div id="rc-oauth2-loginbar"></div>
       </body>
       <script>
            rcOAuth2Client.init( 
                "my OAuth2.0 client id",
                1,
                {
                    domain: "my.oauth2.server.com",
                    redirectUri: "http://my.domain.com/callback.html",
                    scope: "openid profile email",
                    state: "myTargetPageOnCallback"
                },
                false
            );
             
	rcOAuth2LoginBar.init(
                 rcOAuth2Client,  
                 {
                locale: "en",
                i18n: {
                    fr: { loggedInMessage: "Bonjour {0}!", help: "Aide" , faq:"FAQ"},
                    en: { loggedInMessage: "Hello {0}!", help: "Help", faq:"FAQ" }
                },
                forceLogin: false,
                modalMode: true,
                dropMenuItems: [{ i18nLabel: "help", action: function(e) { alert('HELP'); } }, { i18nLabel: "faq", action: (function(e){ alert('FAQ'); }) }]
                 }, 
                 false
              );
       </script>
       </html>
   ```

#### RequireJS wrapper

Please see the 
samples/rc-oauth2-testclient.html 
samples/rc-oauth2-testclient-callback.html 

#### RequireJS modules

Please see the 
samples/require.rc-oauth2-testclient.html 
samples/require.rc-oauth2-testclient-callback.html 

*Note*: 
You will have to activate the modules by uncommenting the `define( )` declarations in both source JS files:

#####rcOAuth2Client
  ```javascript
    define(["module"],function(module) { 
        [...]
        rcOAuth2Client.init(module.config().clientId, module.config().context, module.config().settings, module.config().debug);
        return rcOAuth2Client;
    });
  ``` 

#####rcOAuth2LoginBar
  ```javascript
    define(["module","rcOAuth2Client"], function (module, rcOAuth2Client) {
         [...]
         rcOAuth2LoginBar.init( rcOAuth2Client, module.config().settings, module.config().debug);
         return rcOAuth2LoginBar;
     });
  ``` 
