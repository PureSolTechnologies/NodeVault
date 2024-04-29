import { Version } from "./Version.js";
import { VersionOrLinkType } from "./VersionOrLinkType.js";

/**
 * This class represents a single package with its name and version.
 */
export class Package {

    constructor(readonly name: string, readonly version: VersionOrLinkType) { }

    public equals(other: any | undefined): boolean {
        if (!(other instanceof Package)) {
            return false;
        }
        return this.name === other.name
            && this.version.toString() === other.version.toString();
    }

    public toString(): string {
        if (this.version instanceof Version) {
            return `${this.name}@${this.version.toString()}`;
        } else {
            return `${this.name}@${this.version.toString()}`;
        }
    }

    public isSnapshot(): boolean {
        if (this.version instanceof Version) {
            return this.version.isSnapshot();
        } else if (this.version instanceof Package) {
            return this.version.isSnapshot();
        } else {
            return false;
        }
    }
}