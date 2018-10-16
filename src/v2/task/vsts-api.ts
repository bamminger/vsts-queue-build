import { WebApi, getPersonalAccessTokenHandler } from 'azure-devops-node-api/WebApi';
import { IEnvironmentConfiguration } from './configuration';
import { BuildApi } from './build-api';

export class VstsApi {

    constructor(
        private configuration: IEnvironmentConfiguration
    ) { }

    /**
    * Create Build Api connection
    * @param teamFoundationUri Team Foundation server uri
    * @param accessToken OAuth token
    */
    public async getBuildApi(): Promise<BuildApi> {
        let connection = this.createConnection(this.configuration.teamFoundationUri, this.configuration.accessToken);
        return new BuildApi(await connection.getBuildApi());
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
