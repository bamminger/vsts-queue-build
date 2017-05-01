import { getVariable, getEndpointAuthorization, getBoolInput } from 'vsts-task-lib/task';
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
        if (getBoolInput('requestedFor', false)) {
            return getVariable('build.requestedForId');
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
        let auth = getEndpointAuthorization('SYSTEMVSSCONNECTION', true);
        if (auth == null) {
            return getVariable("queue_accesstoken"); // Special case for test szenario
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
