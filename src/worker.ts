import vb = require('vso-node-api/BuildApi');
import i = require('vso-node-api/interfaces/BuildInterfaces');


const fiveMinutesTimeDifference: number = 300000;

export class Worker {

    protected buildQueueResult: i.Build;
    protected cachedStatus: boolean;
    protected lastOutputTime: number;

    constructor(
        protected buildName: string,
        protected teamProject: string,
        protected buildApi: vb.IBuildApi,
        protected debug: boolean
    ) {
    }

    public async queueBuild(): Promise<void> {

        // Get build definitions
        let buildDefinitions = await this.buildApi.getDefinitions(this.teamProject);
        if (this.debug) {
            console.log(`Builds: ${JSON.stringify(buildDefinitions)}`);
        }

        // Process build path
        let pathIndex = this.buildName.lastIndexOf('\\');
        let path = null;
        if (pathIndex > 0) {
            path += this.buildName.substring(0, pathIndex);
            if (path.length > 0 && path[0] !== '\\') { // Make leading \ optional
                path = '\\' + path;
            }

            this.buildName = this.buildName.substring(pathIndex + 1, this.buildName.length); // Remove path from build name
        }
        else {
            path = '\\'; // default value;
        }


        if (this.debug) {
            console.log(`Path: ${path}, Build name: ${this.buildName}`);
        }

        // Find build definition
        let buildDefinition = buildDefinitions.find(b => b.name === this.buildName && b.path == path);
        if (buildDefinition == null) {
            throw `Build definition not found`;
        }
        if (this.debug) {
            console.log(`Build definition id: ${buildDefinition.id}`);
        }

        // Queue build 
        let build: i.Build = <i.Build>{ definition: { id: 0 } };
        build.definition.id = buildDefinition.id;

        this.buildQueueResult = await this.buildApi.queueBuild(build, this.teamProject, true);
        console.log(`Build ${this.buildName} started - ${this.buildQueueResult.buildNumber}`);

        this.lastOutputTime = new Date().getTime();
    }

    public async getCompletedStatus(): Promise<boolean> {
        if (this.cachedStatus === true) {
            return this.cachedStatus;
        }

        // Check build status
        if ((await this.buildApi.getBuild(this.buildQueueResult.id)).status === 2) // 2 = completed
        {
            console.log(`Build ${this.buildName} started - ${this.buildQueueResult.buildNumber}`);

            this.cachedStatus = true;
            return true;
        }

        // Ensure output during running builds
        let currentTime = new Date().getTime();
        if (currentTime - fiveMinutesTimeDifference > this.lastOutputTime) {
            console.log(`Build ${this.buildName} is running - ${this.buildQueueResult.buildNumber}`);
            this.lastOutputTime = currentTime;
        }

        return false;
    }
}