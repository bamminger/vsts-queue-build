import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'task', 'queue-build.task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('debug', process.env['queue_build_debug']);
tmr.setInput('async', process.env['queue_build_async']);
tmr.setInput('buildDefinitionName', process.env['queue_build_definition']);
tmr.setInput('buildConfiguration', process.env['queue_build_configuration']);

tmr.run();
