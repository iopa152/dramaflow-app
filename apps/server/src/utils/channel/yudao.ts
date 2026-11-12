import type {
  AuthenticatedOptions, Captcha, Channel, ExploreDetail, ExplorePage, ExploreParams, ExploreProcess,
  HomeAdvertisements, Login, LoginParams, ModelData, ModelDataParams, PluginExistence, PluginIdentity,
  PreviewData, ProviderSources, RequestOptions, Sponsor, SubAccountsPage, SubAccountsParams, TaskRecordsPage, TaskRecordsParams,
  WalletBonusBatchesPage, WalletBonusBatchesParams, WalletOrdersPage, WalletOrdersParams, WalletPayment, WalletPaymentParams,
  WalletPaymentStatus, WalletPlan, WalletPresentation, WalletActivity,
} from "./types";

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

// yudao 余额以「分」为单位，账目面板按「元」展示。
const fenToYuan = (fen: unknown) => typeof fen === "number" && Number.isFinite(fen) ? fen / 100 : 0;

interface YudaoResponse<T> { code: number; data: T; msg: string }

export class Yudao implements Channel {
  private readonly base: string;
  private readonly tenant: string;

  constructor() {
    this.base = (process.env.DRAMAFLOW_YUDAO_BASE || "http://127.0.0.1:48080").replace(/\/$/, "");
    this.tenant = process.env.DRAMAFLOW_YUDAO_TENANT?.trim() || "1";
  }

  private unsupported(action: string): never {
    fail(`yudao 渠道暂未实现该能力：${action}`, 501);
  }

  private async request<T>(params: {
    path: string; method: "GET" | "POST"; data?: unknown; token?: string; signal?: AbortSignal; query?: Record<string, string>;
  }): Promise<T> {
    const timeout = AbortSignal.timeout(20000);
    const signal = params.signal ? AbortSignal.any([params.signal, timeout]) : timeout;
    const url = this.base + params.path + (params.query ? "?" + new URLSearchParams(params.query) : "");
    let response: Response | undefined;
    let body: YudaoResponse<T> | null = null;
    try {
      response = await fetch(url, {
        method: params.method, signal, redirect: "error",
        headers: {
          Accept: "application/json", "tenant-id": this.tenant,
          ...(params.data !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(params.token ? { Authorization: "Bearer " + params.token } : {}),
        },
        ...(params.data !== undefined ? { body: JSON.stringify(params.data) } : {}),
      });
      body = await response.json() as YudaoResponse<T>;
    } catch {
      if (params.signal?.aborted) fail("请求已取消", 499);
      if (timeout.aborted) fail("yudao 请求超时，请重试", 504);
      fail(response ? `yudao 请求失败（HTTP ${response.status}）` : "yudao 请求失败，请检查服务是否启动", response?.status ?? 502);
    }
    if (params.signal?.aborted) fail("请求已取消", 499);
    if (!response.ok || body?.code !== 0) {
      const status = !response.ok ? response.status : body?.code;
      let message = typeof body?.msg === "string" && body.msg.trim() ? body.msg : "yudao 请求失败";
      const pwd = (params.data as { password?: unknown } | undefined)?.password;
      if (typeof pwd === "string") message = message.replaceAll(pwd, "••••••");
      message = message.replace(/(Bearer\s+)[^\s"'<>]+/gi, "$1••••••").slice(0, 1000);
      fail(message, typeof status === "number" && status >= 400 && status <= 599 ? status : 502);
    }
    return body.data as T;
  }

  // 令牌换用户身份：yudao 的钱包按 userId 查询，而渠道方法只拿得到 token。
  private async resolveUserId(token: string, signal?: AbortSignal): Promise<number> {
    const info = await this.request<{ user?: { id?: unknown } }>({
      path: "/admin-api/system/auth/get-permission-info", method: "GET", token, signal,
    });
    const id = info?.user?.id;
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1) fail("yudao 用户身份响应格式不正确", 502);
    return id;
  }

  async getCaptcha(_options?: RequestOptions): Promise<Captcha> {
    // yudao 本地部署的登录未启用验证码校验，前端表单占位即可。
    return { svg: "", captcha: "" };
  }

  async sendSmsCode(_params: unknown, _options?: RequestOptions): Promise<number> {
    this.unsupported("短信验证码");
  }

  async register(_params: unknown, _options?: RequestOptions): Promise<{ userCode: string }> {
    // 账号统一在 yudao 管理后台创建。
    this.unsupported("注册");
  }

  async login(params: LoginParams, options?: RequestOptions): Promise<Login> {
    if (typeof params.userName !== "string" || !params.userName.trim()) fail("请输入用户名");
    if (typeof params.password !== "string" || !params.password) fail("请输入密码");
    const data = await this.request<{ accessToken?: unknown; userId?: unknown }>({
      path: "/admin-api/system/auth/login", method: "POST", signal: options?.signal,
      data: { username: params.userName.trim(), password: params.password },
    });
    if (typeof data?.accessToken !== "string" || !data.accessToken.trim()) fail("yudao 登录响应格式不正确", 502);
    return { token: data.accessToken, info: { userName: params.userName.trim(), phone: "" } };
  }

  async forgotPassword(_params: unknown, _options?: RequestOptions): Promise<string> {
    this.unsupported("忘记密码（请在 yudao 管理后台重置）");
  }

  private unsupportedPlugins(_params: unknown, _options?: RequestOptions): never {
    this.unsupported("插件市场");
  }

  async getPlugins(_params: unknown, _options?: RequestOptions): Promise<never> { return this.unsupportedPlugins(_params, _options); }
  async getPluginExistence(_plugins: PluginIdentity[], _options: AuthenticatedOptions): Promise<PluginExistence[]> {
    this.unsupported("插件市场");
  }
  async toggleCollection(_pluginId: number, _options: AuthenticatedOptions): Promise<never> { return this.unsupportedPlugins(_pluginId, _options); }
  async getPluginUploadSignature(_params: unknown, _options: AuthenticatedOptions): Promise<never> { return this.unsupportedPlugins(_params, _options); }
  async uploadPlugin(_params: unknown, _options: AuthenticatedOptions): Promise<never> { return this.unsupportedPlugins(_params, _options); }
  async updatePlugin(_params: unknown, _options: AuthenticatedOptions): Promise<never> { return this.unsupportedPlugins(_params, _options); }
  async deletePlugin(_id: number, _options: AuthenticatedOptions): Promise<never> { return this.unsupportedPlugins(_id, _options); }

  async getPreviewData(options: AuthenticatedOptions): Promise<PreviewData> {
    const userId = await this.resolveUserId(options.token, options.signal);
    const wallet = await this.request<{ balance?: unknown; totalExpense?: unknown; totalRecharge?: unknown }>({
      path: "/admin-api/pay/wallet/get", method: "GET", token: options.token, signal: options.signal,
      query: { userId: String(userId) },
    });
    // 消费曲线：取最近一笔流水页聚合支付类（bizType=3）记录，超出页容量的历史不计入。
    let daily: { date: string; total: number }[] = [];
    const transactions = await this.request<{ list?: { price?: unknown; bizType?: unknown; createTime?: unknown }[] } | null>({
      path: "/admin-api/pay/wallet-transaction/page", method: "GET", token: options.token, signal: options.signal,
      query: { userId: String(userId), pageNo: "1", pageSize: "100" },
    }).catch(() => null);
    const byDay = new Map<string, number>();
    for (const item of transactions?.list ?? []) {
      if (item?.bizType !== 3 || typeof item.price !== "number" || typeof item.createTime !== "number") continue;
      const date = new Date(item.createTime).toISOString().slice(0, 10);
      byDay.set(date, (byDay.get(date) ?? 0) + item.price);
    }
    daily = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total: fenToYuan(total) }));
    return {
      totalPoints: fenToYuan(wallet?.balance),
      bonusBalance: 0,
      totalConsumption: fenToYuan(wallet?.totalExpense),
      daily,
    };
  }

  async getUsageStatistics(_params: unknown, _options: AuthenticatedOptions): Promise<never> {
    this.unsupported("消费统计");
  }
  async getTaskRecords(_params: TaskRecordsParams, _options: AuthenticatedOptions): Promise<TaskRecordsPage> {
    this.unsupported("任务记录");
  }
  async getPointsConsumption(_params: unknown, _options: AuthenticatedOptions): Promise<never> {
    this.unsupported("积分消耗");
  }
  async getSubAccounts(_params: SubAccountsParams, _options: AuthenticatedOptions): Promise<SubAccountsPage> {
    this.unsupported("子账号（账号统一在 yudao 管理后台维护）");
  }
  async createSubAccount(_params: unknown, _options: AuthenticatedOptions): Promise<void> { this.unsupported("子账号"); }
  async removeSubAccount(_id: number, _options: AuthenticatedOptions): Promise<void> { this.unsupported("子账号"); }

  async getWalletOrders(_params: WalletOrdersParams, _options: AuthenticatedOptions): Promise<WalletOrdersPage> {
    this.unsupported("钱包订单");
  }
  async getWalletPlans(_options: AuthenticatedOptions): Promise<WalletPlan[]> {
    this.unsupported("充值套餐");
  }
  async getWalletPresentation(_options: AuthenticatedOptions): Promise<WalletPresentation> {
    this.unsupported("钱包页配置");
  }
  async getWalletActivity(_options: AuthenticatedOptions): Promise<WalletActivity> {
    this.unsupported("充值活动");
  }
  async getWalletBonusBatches(_params: WalletBonusBatchesParams, _options: AuthenticatedOptions): Promise<WalletBonusBatchesPage> {
    this.unsupported("赠送金");
  }
  async exchangeWalletCode(_code: string, _options: AuthenticatedOptions): Promise<void> { this.unsupported("兑换码"); }
  async createWalletPayment(_params: WalletPaymentParams, _options: AuthenticatedOptions): Promise<WalletPayment> { this.unsupported("在线支付"); }
  async getWalletPaymentStatus(_orderNumber: string, _options: AuthenticatedOptions): Promise<WalletPaymentStatus> { this.unsupported("在线支付"); }

  async getModelData(_params: ModelDataParams, _options: AuthenticatedOptions): Promise<ModelData[]> {
    // 模型目录由 Dramaflow 自身的供应商配置承担，yudao 侧暂不维护目录。
    return [];
  }

  async getProviderSource(_options: AuthenticatedOptions): Promise<ProviderSources> {
    this.unsupported("账号供应商源码（本地请在语言/媒体模型设置中自行配置）");
  }

  async getExploreProjects(_params: ExploreParams, _options?: RequestOptions): Promise<ExplorePage> {
    this.unsupported("探索社区");
  }
  async getExploreProject(_projectId: string, _options?: RequestOptions): Promise<ExploreDetail> {
    this.unsupported("探索社区");
  }
  async getExploreProcess(_projectId: string, _options?: RequestOptions): Promise<ExploreProcess> {
    this.unsupported("探索社区");
  }
  async getExploreDownload(_projectId: string, _options?: RequestOptions): Promise<{ downloadUrl: string }> {
    this.unsupported("探索社区");
  }
  async getExploreUploadSignature(_params: unknown, _options: AuthenticatedOptions): Promise<never> { this.unsupported("探索社区"); }
  async uploadExploreProject(_params: unknown, _options: AuthenticatedOptions): Promise<never> { this.unsupported("探索社区"); }

  async getSponsorList(_options?: RequestOptions): Promise<Sponsor[]> {
    return [];
  }

  async getAdvertisements(_options?: RequestOptions): Promise<HomeAdvertisements> {
    return { banner: null, banners: [], bannerMode: "carousel", bannerInterval: 0, sidebar: [] };
  }
}
