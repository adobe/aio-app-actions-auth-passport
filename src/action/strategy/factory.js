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
/* eslint-disable no-unused-vars */
import passport_github from 'passport-github'
import passport_facebook from 'passport-facebook'
import passport_twitter  from 'passport-twitter'
import passport_google from 'passport-google-oauth20'
import passport_adobe from 'passport-adobe-oauth2'

/**
 * Factory class to create the Passport Strategy corresponding to a given authentication provider.
 */
export default class StrategyFactory {

    /**
     * Returns the instance of the Strategy or an Error object, if the Strategy couldn't be created
     * @param auth_provider the name of the authentication provider
     */
    static getStrategy(auth_provider) {
        let passport_module_name = 'passport-' + auth_provider;
        let strategy_impl = null;

        try {
            strategy_impl = require(passport_module_name).Strategy;
        } catch (err) {
            console.error(err);
            return err;
        }

        return strategy_impl;
    }
}
