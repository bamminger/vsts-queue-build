import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';

export interface IBuildConfiguration {
    teamProject: string;
    path: string;
    buildName: string;
    configuration: Build;
    buildDefinitionId: number | null;
    buildIdOutputVariable: string | null;

    originalBuildName: string; // For debugging
}
