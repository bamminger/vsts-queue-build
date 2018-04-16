import { Build } from 'vso-node-api/interfaces/BuildInterfaces';
import { IBuildConfiguration } from './interface';

export class BuildConfiguration implements IBuildConfiguration {
    path: string;
    buildName: string;
    configuration: Build;
    buildDefinitionId: number | null;

    constructor(
        public originalBuildName: string,
        public teamProject: string | null
    ) {
        this.transformBuildName(originalBuildName);
    }

    /**
     * Separate build name and path
     * @param value Build name with path
     */
    private transformBuildName(value: string) {
        let pathIndex = value.lastIndexOf('\\');
        let path = '\\'; // default value;
        if (pathIndex >= 0) {
            path = value.substring(0, pathIndex);
            if (path.length == 0) { // Special case for leading \ without subfolder
                path = '\\';
            }
            else if (path[0] !== '\\') { // Make leading \ optional
                path = '\\' + path;
            }

            value = value.substring(pathIndex + 1, value.length); // Remove path from build name
        }

        this.buildName = value;
        this.path = path;
    }
}
