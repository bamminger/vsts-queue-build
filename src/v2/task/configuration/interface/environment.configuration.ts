import { TeamProjectType } from "../../enum/team-project-type.enum";

export interface IEnvironmentConfiguration {
    teamFoundationUri: string;
    workDirectory: string;

    debug: boolean;
    accessToken: string;
    requestedFor: string;
    async: boolean;
    buildIdOutputVariable: string | null;
    teamProjectType: TeamProjectType;
}
