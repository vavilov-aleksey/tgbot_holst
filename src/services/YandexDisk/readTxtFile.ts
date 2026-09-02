import axios from "axios";
import { services } from "./yaDiskService";

export type ReadTxtFileResult =
  | { ok: true; content: string }
  | { ok: false; reason: "not_found" | "error" };

export const readTxtFile = async (
  filePath: string,
): Promise<ReadTxtFileResult> => {
  try {
    const params = new URLSearchParams({ path: filePath });
    const downloadInfo = await services.get(
      `v1/disk/resources/download?${params.toString()}`,
    );

    const href: string | undefined = downloadInfo?.data?.href;
    if (!href) {
      return { ok: false, reason: "error" };
    }

    const fileRes = await axios.get<string>(href, {
      responseType: "text",
      transformResponse: [(d) => d],
    });

    return { ok: true, content: String(fileRes.data ?? "") };
  } catch (e) {
    // @ts-ignore
    const status: number | undefined = e?.response?.status;
    if (status === 404) {
      return { ok: false, reason: "not_found" };
    }
    return { ok: false, reason: "error" };
  }
};
