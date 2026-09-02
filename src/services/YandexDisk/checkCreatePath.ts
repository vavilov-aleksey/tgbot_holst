import { services } from "./yaDiskService";

const FIELDS =
  "_embedded.items.type,_embedded.items.name,_embedded.items.path,_embedded.total";
const LIMIT = 1000;

export const checkCreatePath = async <T>(
  nameFolder: string,
  fields = FIELDS,
): Promise<T> => {
  try {
    const res = await services.get(
      `v1/disk/resources?path=${nameFolder}&limit=${LIMIT}&fields=${fields}`,
    );
    return res?.data;
  } catch (e) {
    return false as T;
  }
};
