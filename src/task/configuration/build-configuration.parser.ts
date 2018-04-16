import { Build } from 'vso-node-api/interfaces/BuildInterfaces';
import { BuildConfiguration } from './build.configuration';

export class BuildConfigurationParser {

    private configurationInput: string = null;

    private globalConfiguration: Build = null;
    private buildSpecificConfiguration: { [buildName: string]: Build } = null;

    public fill(input: string, configType: string): void {
        try {

            this.configurationInput = input;

            if (this.configurationInput == null
                || this.configurationInput.trim() == ''
                || this.configurationInput == 'undefined' // special case for missing input field
            ) {
                return;
            }

            let config: any = {};
            if (configType == 'singleBackslashJson') {

                // Find all properties and replace \ through \\
                let reg = new RegExp(/"([^"]*\\[^"]*)"/g);

                let groups;
                while ((groups = reg.exec(this.configurationInput)) != null) {
                    let value = groups[0];
                    // stringify string and replace \ to \\ + trim \" at the beginning
                    let groupVal = JSON.stringify(value).substring(2);

                    // remove \\"" at the end
                    groupVal = groupVal.substring(0, groupVal.length - 3) + '"';
                    this.configurationInput = this.configurationInput.replace(value, groupVal);
                }
            }

            config = JSON.parse(this.configurationInput);

            // Is generic only
            if (config["sourceBranch"] != null
                || config["sourceVersion"] != null
                || config["parameters"] != null
                || config["demands"] != null) {
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

    private findByKey(keys: string[], searchValue: string) {
        let key = keys.find(k => k === searchValue);
        if (key != null) {
            return key;
        }

        return keys.find(k => k.toLowerCase() === searchValue.toLowerCase());
    }

    public getBuildConfiguration(config: BuildConfiguration): Build {
        if (this.buildSpecificConfiguration != null) {
            let keys = Object.getOwnPropertyNames(this.buildSpecificConfiguration);
            let key = null;

            if ((key = this.findByKey(keys, config.buildName)) != null) {
                return this.buildSpecificConfiguration[key];

            } else if ((key = this.findByKey(keys, config.originalBuildName)) != null) {
                return this.buildSpecificConfiguration[key];

            } else if ((key = this.findByKey(keys, config.path + '\\' + config.buildName)) != null) {
                return this.buildSpecificConfiguration[key];
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