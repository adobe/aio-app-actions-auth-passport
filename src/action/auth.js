/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import passport from 'passport'
import StrategyBuilder from './strategy/builder'
import cookie from 'cookie'

let refresh = require('passport-oauth2-refresh')
function _authenticate(params) {
    return new Promise((resolve, reject) => {
        //build a strategy for Passport based on input params
        let builder = new StrategyBuilder()
            .withProvider(params.auth_provider)
            .withCredentials(params.client_id, params.client_secret)
            .withCallbackURL(params.callback_url)
            .withVerifyer(function (accessToken, refreshToken, authParams, profile, done) {
                console.log("Logged in successfully ... ");
                profile.id = params.client_id + ":oauth:" + profile.id;
                if( !(params.persistence && params.persistence === 'true') )
                  params.accessToken=accessToken //Store in cookie context
                let ctx = _updateContext(params, profile);
                ctx.redirect_url = ctx.redirect_url || params.redirect_url;

                let refreshExpDate = new Date();
                let refreshTTL = params["refresh_token_ttl_"+params.auth_provider_name] || 7
                refreshExpDate.setDate(refreshExpDate.getDate() + refreshTTL);
                refreshExpDate = formatDate(refreshExpDate);

                let currentTimeInseconds = new Date().getTime() / 1000;
                let accessTokenExpiry = (currentTimeInseconds + authParams.expires_in)*1000;

                response.body = {
                    "profileID": profile.id,
                    "accessToken": accessToken,
                    "accessTokenExpiry": accessTokenExpiry,
                    "refreshToken": refreshToken,
                    "refreshTokenExpiry": refreshExpDate || 0,
                    "profile": profile,
                    "context": ctx,
                    "provider": params.auth_provider_name
                };

                resolve(get_action_response(response));
            });

        let strategy = builder.buildStrategy();

        if (strategy === null) {
            reject({
                    "message": "Could not load " + params.auth_provider,
                    "error": builder.getError().toString()
                }
            );
        }

        // create a lightweight request object to be used in the serverless context
        let request = {
            query: params,     // expose query parameters
            session: strategy._requestTokenStore || strategy._stateStore // inherit the session from Passport
        };

        // create a lightweight response object to be used in the serverless context
        let response = {
            headers: {},
            setHeader: function (name, val) {
                response.headers[name] = val;
            },
            end: function () {
                console.log("response end()");
                resolve(get_action_response(response));
            }
        };

        let get_action_response = function (resp) {
            if (resp.body instanceof Error) {
                console.error(resp.body);
                resp.body = resp.body.toString();
            }
            // save the redirect_url in a cookie to
            //   set it in the context once the user logs in
            //TODO The following block may not be needed because of package params.
            if (resp.statusCode == 302) {
              let cookie_header = resp.headers['Set-Cookie'];
              if ((cookie_header === null || typeof(cookie_header) === "undefined") &&
                 params.redirect_url) {
                let ctx = _getContext(params);
                ctx.redirect_url = params.redirect_url;
                let cookiePath = ctx.cookie_path || params.cookie_path || process.env['__OW_NAMESPACE'] + "/"
                resp.headers["Set-Cookie"] = '__Secure-auth_context=' + JSON.stringify(ctx) + '; Secure; HttpOnly; Max-Age=600; Path=/api/v1/web/' + cookiePath
              }
            }

            return {
                headers: resp.headers,
                statusCode: resp.statusCode,
                body: resp.body || ''
            }

        };

        let next = function (opts) {
            console.log("next()");
            response.body = opts;
            resolve(get_action_response(response));
        };

        passport.use(strategy);
        refresh.use(strategy);

        let scopes = params.scopes || null;
        if (scopes !== null) {
            scopes = scopes.split(",");
        }

        if (params.auth_type === 'refresh'){
            refresh.requestNewAccessToken(params.provider, params.refreshToken, function(retVal, accessToken, refreshToken, results){
              let refreshExpDate = new Date();
              let refreshTTL = params["refresh_token_ttl_"+params.provider] || 7
              refreshExpDate.setDate(refreshExpDate.getDate() + refreshTTL);
              refreshExpDate = formatDate(refreshExpDate);
              let currentTimeInseconds = new Date().getTime() / 1000;
              let accessTokenExpiry = (currentTimeInseconds + results.expires_in)*1000;
              resolve({
                "accessToken" : accessToken,
                "refreshToken" : refreshToken,
                "expires_in" : accessTokenExpiry,
                "refreshTokenExpiry" : refreshExpDate
              });
            });
        }else{

          let res = passport.authenticate(params.auth_provider_name || params.auth_provider, {
              scope: scopes,
              successRedirect: '/success',  // TODO: TBD should this be read from parameters ?
              failureRedirect: '/login'     // TODO: TBD should this be read from parameters ?
          });

          res(request, response, next);
        }
    });
}

function _getContext(params) {
  const CONTEXT_COOKIE_NAME = "__Secure-auth_context";
  //console.log("Cookies:" + params.__ow_headers['cookie']);
  let cookies = cookie.parse(params.__ow_headers['cookie'] || '');
  //console.log("Cookies parsed:" + JSON.stringify(cookies));
  return cookies[CONTEXT_COOKIE_NAME] ? JSON.parse(cookies[CONTEXT_COOKIE_NAME]) : {};
}

/**
* Returns a context object for this action.
* If this action is used to link multiple social IDs together
*  it reads the linked identities from a Cookie named "auth_context".
*  For Example the cookie header might be
*      Cookie: "auth_context={"identities":[{"provider":"adobe","user_id":"123"}
*  In this case the context.identities object is populated with the value from the cookie
* This context object should be used by another action in order to persist
*   the information about the linked accounts
*
* @param params Action input parameters
* @param profile User Profile
*/
function _updateContext(params, profile) {
  let ctx = _getContext(params);
  //console.log("ctx.identities=" + JSON.stringify(ctx.identities));
  // NOTE: there's no check for duplicated providers, ne design.
  //       2 accounts from the same provider can be linked together as well.
  // avoid duplicated identities
  let identity_exists = false;
  let provider = (params.auth_provider_name || params.auth_provider)
  ctx.identities = ctx.identities || [];
  for (let i=0; i<ctx.identities.length; i++ ){
    let ident = ctx.identities[i];
    if (ident !== null && typeof(ident) !== "undefined" &&
        ident.provider == provider && ident.user_id == profile.id) {
      identity_exists = true;
      if(params.accessToken)
        ident.accessToken = params.accessToken
      return ctx;
    }
  }
  let newIdentity = {
    "provider": (params.auth_provider_name || params.auth_provider),
    "user_id": profile.id
  }
  if(params.accessToken)
    newIdentity.accessToken = params.accessToken

  ctx.identities.push(newIdentity);
  return ctx;
}

function formatDate(date) {
  let monthNames = [
    "Jan", "Feb", "Mar",
    "Apr", "May", "Jun", "Jul",
    "Aug", "Sep", "Oct",
    "Nov", "Dec"
  ];

  let day = date.getDate();
  let monthIndex = date.getMonth();
  let year = date.getFullYear();

  return day + '' + monthNames[monthIndex] + '' + year;
}


/**
 * The entry point for the action.
 * @param params Input object
 * @returns {Promise}
 */
function main(params) {
    //console.log(params);
    return _authenticate(params);
}

export default main;
