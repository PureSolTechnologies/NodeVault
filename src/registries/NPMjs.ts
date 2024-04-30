import { GenericRegistry } from './GenericRegistry.js';

export class NPMjs extends GenericRegistry {

    static readonly remoteRegistryBaseUrl: string = "https://registry.npmjs.org";

    constructor() {
        super(NPMjs.remoteRegistryBaseUrl);
    }

}