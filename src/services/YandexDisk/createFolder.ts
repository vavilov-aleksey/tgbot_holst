import { services } from "./yaDiskService";

export const createFolder = async (
  nameFolder: string,
): Promise<string | boolean> => {
  try {
    const response = await services.put(
      `v1/disk/resources?path=${nameFolder}&fields=path`,
    );
    if (response?.data?.href) {
      return response.data.href;
    }
    return false;
  } catch (e) {
    return false;
  }
};
