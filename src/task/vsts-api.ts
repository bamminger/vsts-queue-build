import { WebApi, getPersonalAccessTokenHandler } from 'vso-node-api/WebApi';
import { IBuildApi } from 'vso-node-api/BuildApi';
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
    public getBuildApi(): BuildApi {
        let connection = this.createConnection(this.configuration.teamFoundationUri, this.configuration.accessToken);
        return new BuildApi(connection.getBuildApi());
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
