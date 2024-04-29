import { DependencyType } from "./DependencyType.js";
import { VersionRange } from "./VersionRange.js";
import { VersionRangeOrLinkType } from "./VersionRangeOrLinkType.js";

/**
 * This class is used to represent a single dependency as it is provided by the package.jon.
 */
export class Dependency {

    constructor(
        readonly type: DependencyType,
        readonly name: string,
        readonly versionRange: VersionRangeOrLinkType) { }

    toString(): string {
        if (this.versionRange instanceof VersionRange) {
            return this.name + "@" + this.versionRange.version + "(" + this.type + ")";
        } else {
            return this.name + " -> " + this.versionRange.link + "(" + this.type + ")";
        }
    }

    public equals(other: any | undefined) {
        if (!(other instanceof Dependency)) {
            return false;
        }
        return this.type === other.type
            && this.name === other.name
            && this.versionRange.toString() === other.versionRange.toString();
    }
}