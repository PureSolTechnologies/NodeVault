import { Exception } from "../Exception.js";

/**
 * This class represents a GitHub link for a dependency version.
 */
export class GitHubLink {

    reg = /^(git(hub)?:)?(\S+\/\S+)$/;

    readonly path: string;

    constructor(readonly link: string) {
        const groups = this.reg.exec(link);
        if (!groups) {
            throw new Exception(`Invalid GitHub link '${link}' found!`);
        }
        this.path = groups[3];
    }

    toString(): string {
        return this.path;
    }
}
