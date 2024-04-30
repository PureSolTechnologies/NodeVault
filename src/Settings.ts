import { Registry } from "./registries/Registry.js";

/**
 * This class represents the Settings of NoVa to be used during runtime.
 */
export interface Settings {

    registries?: Registry[];

}