import { Scenes } from "telegraf";
import { TBotContext } from "../../app/types";
import { DeliveryIndexCdekScenes } from "./deliveryIndexCdekScenes";
import { UsernameScenes } from "./usernameScenes";
import { PhoneScenes } from "./phoneScenes";
import { SavePhotoScenes } from "./savePhotoScenes";
import { UploadYandexDiskScenes } from "./uploadYandexDiskScenes";
import { SelectedPaymentTypeScenes } from "./selectedPaymentTypeScenes";
import { AdminSendMessageAllScenes } from "./admin/adminSendMessageAllScenes";
import { AdminSendMessageRegularScenes } from "./admin/adminSendMessageRegularScenes";
import { AdminSendMessageScenes } from "./admin/adminSendMessageScenes";
import { FeedbackScenes } from "./feedbackScenes";
import { AdminAddGiftScenes } from "./admin/adminAddGiftScenes";
import { AdminAddCertificateScenes } from "./admin/adminAddCertificateScenes";
import { AdminCheckFolderScenes } from "./admin/adminCheckFolderScenes";
import { AdminSaveFixPhotoScenes } from "./admin/adminSaveFixPhotoScenes";
import { AdminGetPhotosCountByDateScenes } from "./admin/adminGetPhotosCountByDateScenes";
import { CertificateScene } from "./certificateScene";

export const scenesProvider = (thisBot: any) =>
  new Scenes.Stage<TBotContext>([
    new DeliveryIndexCdekScenes().handle(),
    new UsernameScenes().handle(),
    new PhoneScenes().handle(),
    new SavePhotoScenes(thisBot).handle(),
    new UploadYandexDiskScenes(thisBot).handle(),
    new SelectedPaymentTypeScenes().handle(),
    new AdminSendMessageAllScenes(thisBot).handle(),
    new AdminSendMessageRegularScenes(thisBot).handle(),
    new AdminSendMessageScenes(thisBot).handle(),
    new FeedbackScenes().handle(),
    new CertificateScene().handle(),
    new AdminAddGiftScenes().handle(),
    new AdminAddCertificateScenes().handle(),
    new AdminCheckFolderScenes().handle(),
    new AdminSaveFixPhotoScenes(thisBot).handle(),
    new AdminGetPhotosCountByDateScenes().handle(),
  ]).middleware();
