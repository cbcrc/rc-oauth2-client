# rc-oauth2-client

A JavaScript OAuth 2.0 Implicit Code Flow client with accompanying (optional) login-bar widget

## APIs

### rcOAuth2.client
  + init(settings, [isDebug])
    + settings param is of type object:
    ```javascript
    {
        domain: "" //oauth 2.0 server domain. Default = services.radio-canada.ca
        ,
        path: "" //oauth 2.0 server authorize path. Default = /cdm/authorize
        ,
        clientId: "" // oauth 2.0 client_id parameter
        ,
        redirectUri: "" // oauth 2.0 redirect_uri parameter
        ,
        scope: "" //oauth 2.0 scope paramter
        ,
        state: "" //optional - oauth 2.0 state paramter
        ,
        responseType: "token" //oauth 2.0 response_type paramter. Allowed values: token. Default = token
        ,
        callbackDone: null //a function/delegate to call once token negotiation has finished
    }
    ```
    + isDebug optional param is of type boolen. 
  + getAccessToken()
  + getUserInfo(settings)
    + settings param is of type object:
    ```javascript
    {
        done: null //function delegate with signature myDelegate(httpStatus,data) 
        ,
        fail: null //function delegate with signature myDelegate(httpStatus, statusText, caseLabel) 
    }
    ```
  + login([modalWindow])
    + modalWindow optional param is of type function with signature:
    ```javascript
    myDelegate(url) 
    ```
    
  + logout(settings)
    + settings param is of type object:
    ```javascript
    {
        done: null //function delegate with signature myDelegate(httpStatus,data) 
    }
    ```

### rcOAuth2.loginBar 
  + init(settings, [isDebug])
    + settings param is of type object:
    ```javascript
    {
        isForceLogin: false // if true, user will be automatically be prompted to login
        , isVfLogout: false // if dependant on viafoura
        , isModalMode: true // if login page should be shown in a modal 
        , dropMenuItemsMarkup: { // list of user action objects. Note: a Logout action is automatically added by                                              // rcOAuth2.loginBar
            /*valid settings: */
        }
        , welcomebackMessage: "{0}" // {0} will be replaced by the logged-in user's display name.
                                    // ex: "Hello {0}" will output "Hello John Smith"
    }
    ```
    + isDebug optional param is of type boolen. 
  + login()
  + logout()



