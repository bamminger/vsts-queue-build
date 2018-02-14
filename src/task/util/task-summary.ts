import path = require('path');
import fs = require('fs');

import { getVariable } from 'vsts-task-lib';
import { BuildWorker } from '../queue-build.worker';
import { IEnvironmentConfiguration } from '../configuration';

export abstract class TaskSummary {
    public static attach(
        builds: Array<BuildWorker>,
        environmentConfiguration: IEnvironmentConfiguration
    ) {
        let workDirectory = getVariable("Agent.BuildDirectory");
        if (workDirectory == null) {
            workDirectory = getVariable("Agent.ReleaseDirectory");
            if (workDirectory == null) {
                return;
            }
        }

        var filepath = path.join(workDirectory, `QueueBuild-BuildResult.html`);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        fs.writeFileSync(filepath, TaskSummary.getSummary(builds, environmentConfiguration));

        console.log("##vso[task.addattachment type=Distributedtask.Core.Summary;name=Queued Builds;]" + filepath);
        console.log('Queued builds linked to build result');
    }

    private static getSummary(
        builds: Array<BuildWorker>,
        environmentConfiguration: IEnvironmentConfiguration
    ): string {
        let summary = '';
        let baseIconDefinition = `style="vertical-align:top" class="icon bowtie-icon`;

        for (let i = 0; i < builds.length; i++) {
            summary += `<div style="padding: 3px 0">\n`;

            let buildResult = builds[i].getBuildResult();

            // Invalid build
            if (buildResult == null) {
                summary += `<span ${baseIconDefinition} build-failure-icon-color bowtie-edit-delete" aria-label="failed" title="Invalid"></span><span>${builds[i].getBuildName()}</span>\n`;
            }

            // Valid build
            else {
                if (environmentConfiguration != null && environmentConfiguration.async === true) {
                    summary += `<span ${baseIconDefinition} build-brand-icon-color bowtie-play-fill" aria-label="started" title="Started"></span>\n`;
                }
                else {
                    if (builds[i].getSuccessStatus() === true) {
                        summary += `<span ${baseIconDefinition} build-success-icon-color bowtie-check" aria-label="succeeded" title="Succeeded"></span>\n`;
                    }
                    else {
                        summary += `<span ${baseIconDefinition} build-failure-icon-color bowtie-edit-delete" aria-label="failed" title="Failed"></span>\n`;
                    }
                }
                summary += `<a href="${buildResult._links.web.href}">${buildResult.definition.name}</a>\n`;
            }

            summary += `</div>\n`;
        }

        return summary;
    }
}