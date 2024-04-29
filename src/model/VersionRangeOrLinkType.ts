import { FileLink } from "./FileLink.js";
import { GitHubLink } from "./GitHubLink.js";
import { GitLink } from "./GitLink.js";
import { NpmLink } from "./NpmLink.js";
import { VersionRange } from "./VersionRange.js";

/**
 * This type is used for dependencies to define the version range or links 
 * like NPM or GitHub.
 */
export type VersionRangeOrLinkType = VersionRange | GitHubLink | GitLink | FileLink | NpmLink;
