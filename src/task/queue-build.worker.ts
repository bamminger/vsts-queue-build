import { Build, BuildStatus, BuildResult, DefinitionReference } from 'vso-node-api/interfaces/BuildInterfaces';
import { IEnvironmentConfiguration, IBuildConfiguration } from './configuration';
import { BuildApi } from './build-api';
import { TeamProjectType } from './enum/team-project-type.enum';

const outputTimeInterval: number = 1000 * 60 * 2.5; // 2.5 Minutes

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

        // Get build definitions
        let buildDefinitions = await this.buildApi.getDefinitions(this.buildConfiguration.teamProject);
        if (this.environmentConfiguration.debug) {
            console.log(`Builds${this.getTeamProjectOutput(true, false)}: ${JSON.stringify(buildDefinitions)}`);
        }

        // Process build path
        if (this.environmentConfiguration.debug) {
            console.log(`Path: ${this.buildConfiguration.path}, Build name: ${this.buildConfiguration.buildName} ${this.getTeamProjectOutput(false, false)}`);
        }

        // Find build definition
        let buildDefinition = buildDefinitions.find(b => b.name === this.buildConfiguration.buildName && b.path == this.buildConfiguration.path);
        if (buildDefinition == null) {
            buildDefinition = buildDefinitions
                .find(b => b.name.toLowerCase() === this.buildConfiguration.buildName.toLowerCase()
                    && b.path.toLowerCase() == this.buildConfiguration.path.toLowerCase());

            if (buildDefinition == null) {
                this.cachedStatus = true;
                if (this.environmentConfiguration.async === true) {
                    throw Error(`Build definition "${this.buildConfiguration.originalBuildName}" not found ${this.getTeamProjectOutput(false, false)}`);
                } else {
                    console.error(`Build definition "${this.buildConfiguration.originalBuildName}" not found ${this.getTeamProjectOutput(false, false)}`);
                }
                return;
            }
        }
        if (this.environmentConfiguration.debug) {
            console.log(`Build definition id: ${buildDefinition.id} ${this.getTeamProjectOutput(false, false)}`);
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
        build.definition.id = buildDefinition.id;

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
        this.cachedBuildResult = await this.buildApi.getBuild(this.buildId);

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

    public getSuccessStatus(): boolean {
        if (this.cachedStatus === true
            && this.cachedBuildResult != null
            && (this.cachedBuildResult.result == BuildResult.Succeeded || this.cachedBuildResult.result == BuildResult.PartiallySucceeded)
        ) {
            return true;
        }

        return false;
    }

    private getTeamProjectOutput(prefixWhitespace: boolean, postfixWhitespace: boolean) {
        if (this.environmentConfiguration.teamProjectType == TeamProjectType.JsonConfiguration) {
            return (prefixWhitespace ? ' ' : '')
                + `(Team project: ${this.buildConfiguration.teamProject})`
                + (postfixWhitespace ? ' ' : '');
        }
        return '';
    }
}
