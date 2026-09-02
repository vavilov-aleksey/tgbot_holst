import { Scenes } from "telegraf";
import { useSessionInfo } from "../../hooks";
import { sceneReset } from "../commands/sceneReset";
import { yaDiskService } from "../../services/YandexDisk";
import { repeatedOrderError } from "../helpText/repeatedOrderError";
import { getNameFolderYandexDisk } from "../../features/getNameFolderYandexDisk";
import { TBotContext } from "../../app/types";
import {
  SCENE_GET_PHONE,
  SCENE_SELECTED_PAYMENT_TYPE,
} from "../../app/constants/constants.scene";
import { validatePhoneNumber } from "../../utils";
import {
  phoneEnterErrorTemplate,
  phoneEnterTemplate,
} from "../../template/userInfo.template";
import { editMessageText } from "../../features/editMessageText";

const showErrorMessage = async (ctx: TBotContext) => {
  return await ctx.replyWithHTML(phoneEnterErrorTemplate({}));
};

const deleteErrorMessage = async (ctx: TBotContext, messageId: number) => {
  try {
    if (messageId) {
      await ctx.deleteMessage(messageId);
    }
  } catch (e) {}
};

export class PhoneScenes {
  handle() {
    const phoneScenes = new Scenes.BaseScene<TBotContext>(SCENE_GET_PHONE);

    let messageError: any = null;

    phoneScenes.enter(async (ctx) => {
      await editMessageText(ctx, { message: phoneEnterTemplate({}) });
    });

    phoneScenes.on("text", async (ctx) => {
      const phoneText = ctx.message.text;
      const clearText = phoneText.trim();
      const isReset = await sceneReset(ctx, clearText);

      if (isReset) return null;

      const isValidPhone = validatePhoneNumber(clearText);

      if (!isValidPhone) {
        try {
          await deleteErrorMessage(ctx, messageError?.message_id);
          await ctx.deleteMessage();
        } catch (e) {}

        messageError = await showErrorMessage(ctx);
      } else {
        await deleteErrorMessage(ctx, messageError?.message_id);

        // temp
        if (true) {
          const { setDeliveryInfo } = useSessionInfo(ctx);
          setDeliveryInfo("phone", clearText);

          ctx.scene.enter(SCENE_SELECTED_PAYMENT_TYPE);
          return;
        }

        const { checkCreatePath } = yaDiskService();
        const { setDeliveryInfo } = useSessionInfo(ctx);

        const { getNameFolderForPhoneNumber } = getNameFolderYandexDisk(ctx);

        const namePath = getNameFolderForPhoneNumber(clearText);

        // проверяем, что на яндекс диске нет папки с таким номером телефона
        const hasFolder = await checkCreatePath<boolean>(namePath);

        if (hasFolder) {
          await repeatedOrderError(ctx, clearText);
        } else {
          setDeliveryInfo("phone", clearText);

          ctx.scene.enter(SCENE_SELECTED_PAYMENT_TYPE);
        }
      }
    });

    phoneScenes.on("message", async (ctx) => {
      await deleteErrorMessage(ctx, messageError?.message_id);
      await showErrorMessage(ctx);
    });

    return phoneScenes;
  }
}
