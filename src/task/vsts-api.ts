import { getInput, getDelimitedInput } from 'vsts-task-lib/task';
import { WebApi, getPersonalAccessTokenHandler } from 'vso-node-api/WebApi';
import { IBuildApi } from 'vso-node-api/BuildApi';
import { IEnvironmentConfiguration, IBuildConfiguration, BuildConfiguration } from './configuration';

export class VstsApi {

    constructor(
        private configuration: IEnvironmentConfiguration
    ) { }

    public getBuildConfigurations(): IBuildConfiguration[] {

        let buildsToStart = getDelimitedInput('buildDefinitionName', '\n', true);
        if (this.configuration.debug) {
            console.log(`Build(s) to start (plain) ${getInput('buildDefinitionName', true)}`);
        }

        let buildConfigurations = new Array<IBuildConfiguration>();
        for (let i = 0; i < buildsToStart.length; i++) {
            buildConfigurations.push(new BuildConfiguration(buildsToStart[i]));
        }

        return buildConfigurations;
    }

    /**
    * Create Build Api connection
    * @param teamFoundationUri Team Foundation server uri
    * @param accessToken OAuth token
    */
    public getBuildApi(): IBuildApi {
        let connection = this.createConnection(this.configuration.teamFoundationUri, this.configuration.accessToken);

        let buildApi = connection.getBuildApi();
        if (this.configuration.debug) {
            console.log(`Team project: ${this.configuration.teamProject}`);
        }

        return buildApi;
    }

    private createConnection(teamFoundationUri: string, accessToken: string): WebApi {
        let creds = getPersonalAccessTokenHandler(accessToken);
        let connection = new WebApi(teamFoundationUri, creds);

        if (this.configuration.debug) {
            console.log(`TFS uri: ${teamFoundationUri}`);
        }

        return connection;
    }
}
