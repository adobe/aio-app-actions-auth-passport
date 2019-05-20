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
import {
    expect
} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import StrategyFactory from '.././../src/action/strategy/factory';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('StrategyFactory', () => {
    describe('with an authentication provider', () => {

        it('like GitHub, should create the correct instance', (done) => {
            let params = {
                auth_provider: "github"
            };

            let result = StrategyFactory.getStrategy(params.auth_provider);
            expect(result.name).to.equal("Strategy");
            done();
        });

        it('which is not imported, should return an error', (done) => {
            try{
                let result = StrategyFactory.getStrategy("invalid");
                expect(result).to.be.an.instanceOf(Error);
                done();
            }catch(err){
                expect(err).not.be.equal(undefined);
                done();
            }
        })

    })
});
