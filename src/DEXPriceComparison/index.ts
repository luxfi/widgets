import BigNumber from "bignumber.js";
import Widget from "../Widget";
import { query2obj, obj2query, throttle, isUrlMatched } from "../utils";
import logo from "./static/logo.svg";
import bg from "./static/background.png";
import icon1inch from "./static/1inch.png";
import iconMatcha from "./static/matcha.png";
import iconParaSwap from "./static/paraswap.png";
import iconArrow from "./static/arrow.svg";

declare global {
  interface Window {
    web3: any;
  }
}

interface SiteRuleItem {
  collector(): void;
  onHashChange?(): void;
}

interface UniSwapParams {
  amount: string;
  protocols: string;
  tokenInAddress: string;
  tokenInChainId: string;
  tokenOutAddress: string;
  tokenOutChainId: string;
  type: 'exactIn' | 'exactOut';
}

const Dexs = [
  {
    id: "1inch2",
    name: "1inch",
    icon: icon1inch,
  },
  {
    id: "paraswap",
    name: "ParaSwap",
    icon: iconParaSwap,
  },
  {
    id: "matcha",
    name: "Matcha",
    icon: iconMatcha,
  },
];

export default class DEXPriceComparison extends Widget {
  private currentRule: SiteRuleItem;
  private enable: boolean = true;
  private el: HTMLElement;

  static widgetName = "DEX Price Comparison";
  static image = logo;
  static description =
    "When you make a trade on some DEXes, it will show the prices of the corresponding trade on 1inch, Paraswap, Matcha.\n\nOnly Ethereum transactions on Uniswap are supported for now.";
  static version = "1.0.0";

  constructor(rule: string) {
    super();
    this.currentRule = this.siteRule[rule];
    const style = document.createElement("style");
    style.innerHTML = `
      .lux-widget-dex-price-comparison, .lux-widget-dex-price-comparison * {
        font-family: Arial, Helvetica, Tahoma, "PingFang SC", "Hiragino Sans GB", sans-serif;
      }
      .lux-widget-dex-price-comparison {
        position: fixed;
        background-image: url(${bg});
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        box-shadow: 0px 24px 40px rgba(134, 151, 255, 0.08);
        border-radius: 6px;
        padding: 8px;
        width: 316px;
        height: 122px;
        z-index: 1;
      }
      .lux-widget-dex-price-comparison__header {
        font-weight: 500;
        font-size: 12px;
        line-height: 14px;
        color: #FFFFFF;
        margin-bottom: 4px;
      }
      .lux-widget-dex-price-comparison__content {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(120px);
        border-radius: 4px;
        padding: 10px;
      }
      .lux-widget-dex-price-comparison__item {
        height: 16px;
        width: 100%;
        margin-bottom: 10px;
        display: flex;
      }
      .lux-widget-dex-price-comparison__item .icon-dex {
        width: 16px;
        margin-right: 8px;
      }
      .lux-widget-dex-price-comparison__item .flex-1 {
        flex: 1;
        display: flex;
        align-items: center;
      }
      .lux-widget-dex-price-comparison__item .icon-arrow {
        margin-left: 4px;
        margin-right: 4px;
        width: 12px;
      }
      .lux-widget-dex-price-comparison__item .no-quote {
        font-size: 12px;
        line-height: 14px;
        color: #707280;
      }
      .lux-widget-dex-price-comparison__popover {
        position: absolute;
        top: -30px;
        font-size: 12px;
        line-height: 16px;
        color: #FFFFFF;
        left: 50%;
        transform: translateX(-50%);
        background: #13141A;
        border-radius: 2px;
        min-width: 52px;
        padding: 4px 4px;
        text-align: center;
      }
      .lux-widget-dex-price-comparison__item-amount {
        display: inline-block;
        font-weight: bold;
        font-size: 12px;
        line-height: 14px;
        color: #13141A;
        margin-right: 4px;
        max-width: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lux-widget-dex-price-comparison__item-symbol {
        display: inline-block;
        font-size: 12px;
        line-height: 14px;
        color: #13141A;
        max-width: 34px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lux-widget-dex-price-comparison__item-loss {
        font-size: 12px;
        line-height: 14px;
      }
      .lux-widget-dex-price-comparison__item-loss.green {
        color: #00C087;
      }
      .lux-widget-dex-price-comparison__item-loss.red {
        color: #EC5151;
      }
      .lux-widget-dex-price-comparison__item.loading {
        background: linear-gradient(90deg, rgba(216, 223, 235, 0.55) 0%, rgba(216, 223, 235, 0.6) 95.31%);
        background-size: 400% 100%;
        -webkit-animation: lux-widget-dex-price-comparison-loading 1.4s ease infinite;
        animation: lux-widget-dex-price-comparison-loading 1.4s ease infinite;
      }
      .lux-widget-dex-price-comparison__item:nth-last-child(1) {
        margin-bottom: 0;
      }
      @keyframes lux-widget-dex-price-comparison-loading {
        0% {
          background-position: 100% 50%;
        }
      
        100% {
          background-position: 0 50%;
        }
      }
    `;
    if (document.readyState === "complete") {
      document.head.appendChild(style);
      this.currentRule.collector();
    }
    document.addEventListener("readystatechange", () => {
      if (document.readyState === 'complete') {
        document.head.appendChild(style);
        this.currentRule.collector();
      }
    });
    window.addEventListener("resize", this.handleResize);
  }

  static include = ["https://app.uniswap.org/#/swap"];

  siteRule: Record<string, SiteRuleItem> = {
    "https://app.uniswap.org/#/swap": {
      onHashChange: () => {
        try {
          const url = window.location.href;
          const query = query2obj(url);
          if (query.chain && query.chain === "mainnet" && isUrlMatched(url, DEXPriceComparison.include)) {
            this.enable = true;
            this.render();
          } else {
            this.enable = false;
            this.destory();
          }
        } catch (e) {
          console.error(e);
        }
      },
      collector: () => {
        window.addEventListener("hashchange", this.currentRule.onHashChange);
        this.currentRule.onHashChange();
        const oldFetch = window.fetch;
        window.fetch = (...args) => {
          const [request, options] = args;
          let url: string;
          let isQuoteRequest = false;
          if (typeof request === "string") {
            url = request;
          } else {
            url = request.url;
          }
          if (
            this.enable &&
            url.startsWith("https://api.uniswap.org/v1/quote")
          ) {
            isQuoteRequest = true;
          }
          return oldFetch(url, options).then((response) => {
            if (isQuoteRequest && response.ok) {
              response.json().then((data) => {
                const fromDecimals = new BigNumber(data.amount).div(
                  new BigNumber(data.amountDecimals)
                );
                const toDecimals = new BigNumber(data.quote).div(
                  new BigNumber(data.quoteDecimals)
                );
                const { tokenInAddress, tokenOutAddress, amount, type } = query2obj(
                  url
                ) as unknown as UniSwapParams;
                if (tokenInAddress && tokenOutAddress && this.enable) {
                  this.render();
                  this.handler({
                    from: tokenInAddress,
                    to: tokenOutAddress,
                    fromDecimals: fromDecimals.toNumber(),
                    toDecimals: toDecimals.toNumber(),
                    dexToAmount: data.quote,
                    amount,
                    type,
                  });
                }
              });
            }
            return response;
          });
        };
      },
    },
  };

  handleResize = throttle(() => {
    if (this.el && this.enable) {
      const main = document.querySelector("#swap-page").parentElement;
      const { right, top } = main.getBoundingClientRect();
      this.el.style.left = `${right + 16}px`;
      this.el.style.top = `${top}px`;
    }
  }, 500);

  render = (values?: {
    quotes: any;
    fromDecimals: number;
    toDecimals: number;
    amount: string;
  }) => {
    let content: HTMLDivElement;
    if (this.el) {
      content = this.el.querySelector(
        ".lux-widget-dex-price-comparison__content"
      );
    } else {
      const div = document.createElement("div");
      this.el = div;
      div.className = "lux-widget-dex-price-comparison";
      div.innerHTML = `
        <div class="lux-widget-dex-price-comparison__header">
          Prices elsewhere
        </div>
        <div class="lux-widget-dex-price-comparison__content">
        </div>
      `;
      content = div.querySelector(
        ".lux-widget-dex-price-comparison__content"
      );
      const main = document.querySelector("#swap-page").parentElement;
      const { right, top } = main.getBoundingClientRect();
      div.style.left = `${right + 16}px`;
      div.style.top = `${top}px`;
      document.querySelector("#root > div:nth-child(1)").appendChild(div);
    }
    content.innerHTML = "";
    if (values) {
      const fromSymbol = (
        document.querySelector(
          "#swap-currency-input .token-symbol-container"
        ) as HTMLSpanElement
      )?.innerText;
      const toSymbol = (
        document.querySelector(
          "#swap-currency-output .token-symbol-container"
        ) as HTMLSpanElement
      )?.innerText;
      values.quotes.forEach((quote) => {
        const el = document.createElement("div");
        el.className = "lux-widget-dex-price-comparison__item";
        if (quote.receive_token_amount) {
          const imgWrapper = document.createElement("div");
          imgWrapper.style.position = "relative";
          imgWrapper.innerHTML = `<img class="icon-dex" src=${quote.icon} />`;
          imgWrapper.addEventListener("mouseenter", () => {
            const popover = document.createElement("div");
            popover.className = "lux-widget-dex-price-comparison__popover";
            popover.innerText = quote.name;
            imgWrapper.appendChild(popover);
          });
          imgWrapper.addEventListener("mouseleave", () => {
            imgWrapper
              .querySelector(".lux-widget-dex-price-comparison__popover")
              ?.remove();
          });
          el.innerHTML = `
            <div class="flex-1">
              <span class="lux-widget-dex-price-comparison__item-amount" title="${new BigNumber(
                values.amount
              )
                .div(values.fromDecimals)
                .toFixed()}">${new BigNumber(values.amount)
            .div(values.fromDecimals)
            .toFixed()}</span>
              <span class="lux-widget-dex-price-comparison__item-symbol" title="${fromSymbol}">${fromSymbol}</span>
              <img class="icon-arrow" src="${iconArrow}" />
              <span class="lux-widget-dex-price-comparison__item-amount" title="${new BigNumber(
                quote.receive_token_amount
              )
                .div(values.toDecimals)
                .toFixed()}">${new BigNumber(quote.receive_token_amount)
            .div(values.toDecimals)
            .toFixed()}</span>
              <span class="lux-widget-dex-price-comparison__item-symbol" title="${toSymbol}">${toSymbol}</span>
            </div>
            <span class="lux-widget-dex-price-comparison__item-loss ${
              quote.ratio > 0 ? "green" : "red"
            }">${quote.ratio > 0 ? "+" : "-"} ${(
            Math.abs(quote.ratio)
          ).toFixed(2)}%</span>
          `;
          el.insertBefore(imgWrapper, el.firstChild);
        } else {
          el.innerHTML = `<img class="icon-dex" src=${quote.icon} /><span class="no-quote">No quotation</span>`;
        }
        content.appendChild(el);
      });
    } else {
      Dexs.forEach(() => {
        const el = document.createElement("div");
        el.className = "lux-widget-dex-price-comparison__item loading";
        content.appendChild(el);
      });
    }
  };

  handler = (values: {
    from: string;
    to: string;
    amount: string;
    fromDecimals: number;
    toDecimals: number;
    dexToAmount: string;
    type: UniSwapParams['type']
  }) => {
    const fromAmount = values.type === 'exactIn' ? values.amount : values.dexToAmount;
    const toAmount = values.type === 'exactIn' ? values.dexToAmount : values.amount;
    const fromTokenDecimals = values.type === 'exactIn' ? values.fromDecimals : values.toDecimals;
    const toTokenDecimals = values.type === 'exactIn' ? values.toDecimals : values.fromDecimals;
    const fromAddress = values.from;
    const toAddress = values.to;

    let quotes = Dexs.map((dex) =>
      fetch(
        `https://openapi.debank.com/v1/wallet/swap_check?${obj2query({
          chain_id: "eth",
          dex_id: dex.id,
          pay_token_id: fromAddress,
          pay_token_amount: fromAmount,
          receive_token_id: toAddress,
        })}`
      ).then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return response;
        }
      })
    );
    Promise.allSettled([...quotes]).then(
      ([res1inch, resParaswap, resMatcha]) => {
        if (!this.enable) return;
        quotes = [res1inch, resParaswap, resMatcha]
          .map((item, index) => {
            if (item.status === "fulfilled" && !('error_msg' in item.value)) {
              return {
                id: Dexs[index].id,
                name: Dexs[index].name,
                icon: Dexs[index].icon,
                ratio: new BigNumber(item.value.receive_token_amount).minus(new BigNumber(toAmount)).div(new BigNumber(toAmount)).toNumber() * 100,
                ...item.value,
              };
            } else {
              return {
                id: Dexs[index].id,
                name: Dexs[index].name,
                icon: Dexs[index].icon,
              };
            }
          })
          .sort((a, b) => {
            if ("ratio" in a && "ratio" in b) {
              return b.ratio - a.ratio;
            } else if ("ratio" in a) {
              return -1;
            } else if ("ratio" in b) {
              return 1;
            } else {
              return 0;
            }
          });
        this.render({
          quotes,
          fromDecimals: fromTokenDecimals,
          toDecimals: toTokenDecimals,
          amount: fromAmount,
        });
      }
    );
  };
  destory = () => {
    this.el?.remove();
    this.el = null;
  };
}
