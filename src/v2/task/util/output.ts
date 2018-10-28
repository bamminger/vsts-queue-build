import { getVariable, getInput } from 'azure-pipelines-task-lib/task';
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

// Saving updates is necessary to remember previous changes within the current task
// VSTS is not updating the variable immediately after the console.log output.
var outputVariableCache = new Map();
export function updateOutputVariable(variableName: string, value: string | number | null) {
    if (variableName != null && variableName != '') {
        if (!outputVariableCache.has(variableName)) {
            outputVariableCache.set(variableName, getInput(variableName, false))
        }

        let existingValue = outputVariableCache.get(variableName);
        if (existingValue != null && existingValue != '') {
            value = existingValue + ',' + value;
        }

        outputVariableCache.set(variableName, value.toString());
        console.log(`##vso[task.setvariable variable=${variableName};]${value}`);
    }
}