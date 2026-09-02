import {
  PaymentInfoType,
  TBotContext,
  TContextDeliveryInfo,
  TContextSession,
} from "../app/types";
import { MIN_COUNT_ORDER } from "../app/constants/constants.order";

export const useSessionInfo = (ctx: TBotContext) => {
  const getUserInfo = () => ctx.session.user;
  const getDeliveryInfo = () => getUserInfo()?.deliveryInfo;

  const getPhotoInfo = (): Partial<TContextSession["user"]["photosInfo"]> => {
    let count = ctx.session.user.photosInfo?.listId?.length ?? 0;
    if (count === 0) {
      count = ctx.session.user.photosInfo?.count!;
    }

    return { ...ctx.session.user.photosInfo, count };
  };

  const setPhotoInfo = (
    value: Partial<TContextSession["user"]["photosInfo"]>,
  ) => {
    if (!value) {
      ctx.session.user.photosInfo = {
        count: 0,
        listId: [],
      };
    } else {
      ctx.session.user.photosInfo = {
        ...ctx.session.user.photosInfo,
        ...value,
      };
    }
  };

  const setPhotosInfoListId = (value: string) => {
    if (ctx.session.user?.photosInfo?.listId) {
      ctx.session.user.photosInfo.listId.push(value);
    }
  };

  const getOrderInfo = () => ctx.session?.user?.orderInfo;

  const setOrderInfo = (
    value: Partial<TContextSession["user"]["orderInfo"]>,
  ) => {
    if (!value) {
      ctx.session.user.orderInfo = null;
    } else {
      ctx.session.user.orderInfo = {
        ...ctx.session.user.orderInfo,
        ...value,
      };
    }
  };

  // const getPrintTypeInfo = () => getUserInfo()?.printType as TContextPrintType;
  // const getPathDiskInfo = () => getUserInfo()?.pathDisk;
  // const getPhotos = () => getUserInfo()?.photos;
  // const getPhotosId = () => getUserInfo()?.photosId;

  // const setPrintType = (value: TContextPrintType) =>
  //   (ctx.session.user.printType = value);

  const setDeliveryInfo = <K extends keyof TContextDeliveryInfo>(
    key: K,
    value: TContextDeliveryInfo[K],
  ) => {
    ctx.session.user.deliveryInfo[key] = value;
  };

  // const setPathDisk = (value: string | undefined) =>
  //   (ctx.session.user.pathDisk = value);

  const clearDeliveryInfo = () => {
    ctx.session.user.deliveryInfo = {};
  };

  // const setPhotosId = (value: string) => ctx.session.user.photosId.push(value);

  // const setPhotosCount = (value: number) =>
  //   (ctx.session.user.photosCount = value);

  // const getPhotosCount = () => {
  //   const arrayPhotos = getUserInfo()?.photos ?? [];
  //   const arrayPhotosId = getUserInfo()?.photosId ?? [];
  //
  //   // если фото загрузили через яндекс диск, возвращаем photoCount
  //   if (arrayPhotos.length === 0 && arrayPhotosId.length === 0) {
  //     return getUserInfo()?.photosCount;
  //   }
  //
  //   return arrayPhotos.length || arrayPhotosId.length;
  // };

  const setPaymentInfo = (info: Partial<PaymentInfoType>) =>
    (ctx.session.user.paymentInfo = {
      ...(ctx.session.user.paymentInfo as PaymentInfoType),
      ...info,
    });

  // const getSumPhoto = () => {
  //   const countPhoto = getPhotosCount();
  //   const printType = getPrintTypeInfo();
  //
  //   const sumPhoto = countPhoto * printType;
  //
  //   const sumResult = sumPhoto + PRICE_DELIVERY;
  //
  //   return {
  //     sumPhoto,
  //     sumResult,
  //   };
  // };

  const getPaymentInfo = () => ctx.session.user.paymentInfo;

  const getTrackNumber = () => {
    return getUserInfo().trackNumber;
  };

  const setTrackNumber = (trackNumber: string) => {
    ctx.session.user.trackNumber = trackNumber;
  };
  // pochta order number
  const getPochtaOrderNumber = () => {
    return getUserInfo().pochtaOrderNumber;
  };

  const setPochtaOrderNumber = (orderNumber: string) => {
    ctx.session.user.pochtaOrderNumber = orderNumber;
  };

  const clearUserInfo = () => {
    ctx.session.user = {
      deliveryInfo: {},
      paymentInfo: null,
      trackNumber: null,
      pochtaOrderNumber: null,
      orderInfo: null,
      photosInfo: {
        count: 0,
        listId: [],
      },
      minCountOrder: MIN_COUNT_ORDER,
    };
    ctx.session.isGlobalLoading = false;
    ctx.session.certificate = null;
    ctx.session.globalState = {
      errorUploadPhotosOutsideScene: false,
      messageIdPaymentLink: null,
    };
  };

  return {
    getDeliveryInfo,

    getPhotoInfo,
    setPhotoInfo,
    setPhotosInfoListId,

    getOrderInfo,
    setOrderInfo,

    // getPrintTypeInfo,
    // setPrintType,
    setDeliveryInfo,
    clearDeliveryInfo,
    clearUserInfo,
    // getPathDiskInfo,
    // setPathDisk,

    // getPhotos,

    // setPhotosId,
    // getPhotosId,

    // setPhotosCount,
    // getPhotosCount,

    getPaymentInfo,
    setPaymentInfo,

    getTrackNumber,
    setTrackNumber,

    getPochtaOrderNumber,
    setPochtaOrderNumber,

    isGlobalLoading: ctx.session.isGlobalLoading,
    setIsGlobalLoading: async (newStatus: boolean) => {
      ctx.session.isGlobalLoading = newStatus;
      await ctx.persistSession?.();
    },

    certificateInfo: ctx.session.certificate,
    setCertificate: (value: Partial<TContextSession["certificate"]>) => {
      if (!value) {
        ctx.session.certificate = value;
      } else {
        ctx.session.certificate = { ...ctx.session.certificate, ...value };
      }
    },

    getGlobalState: () => ctx.session.globalState,
    setGlobalState: (updateItem: Partial<TContextSession["globalState"]>) =>
      (ctx.session.globalState = { ...ctx.session.globalState, ...updateItem }),

    setReferrerLink: (link: string) => {
      if (link) ctx.session.referrerLink = link;
    },
    getReferrerLink: () => ctx.session?.referrerLink ?? "",

    // getPaymentType: () => ctx.session?.user?.paymentMethod,
    // setPaymentType: (value: TContextSession["user"]["paymentMethod"]) =>
    //   (ctx.session.user.paymentMethod = value),
    //
    // setPaymentCertificate: (
    //   count: number,
    //   row: number,
    //   type: null | CertificateEnum,
    // ) =>
    //   (ctx.session.user.paymentCertificate = { count, rowInGoogle: row, type }),
    // getPaymentCertificateCount: () =>
    //   ctx.session.user.paymentCertificate?.count,

    // не верная логика. надо переосмыслить
    // getPaymentCertificateRowGoogle: () =>
    //   ctx.session.user.orderInfo?.certificate?.rowInGoogle,
    getMinCountOrder: () => ctx.session.user?.minCountOrder ?? MIN_COUNT_ORDER,
    setMinCountOrder: (count: number) =>
      (ctx.session.user.minCountOrder = count),
  };
};
