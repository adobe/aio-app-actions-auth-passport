/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// You would think that echo is cross-platform, but nope.
// echo "foo bar" >> file.txt
// ... will also echo the quotes also, in Windows.

const { program } = require('commander')

program
  .name('echo')
  .argument('<stringToEcho>', 'string argument')
  .action((stringToEcho, options) => {
    process.stdout.write(stringToEcho)
  })

program.parse()