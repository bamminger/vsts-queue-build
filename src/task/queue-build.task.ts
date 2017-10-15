import { TaskResult, setResult, getVariable } from 'vsts-task-lib/task';
import { WebApi, getPersonalAccessTokenHandler } from 'vso-node-api/WebApi';
import { BuildWorker } from './queue-build.worker';
import { VstsApi } from './vsts-api';
import { EnvironmentConfiguration } from './configuration';

import path = require('path');
import fs = require('fs');

function sleep(ms): Promise<{}> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function linkBuildQueued(builds: Array<BuildWorker>) {
    var filepath = path.join(getVariable("Agent.BuildDirectory"), `buildList.md`);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
    var dataStr = "";
    for (let i = 0; i < builds.length; i++) {
        let buildLink = builds[i].getBuildLink();
        if (buildLink != null && buildLink != ``) {
            dataStr += buildLink;
        }
    }
    fs.writeFileSync(filepath, dataStr);
    console.log("##vso[task.addattachment type=Distributedtask.Core.Summary;name=Original Builds;]" + filepath);
}

async function run() {

    let builds = new Array<BuildWorker>();
    try {
        // Get environment variables
        let configuration = new EnvironmentConfiguration();

        // Get Vsts Build Api
        let api = new VstsApi(configuration);
        let buildApi = api.getBuildApi();

        // Start builds
        let buildsToStart = api.getBuildConfigurations();
        for (let i = 0; i < buildsToStart.length; i++) {
            let worker = new BuildWorker(buildsToStart[i], configuration, buildApi);
            builds.push(worker);
            await worker.queueBuild();
        }

        // Complete task if async is true
        if (configuration.async === true) {
            setResult(TaskResult.Succeeded, `Build(s) queued (async).`);
            return;
        }
        
        let isBuildSuccessed = true;

        // Poll build result
        let hasUnfinishedTasks;
        do {
            await sleep(1000);
            hasUnfinishedTasks = false;
            for (let i = 0; i < builds.length; i++) {
                if (!(await builds[i].getCompletedStatus())) {
                    hasUnfinishedTasks = true;
                } else if (!builds[i].getBuildResult()) {
                    isBuildSuccessed = false;
                }
            }
        } while (hasUnfinishedTasks);

        // Finish task
        linkBuildQueued(builds);
        if (isBuildSuccessed) {
            setResult(TaskResult.Succeeded, `Queue build(s) finished successfully`);
        } else {
            setResult(TaskResult.Failed, `Queue build(s) faild`);
        }

    }
    catch (error) {
        linkBuildQueued(builds);
        console.error(error);
        setResult(TaskResult.Failed, `Queue build(s) faild`);
    }
}

run();
