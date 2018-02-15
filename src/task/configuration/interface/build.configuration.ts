import { Build } from 'vso-node-api/interfaces/BuildInterfaces';

export interface IBuildConfiguration {
    teamProject: string;
    path: string;
    buildName: string;
    configuration: Build;

    originalBuildName: string; // For debugging
}
