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

function linkBuildResults(builds: Array<BuildWorker>) {
    let buildDirectory = getVariable("Agent.BuildDirectory");
    if (buildDirectory == null) {
        return;
    }

    var filepath = path.join(buildDirectory, `queueBuild-buildList.md`);
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
    console.log('Original builds linked')
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
            linkBuildResults(builds);
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
        linkBuildResults(builds);

        // Check build status
        for (let i = 0; i < builds.length; i++) {
            if (!builds[i].getBuildResult()) {
                // At least one build failed
                setResult(TaskResult.Failed, `Queue build(s) faild`);
                return;
            }
        }

        // All builds successfully completed
        setResult(TaskResult.Succeeded, `Queue build(s) finished successfully`);
    }
    catch (error) {
        linkBuildResults(builds);
        console.error(error);
        setResult(TaskResult.Failed, `Queue build(s) faild`);
    }
}

run();
