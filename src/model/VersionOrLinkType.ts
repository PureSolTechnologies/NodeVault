import { FileLink } from "./FileLink.js";
import { GitHubLink } from "./GitHubLink.js";
import { GitLink } from "./GitLink.js";
import { Package } from "./Package.js";
import { Version } from "./Version.js";

/**
 * Version of a dependency or a direct download link for a package.
 */
export type VersionOrLinkType = Version | GitHubLink | GitLink | FileLink | Package;
