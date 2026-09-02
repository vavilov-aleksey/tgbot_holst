import { Scenes } from "telegraf";
import { SCENE_ADMIN_CHECK_FOLDER } from "../../../app/constants/constants.scene";
import { yaDiskService } from "../../../services/YandexDisk";
import { getNameFolderYandexDisk } from "../../../features/getNameFolderYandexDisk";
import { TBotContext } from "../../../app/types";
import { sceneReset } from "../../commands/sceneReset";
import { createInlineKeyboard } from "../../../utils";
import { ADMIN_CHECK_FOLDER_ROUTE } from "../../../configs/routes";

type TYandexItem = {
  type: "dir" | "file";
  name: string;
  path: string;
};

type TYandexResource = {
  _embedded?: {
    items?: TYandexItem[];
    total?: number;
  };
};

const FIELDS_TOTAL_ONLY = "_embedded.total";
const USER_INFO_FILE_NAME = "яяяuserInfo.txt";
// В каждой папке заказа лежат служебные файлы, которые не нужно учитывать
// при сравнении с "Количество фото" из userInfo (например, сам userInfo.txt).
const SERVICE_FILES_COUNT = 2;

// Префикс "disk:" приходит в поле path у ресурсов Яндекс.Диска, но в query-параметр
// нужно передавать абсолютный путь без него.
const stripDiskPrefix = (path: string) => path.replace(/^disk:/, "");

const parsePhotosCountFromUserInfo = (content: string): number | null => {
  const match = content.match(/Количество фото:\s*(\d+)/);
  if (!match) return null;
  return Number(match[1]);
};

// Приводим 8XXXXXXXXXX / 7XXXXXXXXXX / 7 953 405-90-61 к виду 7XXXXXXXXXX
const normalizePhoneDigits = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, "");
  if (
    digits.length === 11 &&
    (digits.startsWith("8") || digits.startsWith("7"))
  ) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `7${digits}`;
  }
  return null;
};

const parsePhoneFromFolderName = (folderName: string): string | null => {
  // Пример: "7 953 405-90-61 9p (Оплачен TG_BOT)" / "... рам (Оплачен TG_BOT)"
  const match = folderName.match(/^(\d)\s(\d{3})\s(\d{3})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return normalizePhoneDigits(match.slice(1).join(""));
};

const parsePhoneFromUserInfo = (content: string): string | null => {
  const match = content.match(/Телефон:\s*(\S+)/);
  if (!match) return null;
  return normalizePhoneDigits(match[1]);
};

type TFolderStat = {
  name: string;
  uploadedCount: number;
  expectedCount: number | null;
  userInfoStatus: "ok" | "not_found" | "parse_error" | "error";
  phoneStatus: "ok" | "mismatch" | "parse_error" | "skipped";
  folderError: boolean;
};

const formatLine = (f: TFolderStat) => {
  if (f.folderError) {
    return `📁 ${f.name}: ошибка получения данных`;
  }

  const left = `📁 ${f.name}: ${f.uploadedCount} файлов`;
  let photosPart: string | undefined;

  if (f.userInfoStatus === "not_found") {
    photosPart = `${left} / userInfo не найден ❓`;
  } else if (f.userInfoStatus === "parse_error") {
    photosPart = `${left} / userInfo не распарсен ❓`;
  } else if (f.userInfoStatus === "error") {
    photosPart = `${left} / userInfo ошибка чтения ❓`;
  } else if (f.uploadedCount !== f.expectedCount) {
    const expected = f.expectedCount as number;
    const diff = ` (расхождение ${Math.abs(f.uploadedCount - expected)})`;
    photosPart = `${left} из ${expected} ⚠️${diff}`;
  }

  let phonePart: string | undefined;
  if (f.phoneStatus === "mismatch") {
    phonePart = "телефон не совпадает ❗️";
  } else if (f.phoneStatus === "parse_error") {
    phonePart = "телефон не распарсен ❓";
  }

  if (!photosPart && !phonePart) return;
  if (photosPart && phonePart) return `${photosPart} / ${phonePart}`;
  if (photosPart) return photosPart;
  return `📁 ${f.name}: ${phonePart}`;
};

const checkFolders = async (ctx: TBotContext, dateStr: string) => {
  const { checkCreatePath, readTxtFile } = yaDiskService();
  const { getNameFolderByDate } = getNameFolderYandexDisk(ctx);

  const nameFolder = getNameFolderByDate(dateStr);

  const messageLoading = await ctx.replyWithHTML(
    `⏳ Проверяем папку ${nameFolder}, ожидайте...`,
  );

  try {
    const resultCheck = await checkCreatePath<TYandexResource>(nameFolder);

    const listFolder = resultCheck?._embedded?.items;

    if (!listFolder?.length) {
      await ctx.reply(
        "Папка пуста или не найдена",
        createInlineKeyboard([
          {
            label: "📅 Проверить новую дату",
            action: ADMIN_CHECK_FOLDER_ROUTE,
          },
        ]),
      );
      return;
    }

    const folderState: TFolderStat[] = [];

    if (listFolder?.length) {
      for (const folder of listFolder) {
        const path = stripDiskPrefix(folder.path);

        const resultFolder = await checkCreatePath<TYandexResource>(
          path,
          FIELDS_TOTAL_ONLY,
        );

        if (!resultFolder || typeof resultFolder === "boolean") {
          folderState.push({
            name: folder.name,
            uploadedCount: 0,
            expectedCount: null,
            userInfoStatus: "error",
            phoneStatus: "skipped",
            folderError: true,
          });
          continue;
        }

        const totalInFolder = resultFolder._embedded?.total ?? 0;
        const uploadedCount = Math.max(0, totalInFolder - SERVICE_FILES_COUNT);

        const userInfoPath = `${path}/${USER_INFO_FILE_NAME}`;
        const userInfoRes = await readTxtFile(userInfoPath);

        let expectedCount: number | null = null;
        let userInfoStatus: TFolderStat["userInfoStatus"] = "ok";
        let phoneStatus: TFolderStat["phoneStatus"] = "skipped";

        if (userInfoRes.ok) {
          const parsed = parsePhotosCountFromUserInfo(userInfoRes.content);
          if (parsed === null) {
            userInfoStatus = "parse_error";
          } else {
            expectedCount = parsed;
          }

          const phoneFromFolder = parsePhoneFromFolderName(folder.name);
          const phoneFromFile = parsePhoneFromUserInfo(userInfoRes.content);
          if (!phoneFromFolder || !phoneFromFile) {
            phoneStatus = "parse_error";
          } else if (phoneFromFolder !== phoneFromFile) {
            phoneStatus = "mismatch";
          } else {
            phoneStatus = "ok";
          }
        } else if (userInfoRes.reason === "not_found") {
          userInfoStatus = "not_found";
        } else {
          userInfoStatus = "error";
        }

        folderState.push({
          name: folder.name,
          uploadedCount,
          expectedCount,
          userInfoStatus,
          phoneStatus,
          folderError: false,
        });
      }
    }

    const lines = folderState.map(formatLine).filter(Boolean);

    const finalLines = lines.length ? lines : ["✅ Проблем не найдено!"];

    const message = [
      `Папка: ${nameFolder}`,
      `Найдено подпапок: ${listFolder?.length}`,
      "",
      ...finalLines,
      "",
    ].join("\n");

    await ctx.replyWithHTML(
      message,
      createInlineKeyboard([
        { label: "📅 Проверить новую дату", action: ADMIN_CHECK_FOLDER_ROUTE },
      ]),
    );
  } catch (e) {
    await ctx.reply(
      "Не удалось получить информацию о папке",
      createInlineKeyboard([
        { label: "📅 Проверить новую дату", action: ADMIN_CHECK_FOLDER_ROUTE },
      ]),
    );
  } finally {
    await ctx.deleteMessage(messageLoading?.message_id);
  }
};

export class AdminCheckFolderScenes {
  handle() {
    return new Scenes.WizardScene<any>(
      SCENE_ADMIN_CHECK_FOLDER,
      // step 1
      async (ctx) => {
        // Отправляем предпросмотр с кнопкой
        await ctx.replyWithHTML(`Введите дату в формате 12.05.2026`);
        // Переходим к финальному шагу для обработки callback
        return ctx.wizard.next();
      },
      // step 2
      async (ctx) => {
        const isReset = await sceneReset(ctx, ctx?.message?.text);
        if (isReset) return null;

        const dateStr = ctx?.message?.text;
        // Не ждём checkFolders: иначе webhook не отдаёт 200, пока идут запросы
        // к Я.Диску, и Telegram ретраит тот же update → дубли loading/результата.
        checkFolders(ctx, dateStr).catch((e) => console.log(e));

        // Переходим к финальному шагу для обработки callback
        return ctx.wizard.next();
      },
      //
      // // Шаг 4: Обработка действий с кнопками
      async (ctx) => {
        const isReset = await sceneReset(ctx, ctx?.message?.text);
        if (isReset) return null;

        // Проверяем, что это callback-запрос
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery();

          if (ctx.callbackQuery.data === ADMIN_CHECK_FOLDER_ROUTE) {
            return ctx.scene.enter(SCENE_ADMIN_CHECK_FOLDER);
          }
        }
        // Если это не callback, ждем нажатия кнопки
        return;
      },
    );
  }
}
