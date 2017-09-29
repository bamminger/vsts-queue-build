import { TaskResult, setResult } from 'vsts-task-lib/task';
import { WebApi, getPersonalAccessTokenHandler } from 'vso-node-api/WebApi';
import { BuildWorker } from './queue-build.worker';
import { VstsApi } from './vsts-api';
import { EnvironmentConfiguration } from './configuration';


import tl = require('vsts-task-lib/task');
import path = require('path');
import fs = require('fs');

function sleep(ms): Promise<{}> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        var filepath = path.join(tl.getVariable("Agent.BuildDirectory"),`buildList.md`);
        var dataStr="";
        console.log(`filepath: ${filepath}`);
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
        for (let i = 0; i < builds.length; i++) {
            dataStr+= builds[i].getBuildLink();
        }
        console.log(`dataStr: ${dataStr}`);
        fs.writeFileSync(filepath,dataStr);
        console.log("##vso[task.addattachment type=Distributedtask.Core.Summary;name=Original Builds;]"+filepath);
        // Finish task
        setResult(TaskResult.Succeeded, `Queue build(s) finished successfully`);

    }
    catch (error) {
        console.error(error);
        setResult(TaskResult.Failed, `Queue build(s) faild`);
    }
}

run();
