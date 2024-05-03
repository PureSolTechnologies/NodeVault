import { PathLike } from "fs";

/**
 * This interface specifies a single registry. This is the minimum
 * implenmentation for any registry implementation.
 */
export interface Registry {

    /**
     * This method is used the tarball under the given URL. The URL shoud be
     * taken from the meta information retrieved by 
     * #downloadProjectMetaInfo(...)
     * 
     * @param url is the URL to get the tarball from.
     * @param target is the target path to download the tarball to. 
     * @returns The promise returns the path of the downloaded tarball in case
     * of success.
     */
    download(url: URL, target: PathLike): Promise<PathLike>;

    /**
     * This method downloads the meta information for a given project in the 
     * registry.
     * 
     * @param projectName is the name of the project to retrieve the meta 
     * information from.
     * @param target is the file to write the meta information to.
     */
    downloadProjectMetaInfo(projectName: string, target: PathLike): Promise<void>;

}
