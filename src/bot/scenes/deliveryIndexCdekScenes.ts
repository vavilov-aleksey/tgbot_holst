import { Scenes } from "telegraf";
import { createInlineKeyboard } from "../../utils";
import { sceneReset } from "../commands/sceneReset";
import { TRACKING_CDEK_INDEX_URL } from "../../app/constants/constants.tracking";
import { SCENE_GET_INDEX_CDEK } from "../../app/constants/constants.scene";
import { DeliveryTypeEnum, TBotContext } from "../../app/types";
import {
  errorCdekAPITemplate,
  errorCdekIndexTemplate,
  loaderCheckCdekPvzTemplate,
  minOrderCdekTemplate,
  startCdekInfoTemplate,
} from "../../template/cdek.template";
import { CdekService } from "../../services/Cdek/CdekService";
import { SELECT_DELIVERY_CDEK_NEXT_STEP_ROUTE } from "../../configs/routes";
import { useSessionInfo } from "../../hooks";
import { editMessageText } from "../../features/editMessageText";
import { pluralize } from "../../utils/pluralize";
import { PRICE_PRINT_TYPE_BIG } from "../../app/constants/constants.price";
import { getWeightHolst } from "../../features/getWeightHolst";

const getMinCount = (price: number) => {
  if (price < 500) return 1;
  if (price < 1000) return 2;
  if (price >= 1000) return 3;
  return 3;
};

const showErrorMessage = async (ctx: TBotContext, index: string) => {
  return await ctx.replyWithHTML(errorCdekIndexTemplate({ index }));
};

const deleteErrorMessage = async (ctx: TBotContext, messageId: number) => {
  try {
    if (messageId) {
      await ctx.deleteMessage(messageId);
    }
  } catch (e) {}
};

export class DeliveryIndexCdekScenes {
  handle() {
    const addressScenes = new Scenes.BaseScene<TBotContext>(
      SCENE_GET_INDEX_CDEK,
    );

    let messageError: any = null;

    addressScenes.enter(async (ctx) => {
      await editMessageText(ctx, {
        message: startCdekInfoTemplate({}),
        keyboard: [
          {
            label: "Узнать ID ПВЗ",
            action: TRACKING_CDEK_INDEX_URL,
            type: "url",
          },
        ],
      });
    });

    addressScenes.on("text", async (ctx) => {
      const indexText = ctx.message.text.trim();
      const isReset = await sceneReset(ctx, indexText);

      if (isReset) return null;

      await deleteErrorMessage(ctx, messageError?.message_id);

      const loaderMessage = await ctx.replyWithHTML(
        loaderCheckCdekPvzTemplate({}),
      );

      try {
        const cdekService = new CdekService();
        const pvzInfo = await cdekService.checkCodePoint(indexText);

        if (!pvzInfo?.length) {
          messageError = await showErrorMessage(ctx, indexText);
          return;
        }

        const { getPhotoInfo } = useSessionInfo(ctx);
        const typePrint = getPhotoInfo()?.type || PRICE_PRINT_TYPE_BIG;

        const weightPhoto = getWeightHolst(typePrint, 1);

        try {
          const { setDeliveryInfo, setMinCountOrder } = useSessionInfo(ctx);
          const tariff = await cdekService.calculateTariffForPvz({
            deliveryPointCode: indexText,
            weight: weightPhoto,
            pvzInfo,
          });

          setDeliveryInfo("type", DeliveryTypeEnum.cdek);
          setDeliveryInfo("idPvz", indexText);
          setDeliveryInfo("cityCodePvz", pvzInfo?.[0]?.location?.city_code);
          setDeliveryInfo("address", pvzInfo[0]?.location?.address_full);

          console.log({ Tariff: tariff?.total_sum, IdPVZ: indexText });

          const minCount = getMinCount(Number(tariff?.total_sum));
          setMinCountOrder(minCount);

          await ctx.replyWithHTML(
            minOrderCdekTemplate({
              minOrder: `${minCount} ${pluralize(minCount, "холста", "холстов", "холстов")}`,
            }),
            createInlineKeyboard([
              {
                label: "Продолжить",
                action: SELECT_DELIVERY_CDEK_NEXT_STEP_ROUTE,
              },
            ]),
          );
        } catch (error) {
          console.error("Ошибка расчёта тарифа CDEK:", error);
        }
      } catch (error) {
        await ctx.replyWithHTML(errorCdekAPITemplate({}));
      } finally {
        ctx.deleteMessage(loaderMessage.message_id);
      }
    });

    addressScenes.on("message", async (ctx) => {
      await deleteErrorMessage(ctx, messageError?.message_id);

      await editMessageText(ctx, {
        message: startCdekInfoTemplate({}),
        keyboard: [
          {
            label: "Узнать ID ПВЗ",
            action: TRACKING_CDEK_INDEX_URL,
            type: "url",
          },
        ],
      });
    });

    return addressScenes;
  }
}
