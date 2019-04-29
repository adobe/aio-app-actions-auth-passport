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
import StrategyFactory from './factory'

/***
 * Builds a new Strategy for Passport
 */
export default class StrategyBuilder {
    withProvider(auth_provider) {
        this.auth_provider = auth_provider;
        return this;
    }

    withCredentials(client_id, client_secret) {
        this.client_id = client_id;
        this.client_secret = client_secret;
        return this;
    }

    withCallbackURL(callback_url) {
        this.callback_url = callback_url;
        return this;
    }

    withVerifyer(fn) {
        this.verifyer = fn;
        return this;
    }

    getError() {
        return this.error;
    }

    buildStrategy() {
        let strategy_impl = StrategyFactory.getStrategy(this.auth_provider);
        if (strategy_impl instanceof Error) {
            this.error = strategy_impl;
            return null;
        }
        let strategy = new strategy_impl({
            clientID: this.client_id,
            consumerKey: this.client_id,
            clientSecret: this.client_secret,
            consumerSecret: this.client_secret,
            callbackURL: this.callback_url
        }, this.verifyer);

        if (strategy._requestTokenStore) { // OAuth 1 requires a session
            strategy._requestTokenStore.get = function (req, token, cb) {
                // NOTE: The oauth_verifier parameter will be supplied in the query portion
                //       of the redirect URL, if the server supports OAuth 1.0a.
                let oauth_verifier = req.query.oauth_verifier || null;
                return cb(null, oauth_verifier);
            };

            strategy._requestTokenStore.destroy = function (req, token, cb) {
                // simply invoke the callback directly
                cb();
            }
        }
        return strategy;
    }
}
