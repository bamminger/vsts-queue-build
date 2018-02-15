import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'task', 'queue-build.task.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('debug', process.env['queue_build_debug']);
tmr.setInput('async', process.env['queue_build_async']);
tmr.setInput('buildDefinitionName', process.env['queue_build_definition']);
tmr.setInput('buildConfiguration', process.env['queue_build_configuration']);
tmr.setInput('buildConfigurationType', process.env['queue_build_configuration_type']);
tmr.setInput('authToken', process.env['queue_build_auth_token']);
tmr.setInput('teamProjectType', process.env['queue_build_team_project_type']);

var mockBuildApi = require('./mock-build-api');

// Mock a specific module function called in task 
tmr.registerMock('./build-api', mockBuildApi);

tmr.run();
