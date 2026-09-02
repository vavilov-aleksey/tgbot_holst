import { services, yaDiskService } from "./yaDiskService";
import { TBotContext } from "../../app/types";
import { useSessionInfo } from "../../hooks";
import { uploadPublicImagesToDisk } from "./uploadImageToDisk";
import { getPublicResourceFiles } from "./getCountPhotoFromResource";

const getPublicResourceDownloadHref = async (
  publicKey: string,
  filePath?: string,
): Promise<string | null> => {
  try {
    const response = await services.get("v1/disk/public/resources/download", {
      params: {
        public_key: decodeURI(publicKey),
        ...(filePath ? { path: filePath } : {}),
      },
    });

    return response.data.href ?? null;
  } catch (e) {
    console.error("Error getPublicResourceDownloadHref", e);
    return null;
  }
};

export const saveInDownloads = async (ctx: TBotContext, folderName: string) => {
  const { getPhotoInfo } = useSessionInfo(ctx);
  const pathDisk = getPhotoInfo()?.pathDisk;

  if (pathDisk) {
    try {
      const publicFiles = await getPublicResourceFiles(pathDisk);

      const files = publicFiles?.files ?? [];

      const { getUrlForUpload } = yaDiskService();

      await uploadPublicImagesToDisk({
        publicKey: pathDisk,
        files,
        targetFolder: folderName,
        getUrlForUpload,
        getDownloadHref: getPublicResourceDownloadHref,
      });
    } catch (e) {
      console.error(
        "Error saveInDownloads",
        // @ts-ignore
        e?.data,
        // @ts-ignore
        e?.response?.status,
        e,
      );
    }
  }
};
