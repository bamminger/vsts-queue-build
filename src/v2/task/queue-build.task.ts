import { TaskResult, setResult } from 'azure-pipelines-task-lib/task';
import { BuildWorker } from './queue-build.worker';
import { VstsApi } from './vsts-api';
import { EnvironmentConfiguration } from './configuration';
import { TaskSummary } from './util/task-summary';
import { sleep } from './util/runtime';

async function run() {
    let builds = new Array<BuildWorker>();
    let configuration: EnvironmentConfiguration;
    try {
        // Get environment variables
        configuration = new EnvironmentConfiguration();

        // Get Vsts Build Api
        let api = new VstsApi(configuration);
        let buildApi = await api.getBuildApi();

        // Start builds
        let buildConfigurations = await configuration.getBuildConfigurations(buildApi);
        for (let i = 0; i < buildConfigurations.length; i++) {
            let worker = new BuildWorker(buildConfigurations[i], configuration, buildApi);
            builds.push(worker);
            await worker.queueBuild();
        }

        // Complete task if async is true
        if (configuration.async === true) {
            TaskSummary.attach(builds, configuration);
            setResult(TaskResult.Succeeded, `Build(s) queued (async).`);
            return;
        }

        // Poll build result
        let hasUnfinishedTasks;
        do {
            await sleep(5);
            hasUnfinishedTasks = false;
            for (let i = 0; i < builds.length; i++) {
                if (!(await builds[i].getCompletedStatus())) {
                    hasUnfinishedTasks = true;
                }
            }
        } while (hasUnfinishedTasks);

        // Finish task
        TaskSummary.attach(builds, configuration);

        // Check build status
        for (let i = 0; i < builds.length; i++) {
            if (builds[i].getSuccessStatus() === false) {
                // At least one build failed
                setResult(TaskResult.Failed, `Queue build(s) failed`);
                return;
            }
        }

        // All builds successfully completed
        setResult(TaskResult.Succeeded, `Queue build(s) finished successfully`);
    }
    catch (error) {
        console.error(error);
        TaskSummary.attach(builds, configuration);
        setResult(TaskResult.Failed, `Queue build(s) failed`);
    }
}

run();
