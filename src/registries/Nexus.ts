import { GenericRegistry } from './GenericRegistry.js';

export class Nexus extends GenericRegistry {

    constructor(readonly nexusBaseUrl: string) {
        super(nexusBaseUrl);
    }

}
