import { Exception } from "../Exception.js";

/**
 * This class repesents a single version based on semantic versioning.
 * (https://semver.org/)
 */
export class Version {

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

    constructor(readonly major: number,
        readonly minor: number,
        readonly patch: number,
        readonly prerelease?: string,
        readonly buildMetaInfo?: string) {
        this.snapshot = prerelease?.toUpperCase() === "SNAPSHOT";
    }

    isSnapshot(): boolean {
        return this.snapshot;
    }

    isPreRelease(): boolean {
        return this.prerelease !== undefined;
    }

    toString(): string {
        return `${this.major}.${this.minor}.${this.patch}${this.prerelease ? "-" + this.prerelease : ""}${this.buildMetaInfo ? "+" + this.buildMetaInfo : ""}`;
    }

    equals(other: any | undefined): boolean {
        if (!(other instanceof Version)) {
            return false;
        }
        if (other) {
            return this.major === other.major
                && this.minor === other.minor
                && this.patch === other.patch
                && this.prerelease === other.prerelease
                && this.snapshot === other.snapshot;
        } else {
            return false;
        }
    }

    compare(other: Version | undefined): number {
        if (other) {
            if (this.equals(other)) {
                return 0;
            }
            if (this.major !== other.major) {
                return this.major < other.major ? -1 : 1;
            }
            if (this.minor !== other.minor) {
                return this.minor < other.minor ? -1 : 1;
            }
            if (this.patch !== other.patch) {
                return this.patch < other.patch ? -1 : 1;
            }
            if (this.prerelease) {
                if (!other.prerelease) {
                    return -1;
                }
                const prereleaseRelation = this.prerelease.localeCompare(other.prerelease);
                if (prereleaseRelation !== 0) {
                    return prereleaseRelation;
                }
            } else if (other.prerelease) {
                return 1;
            }
            if (this.snapshot !== other.snapshot) {
                return this.snapshot ? -1 : 1;
            }
            return 0;
        } else {
            return 1;
        }
    }
} 
