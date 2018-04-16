import { TeamProjectType } from "../enum/team-project-type.enum";
import { IEnvironmentConfiguration, IBuildConfiguration } from "../configuration";

export function getTeamProjectOutput(
    environmentConfiguration: IEnvironmentConfiguration,
    buildConfiguration: IBuildConfiguration,
    prefixWhitespace: boolean,
    postfixWhitespace: boolean
) {
    if (environmentConfiguration.teamProjectType == TeamProjectType.JsonConfiguration) {
        return (prefixWhitespace ? ' ' : '')
            + `(Team project: ${buildConfiguration.teamProject})`
            + (postfixWhitespace ? ' ' : '');
    }
    return '';
}