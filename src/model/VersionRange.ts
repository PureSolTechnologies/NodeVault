import { Exception } from "../Exception.js";
import { Version } from "./Version.js";

export class Range {

    constructor(readonly min: Version | undefined, readonly minIncluded: boolean, readonly max: Version | undefined, readonly maxIncluded: boolean) { }

    contains(version: Version): boolean {
        if (this.min) {
            const minCompare = this.min.compare(version);
            if (minCompare > 0) {
                return false;
            } else if (minCompare === 0 && !this.minIncluded) {
                return false;
            }
        }
        if (this.max) {
            const maxCompare = this.max.compare(version);
            if (maxCompare < 0) {
                return false;
            } else if (maxCompare === 0 && !this.maxIncluded) {
                return false;
            }
        }
        return true;
    }
}

/**
 * This class holds version range information as defined in 
 * https://docs.npmjs.com/cli/v10/configuring-npm/package-json#dependencies
 */
export class VersionRange {

    /**
     * RegExpto match prefix syntax. These are semver versions with an 
     * optional prefix.
     */
    private static readonly prefixRegExp = new RegExp(`^([=~^])?(${Version.versionRegExpString})$`);

    /**
     * Syntax with wildcard 'x' like '1.2.x'.
     * 
     * The asterik '*' and the optional prefixes were added to liberally read 
     * versions not following the official specifications.
     */
    private static readonly wildcardRegExp = new RegExp("^[>=^]*?\\s*([0-9]+)\.([0-9x*]+)(\.(x*))?$");

    /**
     * Range syntax with hyphen '-' like '1.0.0 - 1.2.0'.  
     */
    private static readonly dashRegExp = new RegExp(`^${Version.versionRegExpString}\\s+-\\s+${Version.versionRegExpString}$`);

    /**
     * Range syntax with relational characters like '>=1.0.0 <1.2.0'.  
     */
    private static readonly relationRegExp = new RegExp(`^((>=?)\\s*${Version.versionRegExpString})?\\s*((<=?)\\s*${Version.versionRegExpString})?$`);

    /**
     * For ranges with multiple parts, this field contains a list of all single ranges identified during parsing.
     */
    readonly ranges: Range[] = [];

    /**
     * Constructor for this class. It also starts the parsing.
     * @param version is a version range string as taken from package.json 
     * dependencies.
     */
    constructor(readonly version: string) {
        if (version === "*" || version === "") {
            // Handle trivial cases for 'any'.
            this.ranges.push(new Range(undefined, false, undefined, false));
        } else if (version === "latest") {
            /* Handle trivial cases for 'latest'. It is here interpreted as 
             * 'any', too. As the installer will search for the latest version
             * of a package.
             */
            this.ranges.push(new Range(new Version(0, 0, 0), true, undefined, false));
        } else if (version === "next") {
            /* 
             * Workaround for now. It is a NPM tag found as version, but 
             * currently unclear how to handle it. We use here the 'latest'
             * approach.
             */
            this.ranges.push(new Range(new Version(0, 0, 0), true, undefined, false));
        } else {
            // Parse numerical version ranges.
            this.parseVersionRanges();
        }
    }

    public containsPreRelease(): boolean {
        for (let range of this.ranges) {
            if (range.min?.isPreRelease() || range.max?.isPreRelease()) {
                return true;
            }
        }
        return false;
    }

    public containsSnapshot(): boolean {
        for (let range of this.ranges) {
            if (range.min?.isSnapshot() || range.max?.isSnapshot()) {
                return true;
            }
        }
        return false;
    }

    /**
     * This method splits the version range on '||' and triggeres a separate
     * handling of the single ranges.
     */
    private parseVersionRanges() {
        // Cut for multiple version ranges and trim them for better parsing
        const ranges = this.version.split("||").map(e => e.trim());
        for (let range of ranges) {
            this.parseVersionRange(range);
        }
    }

    private parseVersionRange(range: string) {
        /* 
         * Next we probe for the different syntax versions for numerical 
         * ranges. We start with the most specific one to not mis-interpret.
         */
        if (VersionRange.wildcardRegExp.test(range)) {
            this.parseWildcardSyntax(range);
        } else if (VersionRange.relationRegExp.test(range)) {
            this.parseRelationSyntax(range);
        } else if (VersionRange.dashRegExp.test(range)) {
            this.parseDashSyntax(range);
        } else {
            this.parsePrefixSyntax(range);
        }
    }

    private parseWildcardSyntax(range: string): void {
        const match = VersionRange.wildcardRegExp.exec(range);
        if (match == null) {
            throw new Exception(`Wildcard version '${range}' does not match specification.`);
        }
        const major = Number(match[1])
        const minor = Number(match[2] ? (match[2] === "x" || match[2] === "*" ? 0 : match[2]) : 0);
        const prerelease = match[6];
        if ((match[2] === 'x') || (match[2] === '*')) {
            if (match[4] && match[4] !== 'x' && match[4] !== '*') {
                throw new Exception(`Wildcard version '${range}' does not match specification. If minor has a wildcard, patch needs, too.`);
            }
            this.ranges.push(new Range(
                new Version(major, 0, 0, prerelease),
                true,
                new Version(major, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, prerelease),
                false
            ));
        } else if ((match[4] === 'x') || (match[4] === '*')) {
            this.ranges.push(new Range(
                new Version(major, minor, 0, prerelease),
                true,
                new Version(major, minor, Number.MAX_SAFE_INTEGER, prerelease),
                false
            ));
        } else if ((match[2] !== 'x') && (match[2] !== '*') && (!match[4])) {
            this.ranges.push(new Range(
                new Version(major, minor, 0, prerelease),
                true,
                new Version(major, minor, Number.MAX_SAFE_INTEGER, prerelease),
                false
            ));
        } else {
            throw new Exception(`Wildcard version '${range}' does not match specification.`);
        }
    }

    private parseDashSyntax(range: string): void {
        const versions = range.split("-").map(r => r.trim());
        if (versions.length !== 2) {
            throw new Exception(`Dash version '${range}' does not match specification.`);
        }
        this.ranges.push(new Range(
            Version.of(versions[0]),
            true,
            Version.of(versions[1]),
            true
        ));
    }

    private parseRelationSyntax(range: string): void {
        const match = VersionRange.relationRegExp.exec(range);
        if (match == null) {
            throw new Exception(`Relation version '${range}' does not match specification.`);
        }
        const leftVersion = match[1] ? new Version(Number(match[3]), Number(match[5] ? match[5] : 0), Number(match[7] ? match[7] : 0)) : undefined;
        const rightVersion = match[13] ? new Version(Number(match[14]), Number(match[16] ? match[16] : 0), Number(match[18] ? match[18] : 0)) : undefined;

        this.ranges.push(new Range(
            leftVersion,
            match[2] ? match[2].search("=") >= 0 : false,
            rightVersion,
            match[13] ? match[13].search("=") >= 0 : false
        ));
    }

    private parsePrefixSyntax(range: string): void {
        // Cut for multiple version ranges and trim them for better parsing
        const match = VersionRange.prefixRegExp.exec(range);
        if (match == null) {
            throw new Exception(`Prefix version '${range}' does not match specification.`);
        }
        const type: string = match[1];
        const baseVersion: Version = new Version(Number(match[3]), Number(match[5] ? match[5] : 0), Number(match[7] ? match[7] : 0), match[9]);
        switch (type) {
            case '~':
                this.ranges.push(new Range(baseVersion, true, new Version(baseVersion.major, baseVersion.minor, Number.MAX_SAFE_INTEGER), false));
                break;
            case '^':
                this.ranges.push(new Range(baseVersion, true, new Version(baseVersion.major, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), false));
                break;
            case '':
            case '=':
            case undefined:
                if (!match[5]) {
                    this.ranges.push(new Range(baseVersion, true, new Version(baseVersion.major, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), false));
                } else if (!match[7]) {
                    this.ranges.push(new Range(baseVersion, true, new Version(baseVersion.major, baseVersion.minor, Number.MAX_SAFE_INTEGER), false));
                } else {
                    this.ranges.push(new Range(baseVersion, true, baseVersion, true));
                }
                break;
            default:
                throw new Exception(`Prefix version type '${type}' does not match specification.`);
        }
    }

    toString(): string {
        return this.version;
    }

    contains(other: Version): boolean {
        for (let range of this.ranges) {
            if (range.contains(other)) {
                return true;
            }
        }
        return false;
    }
}
