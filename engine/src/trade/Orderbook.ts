import { BASE_CURRENCY } from "./Engine";

export interface Order {
  price: number;
  quantity: number;
  orderId: string;
  filled: number;
  side: "buy" | "sell";
  userId: string;
}

export interface Fill {
  price: string;
  qty: number;
  tradeId: number;
  otherUserId: string;
  markerOrderId: string;
}

export class Orderbook {
  bids: Order[];
  asks: Order[];
  baseAsset: string;
  quoteAsset: string = BASE_CURRENCY;
  lastTradeId: number;
  currentPrice: number;

  constructor(
    baseAsset: string,
    bids: Order[],
    asks: Order[],
    lastTradeId: number,
    currentPrice: number
  ) {
    this.bids = bids;
    this.asks = asks;
    this.baseAsset = baseAsset;
    this.lastTradeId = lastTradeId || 0;
    this.currentPrice = currentPrice || 0;
  }

  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  getSnapshot() {
    return {
      baseAsset: this.baseAsset,
      bids: this.bids,
      asks: this.asks,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
    };
  }

  addOrder(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    if (order.side === "buy") {
      const { executedQty, fills } = this.matchBid(order);
      order.quantity -= executedQty;

      if (order.quantity > 0) {
        // Add remaining quantity to bids
        this.bids.push(order);
        // Sort bids in descending order
        this.bids.sort((a, b) => b.price - a.price);
      }

      return { executedQty, fills };
    } else {
      const { executedQty, fills } = this.matchAsk(order);
      order.quantity -= executedQty; // Deduct executed quantity from the order

      if (order.quantity > 0) {
        // Add remaining quantity to asks
        this.asks.push(order);
        // Sort asks in ascending order
        this.asks.sort((a, b) => a.price - b.price);
      }

      return { executedQty, fills };
    }
  }

  matchBid(order: Order): { fills: Fill[]; executedQty: number } {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.asks.length; i++) {
      const ask = this.asks[i];
      if (ask && ask.price <= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(order.quantity - executedQty, ask.quantity);
        executedQty += filledQty;
        ask.filled += filledQty;

        fills.push({
          price: Math.min(ask.price, order.price).toString(),
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: ask.userId,
          markerOrderId: ask.orderId,
        });

        ask.quantity -= filledQty;

        if (executedQty >= order.quantity) break;
      }
    }

    return { fills, executedQty };
  }

  matchAsk(order: Order): { fills: Fill[]; executedQty: number } {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.bids.length; i++) {
      const bid = this.bids[i];
      if (bid && bid.price >= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(order.quantity - executedQty, bid.quantity);
        executedQty += filledQty;
        bid.filled += filledQty;

        fills.push({
          price: Math.max(bid.price, order.price).toString(),
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: bid.userId,
          markerOrderId: bid.orderId,
        });

        bid.quantity -= filledQty;

        if (executedQty >= order.quantity) break;
      }
    }

    return { fills, executedQty };
  }

  getDepth() {
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];

    const bidsObj: { [key: string]: number } = {};
    const asksObj: { [key: string]: number } = {};

    for (let i = 0; i < this.bids.length; i++) {
      const order = this.bids[i];
      if (!bidsObj[order.price]) {
        bidsObj[order.price] = 0;
      }
      bidsObj[order.price] += order.quantity;
    }

    for (let i = 0; i < this.asks.length; i++) {
      const order = this.asks[i];
      if (!asksObj[order.price]) {
        asksObj[order.price] = 0;
      }
      asksObj[order.price] += order.quantity;
    }

    for (const price in bidsObj) {
      bids.push([price, bidsObj[price].toString()]);
    }

    for (const price in asksObj) {
      asks.push([price, asksObj[price].toString()]);
    }

    return {
      bids,
      asks,
    };
  }

  getOpenOrders(userId: string): Order[] {
    const asks = this.asks.filter((x) => x.userId === userId);
    const bids = this.bids.filter((x) => x.userId === userId);
    return [...asks, ...bids];
  }

  cancelBid(order: Order) {
    const index = this.bids.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.bids[index].price;
      this.bids.splice(index, 1);
      return price;
    }
  }

  cancelAsk(order: Order) {
    const index = this.asks.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.asks[index].price;
      this.asks.splice(index, 1);
      return price;
    }
  }
}
