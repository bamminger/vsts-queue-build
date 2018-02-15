import { Build, BuildStatus, BuildResult, DefinitionReference } from 'vso-node-api/interfaces/BuildInterfaces';
import { IEnvironmentConfiguration, IBuildConfiguration } from './configuration';
import { BuildApi } from './build-api';

const outputTimeInterval: number = 150000; // 2.5 Minutes

export class BuildWorker {

    protected buildId: number;
    protected lastOutputTime: number;
    protected cachedStatus: boolean;
    protected cachedBuildResult: Build = null;

    constructor(
        protected buildConfiguration: IBuildConfiguration,
        protected environmentConfiguration: IEnvironmentConfiguration,
        protected buildApi: BuildApi
    ) { }

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
            buildDefinition = buildDefinitions
                .find(b => b.name.toLowerCase() === this.buildConfiguration.buildName.toLowerCase()
                    && b.path.toLowerCase() == this.buildConfiguration.path.toLowerCase());

            if (buildDefinition == null) {
                this.cachedStatus = true;
                if (this.environmentConfiguration.async === true) {
                    throw Error(`Build definition "${this.buildConfiguration.originalBuildName}" not found`);
                } else {
                    console.error(`Build definition "${this.buildConfiguration.originalBuildName}" not found`);
                }
                return;
            }
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
            console.log(`Queue request parameters for build "${this.buildConfiguration.buildName}": ${JSON.stringify(build)}`);
        }

        let buildQueueResult = await this.buildApi.queueBuild(build, this.environmentConfiguration.teamProject, true);
        this.buildId = buildQueueResult.id;
        console.log(`Build "${this.buildConfiguration.buildName}" started - ${buildQueueResult.buildNumber}`);
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
            console.log(`Build "${this.buildConfiguration.buildName}" completed - ${this.cachedBuildResult.buildNumber}`);
            this.cachedStatus = true;
            return true;
        }

        // Ensure output during running builds
        let currentTime = new Date().getTime();
        if (currentTime - outputTimeInterval > this.lastOutputTime) {
            console.log(`Build "${this.buildConfiguration.buildName}" is running - ${this.cachedBuildResult.buildNumber}`);
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
}
