import { IBuildApi } from 'vso-node-api/BuildApi';
import { Build, BuildStatus, BuildResult, DefinitionReference } from 'vso-node-api/interfaces/BuildInterfaces';
import { IEnvironmentConfiguration, IBuildConfiguration } from './configuration';

const outputTimeInterval: number = 150000; // 2.5 Minutes

export class BuildWorker {

    protected buildQueueResult: Build;
    protected cachedStatus: boolean;
    protected lastOutputTime: number;

    constructor(
        protected buildConfiguration: IBuildConfiguration,
        protected environmentConfiguration: IEnvironmentConfiguration,
        protected buildApi: IBuildApi,
    ) {
    }

    public async queueBuild(): Promise<void> {

        // Get build definitions
        let buildDefinitions = await this.buildApi.getDefinitions(this.environmentConfiguration.teamProject);
        if (this.environmentConfiguration.debug) {
            console.log(`Builds: ${JSON.stringify(buildDefinitions)}`);
        }

        // Process build path
        if (this.environmentConfiguration.debug) {
            console.log(`Path: ${this.buildConfiguration.path}, Build name: ${this.buildConfiguration.buildName}`);
        }

        // Find build definition
        let buildDefinition = buildDefinitions.find(b => b.name === this.buildConfiguration.buildName && b.path == this.buildConfiguration.path);
        if (buildDefinition == null) {
            throw new Error(`Build definition "${this.buildConfiguration.originalBuildName}" not found`);
        }
        if (this.environmentConfiguration.debug) {
            console.log(`Build definition id: ${buildDefinition.id}`);
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

        // Transform build parameters from object to string
        if (build.parameters != null && typeof build.parameters != "string") {
            build.parameters = JSON.stringify(build.parameters);
        }

        if (this.environmentConfiguration.debug) {
            console.log(`Queue request parameters for build "${this.buildConfiguration.buildName}": ${JSON.stringify(build)}`);
        }

        this.buildQueueResult = await this.buildApi.queueBuild(build, this.environmentConfiguration.teamProject, true);
        console.log(`Build "${this.buildConfiguration.buildName}" started - ${this.buildQueueResult.buildNumber}`);

        this.lastOutputTime = new Date().getTime();
    }

    public async getCompletedStatus(): Promise<boolean> {
        // Avoid status check for already completed tasks
        if (this.cachedStatus === true) {
            return this.cachedStatus;
        }

        // Check build status
        let build = await this.buildApi.getBuild(this.buildQueueResult.id);
        if (build.status === BuildStatus.Completed) {
            console.log(`Build "${this.buildConfiguration.buildName}" completed - ${this.buildQueueResult.buildNumber}`);

            // Abort task in case of a failed build
            if (build.result == BuildResult.Failed) {
                throw Error(`Build "${this.buildConfiguration.buildName}" failed`);
            }

            this.cachedStatus = true;
            return true;
        }

        // Ensure output during running builds
        let currentTime = new Date().getTime();
        if (currentTime - outputTimeInterval > this.lastOutputTime) {
            console.log(`Build "${this.buildConfiguration.buildName}" is running - ${this.buildQueueResult.buildNumber}`);
            this.lastOutputTime = currentTime;
        }

        return false;
    }
}
