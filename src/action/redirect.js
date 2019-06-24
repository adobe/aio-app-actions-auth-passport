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
/**
 * A simple web action returning an HTTP Redirect based on
 *  params.context.success_redirect  or params.redirect_url.
 *  `success_redirect` may be used to override the default redirect_url parameter.
 * It sets the __Secure-auth_context and then it returns the redirect response.
 */
function redirect(params) {
  console.log(params);
  //TODO It may be possible to avoid ctx completely with package params
  let ctx = params.context || {};
  let redirect = ctx.redirect_url || params.redirect_url;
  let cookiePath = ctx.cookie_path || params.cookie_path || process.env['__OW_NAMESPACE'] + "/"
  let cookieMaxAge = ctx.cookie_max_age || params.cookie_max_age || 86400
  delete ctx.redirect_url; // we don't need it after redirecting
  delete ctx.cookie_path; // we don't need it after redirecting

  return {
    headers: {
      'Location': redirect,
      'Set-Cookie': '__Secure-auth_context=' + JSON.stringify(ctx) + '; Secure; HttpOnly; Max-Age=' + cookieMaxAge + '; Path=/api/v1/web/' + cookiePath,
      'Content - Length': '0'
    },
    statusCode: 302,
    body: ""
  }
}
