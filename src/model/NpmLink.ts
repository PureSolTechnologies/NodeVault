import { Exception } from "../Exception.js";
import { VersionRange } from "./VersionRange.js";

export class NpmLink {

    reg = /^npm:(@?.+)@([^@]+)$/;

    readonly packageName: string;
    readonly versionRange: VersionRange;

    constructor(readonly link: string) {
        const groups = this.reg.exec(link);
        if (!groups) {
            throw new Exception(`Invalid NPM link '${link}' found!`);
        }
        this.packageName = groups[1];
        this.versionRange = new VersionRange(groups[2]);
    }

    toString(): string {
        return "npm:" + this.packageName + "@" + this.versionRange.toString();
    }
}
