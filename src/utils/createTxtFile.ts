import fs from "fs";
import { promises as fsp } from "fs";
import { v4 as uuidv4 } from "uuid";

export const createTxtFile = async (textFile: string) => {
  const filePath = `./${uuidv4().substring(0, 8)}_temp_file.txt`;

  await fsp.writeFile(filePath, textFile, "utf-8");

  const fileStream = fs.createReadStream(filePath);

  const onDeleteFileStream = async () => {
    await fsp.unlink(filePath);
  };

  return { fileStream, onDeleteFileStream };
};
