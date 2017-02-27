import {
    getVariable, getEndpointAuthorization,
    getInput, getBoolInput, getDelimitedInput,
    TaskResult, setResult
} from 'vsts-task-lib/task';
import { WebApi, getPersonalAccessTokenHandler } from 'vso-node-api/WebApi';
import { Worker } from './worker';

function sleep(ms): Promise<{}> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {

    let debug: boolean = getBoolInput('debug', true);
    var builds = new Array<Worker>();

    try {

        // Get auth token
        let teamFoundationUri = getVariable('system.teamFoundationCollectionUri');

        let auth = getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
        let token = auth.parameters['AccessToken'];
        let creds = getPersonalAccessTokenHandler(token);
        let connection = new WebApi(teamFoundationUri, creds);

        if (debug) {
            console.log(`TFS uri: ${teamFoundationUri}`);
        }

        // Get api connection parameters
        let currentTeamProject = getVariable('system.teamProject');

        let buildApi = connection.getBuildApi();
        if (debug) {
            console.log(`Team project: ${currentTeamProject}`);
        }

        // Start builds
        let buildsToStart = getDelimitedInput('buildDefinitionName', '\n', true);
        if (debug) {
            console.log(`Build(s) to start (plain) ${getInput('buildDefinitionName', true)}`);
        }

        for (let i = 0; i < buildsToStart.length; i++) {
            let worker = new Worker(buildsToStart[i], currentTeamProject, buildApi, debug);
            builds.push(worker);
            await worker.queueBuild();
        }

        // Complete task if async is true
        let async: boolean = getBoolInput('async', false);
        if (async === true) {
            setResult(TaskResult.Succeeded, `Build(s) queued (async).`);
            return;
        }

        // Poll build result
        let hasUnfinishedTasks;
        do {
            await sleep(1000);
            hasUnfinishedTasks = false;

            for (let i = 0; i < builds.length; i++) {
                if (!(await builds[i].getCompletedStatus())) {
                    hasUnfinishedTasks = true;
                }
            }
        } while (hasUnfinishedTasks);

        // Finish task
        setResult(TaskResult.Succeeded, `Queue build(s) finished successfully`);

    }
    catch (error) {
        console.error(error);
        setResult(TaskResult.Failed, `Queue build(s) faild`);
    }
}

run();