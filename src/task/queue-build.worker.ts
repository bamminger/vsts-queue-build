import { IBuildApi } from 'vso-node-api/BuildApi';
import { Build, BuildStatus } from 'vso-node-api/interfaces/BuildInterfaces';
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
            throw new Error(`Build definition not found`);
        }
        if (this.environmentConfiguration.debug) {
            console.log(`Build definition id: ${buildDefinition.id}`);
        }

        // Queue build 
        let build: Build = <Build>{ definition: { id: 0 } };
        build.definition.id = buildDefinition.id;

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
        if ((await this.buildApi.getBuild(this.buildQueueResult.id)).status === BuildStatus.Completed) {
            console.log(`Build "${this.buildConfiguration.buildName}" completed - ${this.buildQueueResult.buildNumber}`);

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
