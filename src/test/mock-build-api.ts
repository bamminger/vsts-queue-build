import { IBuildApi } from "vso-node-api/BuildApi";
import { Build, BuildStatus, BuildResult } from "vso-node-api/interfaces/BuildInterfaces";

export class BuildApi {

    constructor(private buildApi: IBuildApi) { }

    public async queueBuild(build: Build, project: string, ignoreWarnings: boolean) {
        let result = await this.buildApi.queueBuild(build, project, ignoreWarnings);

        result.status = BuildStatus.Cancelling;
        this.buildApi.updateBuild(result, result.id, project);

        return result;
    }

    public getDefinitions(project: string) {
        return this.buildApi.getDefinitions(project);
    }

    public async getBuild(buildId: number) {
        let build = await this.buildApi.getBuild(buildId);
        build.status = BuildStatus.Completed;
        build.result = BuildResult.Succeeded;
        return build;
    }
}