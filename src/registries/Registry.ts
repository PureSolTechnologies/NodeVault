import { PathLike } from "fs";

export interface Registry {

    download(url: string, target: PathLike): Promise<PathLike>;

    downloadProjectMetaInfo(projectName: string, target: PathLike): Promise<void>;

}
