import axios, { AxiosInstance } from "axios";

interface CdekAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

type CdekApiError = {
  requests?: Array<{
    errors?: Array<{ code?: string; message?: string }>;
  }>;
  message?: string;
};

export abstract class CdekBaseService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  private token: string | null = null;

  protected api: AxiosInstance | null = null;

  constructor(options: {
    clientId: string;
    clientSecret: string;
    testMode?: boolean;
  }) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;

    this.baseUrl = options.testMode
      ? "https://api.edu.cdek.ru/v2"
      : "https://api.cdek.ru/v2";
  }

  /**
   * Авторизация OAuth
   */
  protected async authenticate(): Promise<void> {
    try {
      const response = await axios.post<CdekAuthResponse>(
        `${this.baseUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.token = response.data.access_token;

      this.api = axios.create({
        baseURL: this.baseUrl,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Ошибка авторизации CDEK:", error);
      throw error;
    }
  }

  /**
   * Универсальный GET
   */
  protected async get<T>(url: string, params?: any): Promise<T> {
    await this.authenticate();

    try {
      const response = await this.api!.get<T>(url, { params });
      return response.data;
    } catch (error) {
      console.error(`Ошибка GET ${url}:`, error);
      throw error;
    }
  }

  protected async getFile<T>(url: string, config?: any): Promise<T> {
    await this.authenticate();

    try {
      const response = await this.api!.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Ошибка GET ${url}:`, error);
      throw error;
    }
  }

  /**
   * Универсальный POST
   */
  protected async post<T>(url: string, body?: any) {
    await this.authenticate();

    try {
      const response = await this.api!.post<T>(url, body);
      return response.data;
    } catch (error) {
      const responseData = (error as any)?.response?.data as
        | CdekApiError
        | undefined;
      const firstError = responseData?.requests?.[0]?.errors?.[0];
      const message =
        firstError?.message || responseData?.message || "Неизвестная ошибка";

      console.error(`Ошибка POST ${url}: ${message}`);
      throw new Error(message);
    }
  }

  /**
   * Создать заказ
   */
  protected async createOrder(order: any) {
    return this.post("/orders", order);
  }

  /**
   * Получить заказ по UUID
   */
  protected async getOrder(uuid: string) {
    return this.get(`/orders/${uuid}`);
  }

  /**
   * Получить список заказов
   */
  protected async getOrders(params?: {
    date?: string;
    page?: number;
    size?: number;
  }) {
    return this.get("/orders", params);
  }

  /**
   * Получить статусы заказов
   */
  protected async getOrderStatuses(params?: { date?: string }) {
    return this.get("/orders/statuses", params);
  }

  protected async getAddress({ code }: { code: string }) {
    return this.get("/deliverypoints", { code });
  }

  protected async calculateTariff(body: {
    tariff_code: number;
    from_location: { code: number };
    to_location: { code: number };
    packages: Array<{
      weight: number;
      length?: number;
      width?: number;
      height?: number;
    }>;
  }) {
    return this.post("/calculator/tariff", body);
  }

  protected async createPrintOrder({
    orderUuid,
  }: {
    orderUuid: string;
  }): Promise<
    | {
        entity: {
          uuid: string; // Идентификатор квитанции к заказу в ИС СДЭК
        };
      }
    | undefined
  > {
    return this.post("/print/barcodes", {
      orders: [{ order_uuid: orderUuid }],
      format: "A6",
      copy_count: 1,
      lang: "RUS",
    });
  }

  protected async getPrintOrder({ uuid }: { uuid: string }): Promise<
    | {
        entity: {
          uuid: string;
          url: string;
          statuses: Array<{
            code: string;
            name: string;
          }>;
        };
      }
    | undefined
  > {
    return this.get(`/print/barcodes/${uuid}`);
  }

  protected async downloadPrintOrder({ url }: { url: string }) {
    return this.getFile(url, {
      responseType: "arraybuffer",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  protected async downloadPdf({ url }: { url: string }) {
    return this.get(url, {
      responseType: "arraybuffer",
      headers: {
        contentType: "application/json",
      },
    });
  }
}
