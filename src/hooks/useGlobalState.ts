import { TBotContext } from "../app/types";
import { useSessionInfo } from "./useSession";

export const useGlobalState = (ctx: TBotContext) => {
  const { setGlobalState, getGlobalState } = useSessionInfo(ctx);

  const { messageIdPaymentLink } = getGlobalState() || {};

  const deletePaymentLink = async () => {
    if (messageIdPaymentLink) {
      try {
        await ctx.deleteMessage(messageIdPaymentLink);
      } catch (error) {
      } finally {
        setGlobalState({ messageIdPaymentLink: null });
      }
    }
  };

  return {
    deletePaymentLink,
    setGlobalState,
  };
};
