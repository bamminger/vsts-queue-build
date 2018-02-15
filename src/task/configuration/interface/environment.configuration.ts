export interface IEnvironmentConfiguration {

    debug: boolean;
    accessToken: string;
    teamProject: string;
    teamFoundationUri: string;
    requestedFor: string;
    workDirectory: string;

    async: boolean;

}
