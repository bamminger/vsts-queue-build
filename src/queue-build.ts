import tl = require('vsts-task-lib/task');
import vm = require('vso-node-api/WebApi');
import w = require('./worker');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {

    let debug: boolean = tl.getBoolInput('debug', true);
    var builds = new Array<w.Worker>();

    try {

        // Get oAuthToken
        let teamFoundationUri = tl.getVariable('system.teamFoundationCollectionUri');

        let auth = tl.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
        let token = auth.parameters['AccessToken'];
        let creds = vm.getPersonalAccessTokenHandler(token);
        let connection = new vm.WebApi(teamFoundationUri, creds);

        if (debug) {
            console.log(`TFS uri: ${teamFoundationUri}`);
            // console.log(`Token: ${token}`);
        }

        // Get api connection parameters
        let currentTeamProject = tl.getVariable('system.teamProject');

        let buildApi = connection.getBuildApi();
        if (debug) {
            console.log(`Team project: ${currentTeamProject}`);
        }

        // Start builds
        let buildsToStart = tl.getDelimitedInput('buildDefinitionName', '\n', true);
        if (debug) {
            console.log(`Build(s) to start (plain) ${tl.getInput('buildDefinitionName', true)}`);
        }

        for (let i = 0; i < buildsToStart.length; i++) {
            let worker = new w.Worker(buildsToStart[i], currentTeamProject, buildApi, debug);
            builds.push(worker);
            await worker.queueBuild();
        }


        let async: boolean = tl.getBoolInput('async', false);
        if (async === true) {
            tl.setResult(tl.TaskResult.Succeeded, `Build(s) queued (async).`);
            return;
        }

        // Poll build result
        let hasUnfinishedTasks = true;
        while (hasUnfinishedTasks) {
            await sleep(1000);

            hasUnfinishedTasks = false;

            for (let i = 0; i < builds.length; i++) {
                if (!(await builds[i].getCompletedStatus())) {
                    hasUnfinishedTasks = true;
                }
            }
        }

        // Finish task
        tl.setResult(tl.TaskResult.Succeeded, `Queue build(s) finished successfully`);

    }
    catch (error) {
        console.log(error);
        tl.setResult(tl.TaskResult.Failed, `Queue build(s) faild`);
    }
}

run();