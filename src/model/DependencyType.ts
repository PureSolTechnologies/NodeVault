/**
 * This enum is used to specify the type of a depdendency as given in package.json.
 */
export enum DependencyType {
    PROD = "dependencies",
    DEV = "devDependencies",
    PEER = "peerDependencies",
    OPTIONAL = "optionalDependencies"
}
