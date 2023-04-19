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
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import action from '../src/action/auth.js';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('OAuth2 Auth', () => {
    describe('with a provider', () => {

        it('GitHub: should redirect to the login page', (done) => {
            let params = {
                auth_provider: "github",
                client_id: "test_client_id",
                client_secret: "test_client_secret",
                scopes: "user_posts,publish_actions",
                callback_url: "http://www.example.com/auth/facebook/callback"
            };

            // The action returns a Promise and we can use "eventually" to wait for it.
            // If the action doesn't return a Promise we can remove "eventually"
            //   and write instead "should.deep.equal"
            let result = action(params);
            result.should.eventually.deep.equal({
                headers: {
                    Location: 'https://github.com/login/oauth/authorize?response_type=code&redirect_uri=http%3A%2F%2Fwww.example.com%2Fauth%2Ffacebook%2Fcallback&scope=user_posts%2Cpublish_actions&client_id=test_client_id',
                    'Content-Length': '0'
                },
                statusCode: 302,
                body: ''
            }).notify(done);
        });

        it('FB: should redirect to the login page', (done) => {
            let params = {
                auth_provider: "facebook",
                client_id: "test_client_id",
                client_secret: "test_client_secret",
                scopes: "user_posts,publish_actions",
                callback_url: "http://www.example.com/auth/facebook/callback"
            };

            // The action returns a Promise and we can use "eventually" to wait for it.
            // If the action doesn't return a Promise we can remove "eventually"
            //   and write instead "should.deep.equal"
            let result = action(params);
            result.should.eventually.deep.equal({
                headers: {
                    Location: 'https://www.facebook.com/dialog/oauth?response_type=code&redirect_uri=http%3A%2F%2Fwww.example.com%2Fauth%2Ffacebook%2Fcallback&scope=user_posts%2Cpublish_actions&client_id=test_client_id',
                    'Content-Length': '0'
                },
                statusCode: 302,
                body: ''
            }).notify(done);
        });

    })
});
