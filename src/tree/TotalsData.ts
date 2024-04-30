
/**
 * This interface is used to collect some totals per dependency. Especially the
 * counts are needed to find the root entries in node_modules folder.
 */
export interface TotalsData {
    packageName: string,
    packageVersion: string,
    count: number;
}
