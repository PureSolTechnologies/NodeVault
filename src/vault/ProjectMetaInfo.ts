/**
 * This interface defines the part of the project meta information which 
 * contains the version information for a specific version.
 */
export interface VersionInformation {
    name: string;
    version: string;
    bin: { [key: string]: string } | string | undefined,
    scripts: { [key: string]: string } | undefined,
    dependencies: { [key: string]: string } | undefined;
    devDependencies: { [key: string]: string } | undefined;
    peerDependencies: { [key: string]: string } | undefined;
    optionalDependencies: { [key: string]: string } | undefined;
}

/**
 * This interface defines the data which is returned by registries.
 */
export interface ProjectMetaInfo {
    _id: string;
    name: string;
    license: string;
    versions: { [key: string]: VersionInformation }
    time: { [key: string]: string }
}
