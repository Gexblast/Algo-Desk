// Simulated desk data engine.
// IMPORTANT: this is a self-contained simulator — it does NOT connect to any real
// exchange, broker, or proprietary firm's systems. "Dealer pressure" and OI walls
// here are randomized/derived synthetically for a personal demo dashboard, not
// pulled from or reverse-engineered from any real firm's actual data or algorithms.

function erf(x) {
  // Abramowitz & Stegun 7.1.26 approximation (accurate to ~1.5e-7)
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
const normCDF = x => 0.5 * (1 + erf(x / Math.sqrt(2)));
const normPDF = x => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

function blackScholesGreeks(S, K, T, r, sigma) {
  if (T <= 0 || sigma <= 0) return { delta: 0, gamma: 0, vega: 0, theta: 0 };
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const delta = normCDF(d1);
  const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T));
  const vega = S * normPDF(d1) * Math.sqrt(T) / 100; // per 1% IV move
  const theta = (-(S * normPDF(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365;
  return {
    delta: +delta.toFixed(4),
    gamma: +gamma.toFixed(5),
    vega: +vega.toFixed(4),
    theta: +theta.toFixed(4)
  };
}

class DataEngine {
  constructor(assets) {
    this.assets = assets || ['NIFTY', 'BANKNIFTY', 'SENSEX', 'XAUUSD'];
    this.state = {};
    for (const a of this.assets) {
      this.state[a] = {
        price: 100 + Math.random() * 50,
        iv: 0.18 + Math.random() * 0.1,
        dealerPressure: 0,
        callWallOffset: 40 + Math.random() * 60,
        putWallOffset: 40 + Math.random() * 60
      };
    }
  }

  stepDealerPressure(s) {
    // Bounded random walk so it drifts instead of jumping around uselessly
    s.dealerPressure = Math.max(-100, Math.min(100, s.dealerPressure + (Math.random() - 0.5) * 12));
    return s.dealerPressure;
  }

  tick(asset) {
    const s = this.state[asset];
    if (!s) return null;
    // small random walk on price/iv so consecutive ticks look continuous, not jumpy
    s.price = Math.max(1, s.price + (Math.random() - 0.5) * (s.price * 0.003));
    s.iv = Math.max(0.05, s.iv + (Math.random() - 0.5) * 0.004);
    const pressure = this.stepDealerPressure(s);

    const strike = Math.round(s.price / 10) * 10;
    const T = 7 / 365; // simulated ~weekly expiry
    const greeks = blackScholesGreeks(s.price, strike, T, 0.065, s.iv);

    return {
      asset,
      timestamp: Date.now(),
      price: +s.price.toFixed(2),
      iv: +s.iv.toFixed(4),
      volume: Math.floor(2000 + Math.random() * 40000),
      openInterest: Math.floor(50000 + Math.random() * 400000),
      greeks,
      dealerPressure: +pressure.toFixed(1),
      callWall: Math.round((s.price + s.callWallOffset) / 10) * 10,
      putWall: Math.round((s.price - s.putWallOffset) / 10) * 10,
      pcr: +(0.6 + Math.random() * 0.9).toFixed(2)
    };
  }

  snapshot() {
    return this.assets.map(a => this.tick(a));
  }
}

module.exports = DataEngine;
