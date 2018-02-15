import { getInput, getVariable, getDelimitedInput, getEndpointAuthorization, getBoolInput } from 'vsts-task-lib/task';
import { IBuildConfiguration, IEnvironmentConfiguration } from './interface';
import { TeamProjectType } from '../enum/team-project-type.enum';
import { BuildConfiguration } from './build.configuration';
import { BuildConfigurationParser } from './build-configuration.parser';

export class EnvironmentConfiguration implements IEnvironmentConfiguration {
    public teamFoundationUri: string;
    public workDirectory: string;

    public debug: boolean;
    public accessToken: string;
    public requestedFor: string | null;
    public async: boolean;
    public buildConfigurations: IBuildConfiguration[];

    public teamProjectType: TeamProjectType;
    private teamProject: string;

    constructor() {
        this.teamFoundationUri = this.getTeamFoundationUri();
        this.workDirectory = this.getWorkDirectory();

        this.debug = this.getDebug();
        this.accessToken = this.getAccessToken();
        this.requestedFor = this.getRequestedFor();
        this.async = this.getAsync();

        // Team project must be set before the configuration is parsed
        this.setTeamProject();

        this.buildConfigurations = this.getBuildConfigurations();
    }

    /**
     * Set team project & type depending on user input
     */
    private setTeamProject() {
        let configType = getInput('teamProjectType', true);
        switch (configType) {
            case "defined":
                this.teamProject = getInput('teamProject', true);
                this.teamProjectType = TeamProjectType.Defined;
                break;
            case "configuration":
                this.teamProject = null;
                this.teamProjectType = TeamProjectType.JsonConfiguration;
                break;
            default:
                this.teamProject = this.getTeamProject();
                this.teamProjectType = TeamProjectType.Current;
                break;
        }

        if (this.debug) {
            console.log(`Team project type: ${this.teamProjectType}`);
            console.log(`Team project: ${this.teamProject}`);
        }
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

    /**
     * Get build/release specific work directory
     */
    private getWorkDirectory() {
        let taskWorkDirectory = getVariable("Agent.BuildDirectory");
        if (taskWorkDirectory == null) {
            taskWorkDirectory = getVariable("Agent.ReleaseDirectory");
            if (taskWorkDirectory == null) {
                return null;
            }
        }
        return taskWorkDirectory;
    }

    /** 
     * Parse & convert json configuration for the builds
     */
    public getBuildConfigurations(): IBuildConfiguration[] {

        // Process build configuration
        let buildConfigurationInput = getInput('buildConfiguration', false);
        if (this.debug) {
            console.log(`Build configuration ${buildConfigurationInput}`);
        }

        let configType = getInput('buildConfigurationType', true);

        let configParser = new BuildConfigurationParser();
        configParser.fill(buildConfigurationInput, configType);
        if (this.debug) {
            console.log(`Build configuration parsed: ${configParser.toString()}`);
        }

        // Process build definition names
        let buildsToStart = getDelimitedInput('buildDefinitionName', '\n', true);
        if (this.debug) {
            console.log(`Build(s) to start (plain) ${getInput('buildDefinitionName', true)}`);
        }

        let buildConfigurations = new Array<IBuildConfiguration>();
        for (let i = 0; i < buildsToStart.length; i++) {
            let buildName = buildsToStart[i];

            // if build definition which start with "#", we will igrone it
            if (!buildName.startsWith("#")) {
                let buildConfig = new BuildConfiguration(buildName, this.teamProject);
                buildConfig.configuration = configParser.getBuildConfiguration(buildConfig);

                if (this.teamProjectType === TeamProjectType.JsonConfiguration) {
                    buildConfig.teamProject = buildConfig.configuration['teamProject'];
                    delete buildConfig.configuration['teamProject'];
                }

                if (buildConfig.teamProject == null || buildConfig.teamProject.trim() === '') {
                    throw new Error("Missing team project configuration. Team project type: " + this.teamProjectType
                        + ", Build name: " + buildConfig.originalBuildName
                        + ", Build configuration: " + buildConfig.configuration);
                }

                buildConfigurations.push(buildConfig);
            }
        }

        return buildConfigurations;
    }
}
