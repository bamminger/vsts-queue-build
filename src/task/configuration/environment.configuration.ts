import { getInput, getVariable, getEndpointAuthorization, getBoolInput } from 'vsts-task-lib/task';
import { IEnvironmentConfiguration } from './interface';

export class EnvironmentConfiguration implements IEnvironmentConfiguration {

    debug: boolean;
    accessToken: string;
    teamProject: string;
    teamFoundationUri: string;
    requestedFor: string | null;

    async: boolean;

    constructor() {
        this.debug = this.getDebug();
        this.accessToken = this.getAccessToken();
        this.teamProject = this.getTeamProject();
        this.teamFoundationUri = this.getTeamFoundationUri();
        this.requestedFor = this.getRequestedFor();

        this.async = this.getAsync();
    }

    /**
     * Get async flag
     */
    private getAsync(): boolean {
        return getBoolInput('async', false);
    }

    /**
     * Get requestedFor
     */
    private getRequestedFor(): string {
        if (getBoolInput('requestedFor', false) == true) {
            // Check release variable first, because in a build definition it is not defined
            // The build variable is definied within a release (requested for of the build artifact) and build queue.
            let requestedForId = getVariable('release.requestedForId');
            if (requestedForId == null || requestedForId == '') {
                return getVariable('build.requestedForId');
            }
            return requestedForId;
        }
        return null;
    }

    /**
     * Get debug information
     */
    private getDebug(): boolean {
        return getBoolInput('debug', true);
    }

    /**
     * Get auth token from environment variables
     */
    private getAccessToken(): string {
        let customAuthToken = getInput('authToken', false);

        if (customAuthToken != null && customAuthToken.trim() != '') {
            return customAuthToken;
        }

        let auth = getEndpointAuthorization('SYSTEMVSSCONNECTION', true);
        if (auth == null) {
            return getVariable("system.accessToken");
        }
        return auth.parameters['AccessToken'];
    }

    /**
     * Get current team project
     */
    private getTeamProject(): string {
        return getVariable('system.teamProject');
    }

    /**
     * Get team foundation server uri
     */
    private getTeamFoundationUri(): string {
        return getVariable('system.teamFoundationCollectionUri');
    }
}
