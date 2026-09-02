import { Scenes } from "telegraf";
import { useSessionInfo } from "../../hooks";
import { sceneReset } from "../commands/sceneReset";
import { confirmAndPay } from "../commands/payment/confirmAndPay";
import { TBotContext } from "../../app/types";
import { SCENE_SAVE_PHOTO } from "../../app/constants/constants.scene";
import { createInlineKeyboard } from "../../utils";
import {
  errorFormatPhotoTemplate,
  finalSavePhotoSceneTemplate,
  minCountSavePhotoSceneTemplate,
  savePhotoSceneTemplate,
} from "../../template/savePhotoScene.template";
import { useGlobalState } from "../../hooks/useGlobalState";
import { editMessageText } from "../../features/editMessageText";
import { loaderCreateOrder } from "../../template/sucessPayment";
import { runPostPaymentProcessing } from "../commands/payment/statusPayment";

export class SavePhotoScenes {
  constructor(private bot: any) {}

  handle() {
    const savePhotoScenes = new Scenes.BaseScene<TBotContext>(SCENE_SAVE_PHOTO);

    savePhotoScenes.enter(async (ctx) => {
      const { setPhotoInfo, getMinCountOrder } = useSessionInfo(ctx);
      setPhotoInfo({ count: 0, listId: [] });
      if (ctx?.from?.id) {
        simpleManager.clearUserState(ctx.from.id);
      }

      const minCountOrder = getMinCountOrder();

      await editMessageText(ctx, {
        message: savePhotoSceneTemplate({ minCountOrder: minCountOrder }),
      });
    });

    // вынести в хелпер переиспользуемый
    savePhotoScenes.action("Оформить заказ", async (ctx) => {
      if (ctx?.from?.id) {
        simpleManager.clearUserState(ctx.from.id);
      }
      const { deletePaymentLink } = useGlobalState(ctx);

      await deletePaymentLink();

      const message = await ctx.replyWithHTML(loaderCreateOrder({}));

      if (false) {
        await confirmAndPay(ctx);
      }
      await runPostPaymentProcessing(ctx);
      try {
        await ctx.deleteMessage(message.message_id);
      } catch (e) {
        console.log(
          "❌ Не удалось удалить сообщение в savePhotoScenes 48: ",
          e,
        );
      }
      await ctx.scene.leave();
    });

    savePhotoScenes.on(["document"], (ctx) => {
      console.log(ctx);
      return simpleManager.handlePhoto(ctx);
    });

    savePhotoScenes.on(["message"], async (ctx) => {
      // @ts-ignore
      const text = ctx.message?.text;
      const isReset = await sceneReset(ctx, text);
      if (isReset) return null;

      // @ts-ignore
      if (!ctx.message?.document) {
        await ctx.replyWithHTML(errorFormatPhotoTemplate({}));
        try {
          await ctx.deleteMessage();
        } catch (e) {}
      }
    });

    return savePhotoScenes;
  }
}

class SmartPhotoManager {
  private userStates: Map<
    number,
    {
      completionTimer: NodeJS.Timeout | null;
      lastPhotoTime: number;
      photoCount: number;
    }
  >;
  private MIN_DELAY: number;

  constructor() {
    this.userStates = new Map();
    this.MIN_DELAY = 10000; // 20 секунд минимальной паузы
  }

  private getUserState(userId: number) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        completionTimer: null,
        lastPhotoTime: 0,
        photoCount: 0,
      });
    }

    return this.userStates.get(userId)!;
  }

  clearUserState(userId: number) {
    const state = this.userStates.get(userId);
    if (state?.completionTimer) {
      clearTimeout(state.completionTimer);
    }
    this.userStates.delete(userId);
  }

  async handlePhoto(ctx: TBotContext) {
    const userId = Number(ctx?.from?.id);
    if (!Number.isFinite(userId)) return null;
    const state = this.getUserState(userId);
    // @ts-ignore
    const text = ctx.message?.text;
    const isReset = await sceneReset(ctx, text);
    if (isReset) return null;

    // @ts-ignore
    if (!!ctx.message?.document) {
      const { setPhotosInfoListId, getPhotoInfo } = useSessionInfo(ctx);
      const { setGlobalState, deletePaymentLink } = useGlobalState(ctx);

      let fileId = null;
      let fileSize = null;

      //@ts-ignore
      const { file_id, file_size } = ctx.message.document!;
      fileId = file_id;
      fileSize = file_size;

      console.log(ctx.message);

      if (fileSize > 0) {
        setPhotosInfoListId(fileId);
        state.photoCount = getPhotoInfo()?.listId?.length || 0;
        state.lastPhotoTime = Date.now();

        // Всегда сбрасываем предыдущий таймер
        if (state.completionTimer) {
          clearTimeout(state.completionTimer);
        }

        // Увеличиваем таймаут до 10 секунд
        state.completionTimer = setTimeout(() => {
          const currentState = this.getUserState(userId);
          const timeSinceLastPhoto = Date.now() - currentState.lastPhotoTime;

          const sendFinalMessage = async () => {
            // Удаляем предыдущее финальное сообщение если есть
            await deletePaymentLink();

            let message = null;
            const { getMinCountOrder } = useSessionInfo(ctx);

            const minCountOrder = getMinCountOrder();

            if (currentState.photoCount < minCountOrder) {
              message = await ctx.replyWithHTML(
                minCountSavePhotoSceneTemplate({
                  minCount: minCountOrder,
                  currentCount: currentState.photoCount,
                  difference: minCountOrder - currentState.photoCount,
                }),
              );
            } else {
              message = await ctx.replyWithHTML(
                finalSavePhotoSceneTemplate({
                  photoCount: currentState.photoCount,
                }),
                createInlineKeyboard([
                  { label: "🚀 Оформить заказ", action: "Оформить заказ" },
                ]),
              );
            }

            setGlobalState({ messageIdPaymentLink: message?.message_id });

            // Очищаем таймер
            currentState.completionTimer = null;
          };

          if (timeSinceLastPhoto >= this.MIN_DELAY) {
            sendFinalMessage();
          } else {
            console.log(
              `⚠️ Пауза слишком короткая, продолжаем ждать..., chatId: ${ctx?.from?.id}`,
            );
            currentState.completionTimer = setTimeout(() => {
              sendFinalMessage();
            }, 60000);
          }
        }, this.MIN_DELAY);
      }

      return null;
    }
  }
}

// Использование
const simpleManager = new SmartPhotoManager();
