import { BuildConfiguration } from './build.configuration';
import { Build } from 'vso-node-api/interfaces/BuildInterfaces';

export class BuildConfigurationParser {

    private configurationInput: string = null;

    private globalConfiguration: Build = null;
    private buildSpecificConfiguration: { [buildName: string]: Build } = null;

    constructor() { }

    public fill(input: string): void {
        try {

            this.configurationInput = input;

            if (this.configurationInput == null
                || this.configurationInput.trim() == ''
                || this.configurationInput == 'undefined' // special case for missing input field
            ) {
                return;
            }

            let config = JSON.parse(this.configurationInput);

            // Is generic only
            if (Object.getOwnPropertyNames(config).length <= 3
                && (config["sourceBranch"] != null
                    || config["sourceVersion"] != null
                    || config["parameters"] != null)) {
                this.globalConfiguration = config;
                return;
            }

            // Is build specific
            if (config.default) {
                this.globalConfiguration = config.default;
                delete config["default"];
            }
            this.buildSpecificConfiguration = config;
        }
        catch (e) {
            throw new Error("Build configuration input: " + this.configurationInput
                + "Build configuration error: " + e.message);
        }
    }

    public getBuildConfiguration(config: BuildConfiguration): Build {
        if (this.buildSpecificConfiguration != null) {
            if (this.buildSpecificConfiguration[config.buildName]) {
                return this.buildSpecificConfiguration[config.buildName];

            } else if (this.buildSpecificConfiguration[config.originalBuildName]) {
                return this.buildSpecificConfiguration[config.originalBuildName];

            } else if (this.buildSpecificConfiguration[config.path + '\\' + config.buildName]) {
                return this.buildSpecificConfiguration[config.path + '\\' + config.buildName];
            }
        }

        if (this.globalConfiguration != null) {
            return this.globalConfiguration;
        }

        return;
    }

    public toString(): string {
        return `Input:  ${JSON.stringify(this.configurationInput)},
Global: ${JSON.stringify(this.globalConfiguration)},
Build specific:  ${JSON.stringify(this.buildSpecificConfiguration)}`;
    }
}