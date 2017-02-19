import vb = require('vso-node-api/BuildApi');

export class Worker {

    protected buildQueueResult;
    protected cachedStatus: boolean;

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
        let path = '\\'; // default value;
        if (pathIndex > 0) {
            path += this.buildName.substring(0, pathIndex);
            this.buildName = this.buildName.substring(pathIndex + 1, this.buildName.length);
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
        let build = { definition: { id: 0 } }; // new vm.Build();
        build.definition.id = buildDefinition.id;

        this.buildQueueResult = await this.buildApi.queueBuild(<any>build, this.teamProject, true);
        console.log(`Build ${this.buildName} started - ${this.buildQueueResult.buildNumber}`);
    }

    public async getCompletedStatus(): Promise<boolean> {
        if (this.cachedStatus === true) {
            return this.cachedStatus;
        }

        if ((await this.buildApi.getBuild(this.buildQueueResult.id)).status === 2) // 2 = completed
        {
            console.log(`Build completed ${this.buildQueueResult.buildNumber}`);

            this.cachedStatus = true;
            return true;
        }
        return false;
    }
}