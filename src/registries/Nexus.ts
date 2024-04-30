import { GenericRegistry } from './GenericRegistry.js';

export class Nexus extends GenericRegistry {

    static readonly remoteRegistryBaseUrl: string = "http://nexus.ad.senorics.net/repository/npm";

    constructor() {
        super(Nexus.remoteRegistryBaseUrl);
    }

}
