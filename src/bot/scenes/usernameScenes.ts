import { Scenes } from "telegraf";
import { sceneReset } from "../commands/sceneReset";
import { TBotContext } from "../../app/types";
import {
  SCENE_GET_PHONE,
  SCENE_USERNAME,
} from "../../app/constants/constants.scene";
import {
  userNameErrorTemplate,
  userNameTemplate,
} from "../../template/userInfo.template";
import { editMessageText } from "../../features/editMessageText";
import { useSessionInfo } from "../../hooks";

function validateText(inputText: string) {
  // Регулярное выражение для проверки текста:
  // - Разрешает буквы и дефисы в каждом слове
  // - Требует ровно три слова, разделенных пробелами
  // - Дефис не может быть в начале или конце слова
  const pattern =
    /^([А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?)\s([А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?)\s([А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?)$/;
  return pattern.test(inputText);
}

const showErrorMessage = async (ctx: TBotContext) => {
  return await ctx.replyWithHTML(userNameErrorTemplate({}));
};

const deleteErrorMessage = async (ctx: TBotContext, messageId: number) => {
  try {
    if (messageId) {
      await ctx.deleteMessage(messageId);
    }
  } catch (e) {}
};

export class UsernameScenes {
  handle() {
    const usernameScenes = new Scenes.BaseScene<TBotContext>(SCENE_USERNAME);

    let messageError: any = null;

    usernameScenes.enter(async (ctx) => {
      await editMessageText(ctx, { message: userNameTemplate({}) });
    });

    usernameScenes.on("text", async (ctx) => {
      const usernameText = ctx.message.text;
      const clearUsernameText = usernameText?.trim();
      const isReset = await sceneReset(ctx, clearUsernameText);

      if (isReset) return null;

      const isValidUserName = validateText(clearUsernameText);

      const { setDeliveryInfo } = useSessionInfo(ctx);

      if (isValidUserName) {
        await deleteErrorMessage(ctx, messageError?.message_id);
        setDeliveryInfo("userName", clearUsernameText);

        await ctx.scene.enter(SCENE_GET_PHONE);
      } else {
        try {
          await deleteErrorMessage(ctx, messageError?.message_id);
          await ctx.deleteMessage();
        } catch (e) {}

        messageError = await showErrorMessage(ctx);
      }
    });

    usernameScenes.on("message", async (ctx) => {
      await deleteErrorMessage(ctx, messageError?.message_id);
      await showErrorMessage(ctx);
    });

    return usernameScenes;
  }
}
