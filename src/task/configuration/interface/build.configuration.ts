import { Build } from 'vso-node-api/interfaces/BuildInterfaces';

export interface IBuildConfiguration {

    path: string;
    buildName: string;
    configuration: Build;
    originalBuildName: string;

}
