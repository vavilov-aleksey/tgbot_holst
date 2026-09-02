import { CdekBaseService } from "./CdekBaseService";
import {
  TRACKING_CDEK_SHIPMENT_POINT,
  TRACKING_CDEK_TARIFF_CODE,
} from "../../app/constants/constants.tracking";

type TCdekOrderResponse = {
  entity?: {
    uuid?: string;
    cdek_number?: string;
    delivery_detail?: {
      total_sum: number;
    };
  };
};

type TCdekPrintCreateResponse = {
  entity?: {
    uuid?: string;
  };
};

type TCdekPrintStatusResponse = {
  entity?: {
    url?: string;
    statuses?: Array<{
      code?: string;
      name?: string;
    }>;
  };
};

export type TCdekDeliveryPoint = {
  code?: string;
  name?: string;
  location?: {
    city_code?: number;
    city?: string;
    address?: string;
    address_full?: string;
  };
};

export type TCdekTariffResponse = {
  delivery_sum?: number;
  period_min?: number;
  period_max?: number;
  calendar_min?: number;
  calendar_max?: number;
  weight_calc?: number;
  total_sum?: number;
  currency?: string;
  delivery_date_range?: {
    min?: string;
    max?: string;
  };
  services?: Array<{
    code?: string;
    sum?: number;
    total_sum?: number;
  }>;
};

export class CdekService extends CdekBaseService {
  private shipmentCityCode: number | null = null;
  constructor() {
    super({
      clientId: process.env.CDEK_CLIENT_ID!,
      clientSecret: process.env.CDEK_CLIENT_SECRET!,
      testMode: false,
    });
  }

  async getInfoOrderById(uuid: string) {
    return this.getOrder(uuid) as Promise<TCdekOrderResponse>;
  }

  async createSimpleOrder(data: {
    orderNumber: string;
    weight: number;
    recipientName: string;
    deliveryPoint: string;
    deliveryPointCityCode: number;
    phone: string;
  }) {
    return this.createOrder({
      number: data.orderNumber,
      type: 1,

      tariff_code: TRACKING_CDEK_TARIFF_CODE,
      shipment_point: TRACKING_CDEK_SHIPMENT_POINT,

      delivery_point: data.deliveryPoint,

      recipient: {
        name: data.recipientName,
        phones: [{ number: data.phone }],
      },

      packages: [
        {
          number: "1",
          weight: data.weight,
          items: [
            {
              name: "Photo",
              ware_key: "10_15",
              payment: { value: 0 },
              weight: data.weight,
              amount: 1,
              cost: 0,
            },
          ],
        },
      ],
    }) as Promise<TCdekOrderResponse>;
  }

  async checkCodePoint(code: string) {
    return this.getAddress({ code }) as Promise<TCdekDeliveryPoint[]>;
  }

  private async getShipmentCityCode(): Promise<number> {
    if (this.shipmentCityCode) {
      return this.shipmentCityCode;
    }

    const shipmentPoints = await this.checkCodePoint(
      TRACKING_CDEK_SHIPMENT_POINT,
    );
    const cityCode = shipmentPoints?.[0]?.location?.city_code;

    if (!cityCode) {
      throw new Error("Не удалось определить город отправления СДЭК");
    }

    this.shipmentCityCode = cityCode;
    return cityCode;
  }

  async calculateTariffForPvz(data: {
    deliveryPointCode: string;
    weight: number;
    pvzInfo?: TCdekDeliveryPoint[];
  }): Promise<TCdekTariffResponse> {
    const pvzList = data.pvzInfo;
    const toCityCode = pvzList?.[0]?.location?.city_code!;

    const fromCityCode = await this.getShipmentCityCode();

    return this.calculateTariff({
      tariff_code: Number(TRACKING_CDEK_TARIFF_CODE),
      from_location: { code: fromCityCode },
      to_location: { code: toCityCode },
      packages: [{ weight: data.weight }],
    }) as Promise<TCdekTariffResponse>;
  }

  async createPrint(orderUuid: string) {
    return this.createPrintOrder({
      orderUuid,
    }) as Promise<TCdekPrintCreateResponse>;
  }

  async getPrint(uuid: string) {
    return this.getPrintOrder({ uuid }) as Promise<TCdekPrintStatusResponse>;
  }

  async downloadPrint(url: string) {
    return this.downloadPrintOrder({ url });
  }

  async down(url: string) {
    return this.downloadPdf({ url });
  }
}
