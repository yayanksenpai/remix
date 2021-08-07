import { join } from "path";
import { createHash } from "crypto";
import { existsSync, mkdirSync, createReadStream, createWriteStream } from "fs";
import { videoInfo } from "ytdl-core";
import ytdl from "ytdl-core-telegram";
import { User } from "@grammyjs/types";
import env from "../../env";
import { stream } from "./base";

if (env.CACHE && !existsSync(env.CACHE_DIR)) {
    mkdirSync(env.CACHE_DIR);
}

const cache = (info: videoInfo) => {
    const currentCache = getCache(info.videoDetails.videoId);

    if (currentCache) {
        return currentCache;
    }

    const isLive = info.videoDetails.isLiveContent;
    const dur = Number(info.videoDetails.lengthSeconds);
    const toReturn = ytdl.downloadFromInfo(info);

    if (!isLive && dur && dur <= env.CACHE_DUR) {
        toReturn.pipe(
            createWriteStream(getCachePath(info.videoDetails.videoId)),
        );
    }

    return toReturn;
};

const getCache = (identifier: string) => {
    const filePath = getCachePath(identifier);

    if (existsSync(filePath)) {
        return createReadStream(filePath);
    }
};

const getCachePath = (identifier: string) => {
    const fileName = createHash("md5")
        .update(identifier)
        .digest("hex")
        .toString();
    const filePath = join(env.CACHE_DIR, fileName);

    return filePath;
};

export default async (
    chatId: number,
    requester: User,
    id: string,
    title?: string,
    url?: string,
) => {
    let info: videoInfo;

    if (!title || !url) {
        info = await ytdl.getInfo(id);
        title = info.videoDetails.title;
        url = info.videoDetails.video_url;
    }

    return await stream(chatId, {
        url,
        title,
        requester,
        getReadable: async () => {
            if (info) {
                return cache(info);
            }

            return cache(await ytdl.getInfo(id));
        },
    });
};
