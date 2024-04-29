import { Exception } from "../Exception.js";

/**
 * This class represents a simple file link. This is the relative or absulte 
 * path given instead of a version.
 */
export class FileLink {

    private readonly reg = new RegExp("^(file:)?(.+)$");

    readonly protocol: string;
    readonly path: string;

    constructor(readonly link: string) {
        const groups = this.reg.exec(link);
        if (!groups) {
            throw new Exception(`Invalid Git link '${link}' found!`);
        }
        this.protocol = groups[1];
        this.path = groups[2];
    }

    toString(): string {
        return this.path;
    }
}
