import { services } from "./yaDiskService";

export const getUrlForUpload = async (path: string) => {
  try {
    const response = await services.get(
      `v1/disk/resources/upload?path=${path}&overwrite=true`,
    );

    return response.data.href;
  } catch (e) {
    console.error(
      "Не удалось получить ссылку для загрузки на яндекс диск",
      // @ts-ignore
      e?.response?.data,
    );
    return null;
  }
};
