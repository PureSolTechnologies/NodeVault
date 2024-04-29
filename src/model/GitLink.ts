import { Exception } from "../Exception.js";

/**
 * This class represents a Git link for a dependency version.
 */
export class GitLink {

    reg = new RegExp("^(git|git\\+ssh|git\\+http|git\\+https|git\\+file)://(([^:]+)(:(.+))?@)?([^:]+)(:([0-9]+))?(:)?(/)?(/.+)$");

    readonly protocol: string;
    readonly user: string;
    readonly password: string;
    readonly hostname: string;
    readonly port: string;
    readonly path: string;

    constructor(readonly link: string) {
        const groups = this.reg.exec(link);
        if (!groups) {
            throw new Exception(`Invalid Git link '${link}' found!`);
        }
        this.protocol = groups[1];
        this.user = groups[3];
        this.password = groups[5];
        this.hostname = groups[6];
        this.port = groups[8];
        this.path = groups[11];
    }

    toString(): string {
        return this.path;
    }
}
