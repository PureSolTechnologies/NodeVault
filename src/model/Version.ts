import { SemVer } from "semver";
import { Exception } from "../Exception.js";

/**
 * This class repesents a single version based on semantic versioning.
 * (https://semver.org/)
 */
export class Version extends SemVer {

    /**
     * A single version numeral as defined in SemVer. It already includes a 
     * matcher group to retrieve the single numeral.
     */
    private static readonly numeral = "(0|[1-9][0-9]*)";

    /**
     * This string is containing a RegExp for semantic versions as defined in 
     * the specificiation. This string can be re-used by other implementations
     * like VersionRange.
     * 
     * Relevant groups inside this RegExp:
     * 
     * 1: major,
     * 3: minor,
     * 5: patch,
     * 6: prerelease string with leading'-',
     * 7: prerelease string without leading '-',
     * 8: build meta info with leading '+',
     * 9: build meta info without leading '+'
     */
    public static readonly versionRegExpString = `${Version.numeral}(\\.${Version.numeral}(\\.${Version.numeral})?)?(-([^+]+))?(\\+(.*))?`;

    private static readonly wildcardRegExp = new RegExp(`^${Version.versionRegExpString}$`);

    static of(version: string): Version {
        const match = Version.wildcardRegExp.exec(version);
        if (match == null) {
            throw new Exception(`Version '${version}' does not match specification.`);
        }
        return new Version(
            Number(match[1]),
            Number(match[3] ? match[3] : 0),
            Number(match[5] ? match[5] : 0),
            match[7],
            match[9]
        );
    }

    readonly snapshot: boolean;

    constructor(major: number,
        minor: number,
        patch: number,
        prerelease?: string,
        buildMetaInfo?: string) {
        super(`${major}.${minor}.${patch}${prerelease ? "-" + prerelease : ""}${buildMetaInfo ? "+" + buildMetaInfo : ""}`);
        this.snapshot = prerelease?.toUpperCase() === "SNAPSHOT";
    }

    public isSnapshot(): boolean {
        return this.snapshot;
    }

    public isPreRelease(): boolean {
        return this.prerelease !== undefined;
    }

    public equals(other: any | undefined): boolean {
        if (!(other instanceof Version)) {
            return false;
        }
        if (other) {
            return this.compare(other) == 0;
        } else {
            return false;
        }
    }

    public toString(): string {
        if (!this.build || this.build.length == 0) {
            return super.toString();
        } else {
            let build = "";
            this.build.forEach((v, i, a) => build += (i > 0 ? "." : "") + v);
            return super.toString() + "+" + build;
        }
    }

    public compare(other: string | SemVer | undefined): 0 | 1 | -1 {
        if (!other) {
            return 1;
        }
        return super.compare(other);
    }
} 
