import { services } from "./yaDiskService";
import { isImageFile } from "../../utils";

type PublicResourceFileType = {
  name: string;
  path: string;
  mime_type?: string;
};

type PublicResourceItem = {
  type: "file" | "dir";
  name: string;
  path?: string;
  mime_type?: string;
};

const mapResourceItem = (item: PublicResourceItem): PublicResourceFileType => ({
  name: item.name,
  path: item.path ?? `/${item.name}`,
  mime_type: item.mime_type,
});

export const getPublicResourceFiles = async (
  publicUrl: string,
): Promise<{
  count?: number;
  error?: boolean;
  files?: PublicResourceFileType[];
}> => {
  try {
    const response = await services.get("v1/disk/public/resources", {
      params: {
        //@ts-ignore
        public_key: decodeURI(publicUrl),
        limit: 2500,
      },
    });

    const resource = response.data;

    //Если это папка, то смотрим количество файлов в ней
    if (resource.type === "dir") {
      // собираем только фото, без папок
      const files: PublicResourceFileType[] = resource._embedded.items
        .filter((item: PublicResourceItem) => item.type === "file")
        .filter((item: PublicResourceItem) =>
          isImageFile(item.name, item.mime_type),
        )
        .map(mapResourceItem);

      return { count: files.length, files };
    } else if (resource.type === "file") {
      // Если это файл, то возвращаем 1
      return { count: 1 };
    }

    return { count: 0 };
  } catch (error) {
    return { error: true };
  }
};
