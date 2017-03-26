import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'vsts-task-lib/mock-test';

describe('Single queue build tests', function () {
    this.timeout(10000);

    before(() => {
        process.env['SYSTEM_TEAMPROJECT'] = '';
        process.env['SYSTEM_TEAMFOUNDATIONCOLLECTIONURI'] = '';
        process.env['queue_accesstoken'] = '';
        process.env['queue_build_debug'] = 'true';
        process.env['queue_build_async'] = 'false';
    });

    after(() => {

    });

    it('should fail with invalid definition', (done: MochaDone) => {

        process.env['queue_build_definition'] = '\\fail';

        let tp = path.join(__dirname, 'runner.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.failed, 'should have failed');
        assert(tr.stderr.indexOf('Build definition not found') >= 0, "build definition should be invalid");

        done();
    });

    it('should succeed with valid definition', (done: MochaDone) => {

        process.env['queue_build_async'] = 'true';
        process.env['queue_build_definition'] = 'Build 01';

        let tp = path.join(__dirname, 'runner.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert(tr.stdout.indexOf(`Build "${process.env['queue_build_definition']}" started`) >= 0, "build definition should be valid");

        done();
    });
});