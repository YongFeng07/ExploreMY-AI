import { Injectable } from '@nestjs/common';
@Injectable()
export class TransportService {
  getOptions(originLat: number, originLng: number, destLat: number, destLng: number) {
    const d = Math.max(1, Math.sqrt((destLat - originLat)**2 + (destLng - originLng)**2) * 111);
    return { data: [
      { mode: '🚶 Walking', durationMin: Math.round(d/5*60), cost: 0, available: d <= 3 },
      { mode: '🚕 Grab', durationMin: Math.round(d/30*60)+3, cost: Math.round(5+d*1.5), available: true },
      { mode: '🚗 Drive', durationMin: Math.round(d/35*60), cost: Math.round(d*0.4), available: true },
      { mode: '🚇 LRT/MRT', durationMin: Math.round(d/40*60)+8, cost: Math.round(3+d*0.3), available: d <= 80 },
      { mode: '🚂 KTM', durationMin: Math.round(d/50*60)+12, cost: Math.round(5+d*0.2), available: d >= 5 },
      { mode: '🚄 ETS', durationMin: Math.round(d/120*60)+20, cost: Math.round(25+d*0.1), available: d >= 50 },
      { mode: '✈️ Flight', durationMin: 60, cost: Math.round(100+d*0.08), available: d >= 200 },
      { mode: '⛴️ Ferry', durationMin: Math.round(d/20*60)+15, cost: Math.round(12+d*0.3), available: d <= 50 },
    ]};
  }
}
