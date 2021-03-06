import { Build, BuildStatus, BuildResult, DefinitionReference } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { IEnvironmentConfiguration, IBuildConfiguration } from './configuration';
import { BuildApi } from './build-api';
import { getTeamProjectOutput, updateOutputVariable } from './util/output';
import { sleep } from './util/runtime';

const outputTimeInterval: number = 1000 * 60 * 2.5; // 2.5 Minutes
const requestFailureRetryCount: number = 3;

export class BuildWorker {

    private buildId: number;
    private lastOutputTime: number;
    private cachedStatus: boolean;
    private cachedBuildResult: Build = null;

    constructor(
        private buildConfiguration: IBuildConfiguration,
        private environmentConfiguration: IEnvironmentConfiguration,
        private buildApi: BuildApi
    ) { }

    public async queueBuild(): Promise<void> {
        // Invalid definition handling
        if (this.buildConfiguration.buildDefinitionId == null) {
            this.cachedStatus = true;
            return;
        }

        // Queue build 
        let build: Build = this.buildConfiguration.configuration;

        // Ensure valid build definition
        if (build == null) {
            build = <Build>{};
        }
        if (build.definition == null) {
            build.definition = <DefinitionReference>{ id: 0 };
        }

        // Set build id
        build.definition.id = this.buildConfiguration.buildDefinitionId;

        // Set optional requested for
        if (this.environmentConfiguration.requestedFor != null) {
            if (build.requestedFor == null) {
                build.requestedFor = <any>{ id: '' };
            }
            build.requestedFor.id = this.environmentConfiguration.requestedFor;
        }

        // Transform build parameters from object to string
        if (build.parameters != null && typeof build.parameters != "string") {
            build.parameters = JSON.stringify(build.parameters);
        }

        if (this.environmentConfiguration.debug) {
            console.log(`Queue request parameters for build "${this.buildConfiguration.buildName}"${this.getTeamProjectOutput(true, true)}: ${JSON.stringify(build)}`);
        }

        let buildQueueResult = await this.buildApi.queueBuild(build, this.buildConfiguration.teamProject, true);
        this.buildId = buildQueueResult.id;
        console.log(`Build "${this.buildConfiguration.buildName}" started ${this.getTeamProjectOutput(false, true)}- ${buildQueueResult.buildNumber}`);
        console.log(`      Link: ${buildQueueResult._links.web.href}`);

        this.setBuildIdOutputVariable();

        // Set initial build link for async tasks
        if (this.environmentConfiguration.async === true) {
            this.cachedBuildResult = await this.buildApi.getBuild(this.buildId);
        }

        this.lastOutputTime = new Date().getTime();
    }

    public async getCompletedStatus(): Promise<boolean> {
        // Avoid status check for already completed tasks
        if (this.cachedStatus === true) {
            return this.cachedStatus;
        }

        // Check build status
        for (let i = 1; i <= requestFailureRetryCount; i++) {
            try {
                this.cachedBuildResult = await this.buildApi.getBuild(this.buildId);
                break;
            }
            catch (error) {
                console.warn(`Request to check status of build "${this.buildConfiguration.buildName}" failed. Attempt: ${i}`);
                if (i < requestFailureRetryCount) {
                    await sleep(2 * i);
                } else {
                    throw error;
                }
            }
        }

        if (this.cachedBuildResult.status === BuildStatus.Completed) {
            console.log(`Build "${this.buildConfiguration.buildName}" completed ${this.getTeamProjectOutput(false, true)}- ${this.cachedBuildResult.buildNumber}`);
            this.cachedStatus = true;
            return true;
        }

        // Ensure output during running builds
        let currentTime = new Date().getTime();
        if (currentTime - outputTimeInterval > this.lastOutputTime) {
            console.log(`Build "${this.buildConfiguration.buildName}" is running ${this.getTeamProjectOutput(false, true)}- ${this.cachedBuildResult.buildNumber}`);
            this.lastOutputTime = currentTime;
        }

        return false;
    }

    public getBuildResult(): Build {
        return this.cachedBuildResult;
    }

    public getBuildName(): string {
        return this.buildConfiguration.originalBuildName;
    }

    public isSucceeded(): boolean {
        if (this.cachedStatus === true
            && this.cachedBuildResult != null
            && (this.cachedBuildResult.result == BuildResult.Succeeded || this.cachedBuildResult.result == BuildResult.PartiallySucceeded)
        ) {
            return true;
        }

        return false;
    }

    public isPartiallySucceeded(): boolean {
        if (this.cachedStatus === true
            && this.cachedBuildResult != null
            && this.cachedBuildResult.result == BuildResult.PartiallySucceeded
        ) {
            return true;
        }

        return false;
    }

    private getTeamProjectOutput(prefixWhitespace: boolean, postfixWhitespace: boolean) {
        return getTeamProjectOutput(this.environmentConfiguration, this.buildConfiguration, prefixWhitespace, postfixWhitespace);
    }

    private setBuildIdOutputVariable() {
        // GLobal configuration
        updateOutputVariable(this.environmentConfiguration.buildIdOutputVariable, this.buildId);

        // Build specific configuration
        updateOutputVariable(this.buildConfiguration.buildIdOutputVariable, this.buildId);
    }
}
