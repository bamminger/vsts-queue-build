import * as path from 'path';
import * as assert from 'assert';
import { MockTestRunner } from 'vsts-task-lib/mock-test';

const timeout: number = 100000;

function initializeEnvironment(): void {
    process.env['SYSTEM_TEAMPROJECT'] = '';
    process.env['SYSTEM_TEAMFOUNDATIONCOLLECTIONURI'] = '';
    process.env['queue_build_auth_token'] = '';
    process.env['queue_build_debug'] = 'true';
    process.env['queue_build_async'] = 'false';
    process.env['queue_build_configuration_type'] = 'json';
    process.env['queue_build_configuration'] = '';
}


/*
 *  Single definition tests 
 */
describe('Single queue build tests', function () {
    this.timeout(timeout);

    before(initializeEnvironment);

    it('invalid definition', (done: MochaDone) => {

        process.env['queue_build_definition'] = '\\fail';

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.failed, 'should have failed');
        assert(tr.stderr.indexOf('Build definition "\\fail" not found') >= 0, "build definition should be invalid");

        done();
    });

    it('definition without path', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = 'Build 01';

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "${process.env['queue_build_definition']}" started`) >= 0, "build definition should be valid");

        done();
    });

    it('definition with path', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = '\\Build 01';

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition should be valid");

        done();
    });

    it('case insensitive definition with path', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = '\\build 01';
        process.env['queue_build_configuration'] = `{
    "bUild 01": {
        "sourceBranch": null
    }
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "build 01" started`) >= 0, "build definition should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "build 01": {"sourceBranch":null`) >= 0, "build parameters should be matched");

        done();
    });

});


/*
 *  Multiple definition tests 
 */
describe('Queue multiple builds tests', function () {
    this.timeout(timeout);

    before(initializeEnvironment);

    it('invalid definitions', (done: MochaDone) => {

        process.env['queue_build_definition'] = `\\fail
\\fail2`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.failed, 'should have failed');
        assert(tr.stderr.indexOf('Build definition "\\fail" not found') >= 0, "build definition should be invalid");
        assert(tr.stderr.indexOf('Build definition "\\fail2" not found') >= 0, "build should not abort after first error");

        done();
    });


    it('definition without path', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = `Build 01
test\\Build 02`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition for build1 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 02" started`) >= 0, "build definition for build2 should be valid");

        done();
    });

    it('definition with path', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = `\\test\\test 2\\Build 03
\\Build 01
\\test\\Build 02`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 03" started`) >= 0, "build definition for build3 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition for build1 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 02" started`) >= 0, "build definition for build2 should be valid");

        done();
    });

});


/*
 *  Multiple definition tests 
 */
describe('Queue builds with configuration tests', function () {
    this.timeout(timeout);

    before(initializeEnvironment);

    it('invalid definition', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = 'Build 01'
        process.env['queue_build_configuration'] = `{
"sourceBranch": null,
sourceVersion: null,
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.failed, 'should have failed');
        assert(tr.stderr.indexOf(`Build configuration error: Unexpected token`) >= 0, "build configuration should be invalid");

        done();
    });


    it('single definition', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = 'Build 01'
        process.env['queue_build_configuration'] = `{
"sourceBranch": null,
"sourceVersion": null,
"parameters": {
    "system.debug": true
}
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 01": {"sourceBranch":null,"sourceVersion":null,"parameters":"{\\"system.debug\\":true}","definition":{"id":`) >= 0, "build configuration should be valid");

        done();
    });

    it('multiple definition', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = `Build 01
\\test\\Build 02`;
        process.env['queue_build_configuration'] = `{
"sourceBranch": "master",
"sourceVersion": null,
"parameters": {
    "system.debug": true
}
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition for build1 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 02" started`) >= 0, "build definition for build2 should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 01": {"sourceBranch":"master","sourceVersion":null,"parameters":"{\\"system.debug\\":true}","definition":{"id":`) >= 0, "build configuration for build1 should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 02": {"sourceBranch":"master","sourceVersion":null,"parameters":"{\\"system.debug\\":true}","definition":{"id":`) >= 0, "build configuration for build2 should be valid");

        done();
    });


    it('multiple definition build specific', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = `Build 01
\\test\\Build 02`;
        process.env['queue_build_configuration'] = `{
"Build 01": {
    "sourceBranch": "feature/angular-release"
}
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition for build1 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 02" started`) >= 0, "build definition for build2 should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 01": {"sourceBranch":"feature/angular-release","definition":{"id":`) >= 0, "build configuration for build1 should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 02": {"definition":{"id":`) >= 0, "build configuration should not be used for build2");

        done();
    });

    it('multiple definition default and build specific', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = `\\test\\test 2\\Build 03
\\Build 01
\\test\\Build 02`;
        process.env['queue_build_configuration'] = `{
"default": {
    "parameters": {
        "system.debug": true,
        "testVariable": "Another value"
    }
},
"Build 01": {
    "sourceBranch": "feature/angular-release"
},
"Build 02": {
    "sourceBranch": "master",
    "sourceVersion": "7501defae79c4bedf4ab2231bae3cd01664bf18c"
}
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition for build1 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 02" started`) >= 0, "build definition for build2 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 03" started`) >= 0, "build definition for build3 should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 01": {"sourceBranch":"feature/angular-release","definition":{"id":`) >= 0, "build configuration for build1 should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 02": {"sourceBranch":"master","sourceVersion":"7501defae79c4bedf4ab2231bae3cd01664bf18c","definition":{"id":`) >= 0, "build configuration for build2 should be valid");
        assert(tr.stdout.indexOf(`Queue request parameters for build "Build 03": {"parameters":"{\\"system.debug\\":true,\\"testVariable\\":\\"Another value\\"}","definition":{"id":`) >= 0, "build configuration for build3 should be valid");

        done();
    });

});


/*
 *  Configuration type tests 
 */
describe('Queue configuration type tests', function () {
    this.timeout(timeout);

    before(initializeEnvironment);

    it('simple single backslash configuration', (done: MochaDone) => {

        process.env['queue_build_definition'] = `\\test\\test 2\\Build 03`;
        process.env['queue_build_async'] = 'true';
        process.env['queue_build_configuration_type'] = 'singleBackslashJson';
        process.env['queue_build_configuration'] = `{
    "default": {
        "parameters": {
            "system.debug": true,
            "testVariable": "\\remote\folder"
        }
    },
    "build 01": {
        "parameters": {
            "system.debug": true,
            "testVariable": "\\remote\folder"
        }
    },
    "build 03": {
        "parameters": {
            "system.debug": true,
            "testVariable": "\\remote2\folder"
        }
    }
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        done();
    });

    it('simple invalid json configuration', (done: MochaDone) => {

        process.env['queue_build_definition'] = `\\test\\test 2\\Build 03`;
        process.env['queue_build_async'] = 'true';
        process.env['queue_build_configuration_type'] = 'json';
        process.env['queue_build_configuration'] = `{
    "default": {
        "parameters": {
            "system.debug": true,
            "testVariable": "\\remote\folder"
        }
    }
}`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.failed, 'should have failed');
        assert(tr.stderr.indexOf('Unexpected token') >= 0, "output should contain a detailed error information");

        done();
    });

});


/*
 *  Comment tests 
 */
describe('Comment queue build tests', function () {
    this.timeout(timeout);

    before(initializeEnvironment);

    it('valid definition with comment', (done: MochaDone) => {

        process.env['queue_build_definition'] = `# Sample comment
#in multiple lines
Build 01
# and a final comment before the next statement
\\test\\Build 02
`;

        let tp = path.join(__dirname, 'runner.js');
        let tr: MockTestRunner = new MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "Build 01" started`) >= 0, "build definition for build1 should be valid");
        assert(tr.stdout.indexOf(`Build "Build 02" started`) >= 0, "build definition for build2 should be valid");

        done();
    });

});