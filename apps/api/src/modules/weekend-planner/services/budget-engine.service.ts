import { Injectable } from '@nestjs/common';
import { WeekendPlanInput, AIWeekendPlanOutput, BudgetBreakdownOutput, CostLineItem } from '../interfaces/weekend-plan.interface';
import {
  FUEL_PRICES_MYR, FUEL_CONSUMPTION, VehicleType,
  estimateParkingCost,
  getMealCost, MealType,
  getHotelCost, StyleTier,
  getTicketPrice,
} from '../constants';

interface FullCostBreakdown {
  fuel: { totalDistanceKm: number; fuelType: string; pricePerLiter: number; litersUsed: number; totalCost: number };
  toll: { totalCost: number; routes: { name: string; cost: number }[] };
  parking: { totalCost: number; locationCount: number };
  hotel: { estimatedCost: number; nightsCount: number; suggestions: { name: string; price: number; rating: number }[]; hotelOptions?: any[] };
  food: { estimatedCost: number; mealCount: number; perPersonPerMeal: number };
  tickets: { estimatedCost: number; attractions: { name: string; price: number; quantity: number }[] };
  transport: { estimatedCost: number; segments: number };
  emergencyBuffer: { estimatedCost: number; percentage: number };
  subtotal: number;
  grandTotal: number;
  budgetUtilization: number;
  isWithinBudget: boolean;
}

@Injectable()
export class BudgetEngineService {
  /**
   * Calculate full cost breakdown for a weekend plan.
   */
  calculate(input: WeekendPlanInput, plan: AIWeekendPlanOutput): FullCostBreakdown {
    const city = this.normalizeCity(input.destination);
    const groupType = input.groupType.toLowerCase();
    const styleTier: StyleTier = input.travelStyles.includes('LUXURY') ? 'luxury' :
                                  input.travelStyles.includes('BUDGET') ? 'budget' : 'midRange';
    const dayCount = plan.days.length;
    const groupSize = input.groupSize || 1;
    const isDriving = input.transportMode === 'DRIVING' || input.transportMode === 'MOTORCYCLE';

    // ── 1. Fuel ──
    const totalDistanceKm = plan.days.reduce((sum, day) =>
      sum + day.stops.reduce((s, stop) => s + (stop.transportFromPrev?.distanceMeters ?? 0), 0), 0) / 1000;
    const fuel = isDriving ? this.calculateFuel(totalDistanceKm, input.transportMode === 'MOTORCYCLE' ? 'motorcycle' : 'car_midsize') : this.zeroFuel();

    // ── 2. Tolls ──
    const toll = isDriving ? { totalCost: dayCount > 1 ? 15 : 0, routes: [{ name: 'Estimated highway tolls', cost: dayCount > 1 ? 15 : 0 }] } : { totalCost: 0, routes: [] };

    // ── 3. Parking ──
    const stopCount = plan.days.reduce((s, d) => s + d.stops.length, 0);
    const parking = isDriving ? { totalCost: estimateParkingCost(city, stopCount), locationCount: Math.ceil(stopCount * 0.6) } : { totalCost: 0, locationCount: 0 };

    // ── 4. Hotel ──
    const nightsCount = Math.max(1, dayCount - 1);
    const hotelCost = getHotelCost(city, groupType, styleTier) * nightsCount;
    const hotel = { estimatedCost: hotelCost, nightsCount, suggestions: [{ name: 'Recommended accommodation', price: hotelCost / nightsCount, rating: 4.2 }] };

    // ── 5. Food ──
    const food = this.calculateFood(city, plan, groupSize, styleTier);

    // ── 6. Tickets ──
    const tickets = this.calculateTickets(city, plan, groupSize);

    // ── 7. Transport (Grab/Bus/KTM/ETS) ──
    const transport = isDriving ? { estimatedCost: 0, segments: 0 } : this.calculateGrabCost(plan, groupSize);

    // ── 8. Emergency buffer ──
    const subtotal = fuel.totalCost + toll.totalCost + parking.totalCost + hotel.estimatedCost + food.estimatedCost + tickets.estimatedCost + transport.estimatedCost;
    const emergencyPct = 12.5;
    const emergencyBuffer = { estimatedCost: Math.round(subtotal * emergencyPct / 100 * 100) / 100, percentage: emergencyPct };
    const grandTotal = subtotal + emergencyBuffer.estimatedCost;

    return {
      fuel, toll, parking, hotel, food, tickets, transport, emergencyBuffer,
      subtotal: Math.round(subtotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      budgetUtilization: grandTotal / input.budget,
      isWithinBudget: grandTotal <= input.budget,
    };
  }

  /**
   * Convert internal breakdown to API response format.
   */
  toBudgetResponse(breakdown: FullCostBreakdown, currency: string): BudgetBreakdownOutput {
    const total = breakdown.grandTotal;
    const pct = (cost: number) => Math.round((cost / total) * 10000) / 100;
    const line = (cost: number, label: string): CostLineItem => ({
      estimatedCost: Math.round(cost * 100) / 100,
      label,
      percentage: pct(cost),
    });

    return {
      fuel: line(breakdown.fuel.totalCost, 'Fuel'),
      toll: line(breakdown.toll.totalCost, 'Toll'),
      parking: line(breakdown.parking.totalCost, 'Parking'),
      hotel: { ...line(breakdown.hotel.estimatedCost, 'Hotel'), suggestions: breakdown.hotel.suggestions },
      food: { ...line(breakdown.food.estimatedCost, 'Food & Drink'), mealCount: breakdown.food.mealCount, perPersonPerMeal: breakdown.food.perPersonPerMeal },
      tickets: { ...line(breakdown.tickets.estimatedCost, 'Tickets'), attractions: breakdown.tickets.attractions },
      transport: { ...line(breakdown.transport.estimatedCost, 'Transport'), segments: breakdown.transport.segments },
      emergencyBuffer: { ...line(breakdown.emergencyBuffer.estimatedCost, 'Emergency Buffer'), percentage: breakdown.emergencyBuffer.percentage },
      total: Math.round(total * 100) / 100,
      currency,
      budgetUtilization: Math.round(breakdown.budgetUtilization * 100) / 100,
      isWithinBudget: breakdown.isWithinBudget,
    };
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private calculateFuel(distanceKm: number, vehicleType: VehicleType) {
    if (distanceKm === 0) return this.zeroFuel();
    const consumption = FUEL_CONSUMPTION[vehicleType] ?? FUEL_CONSUMPTION['car_midsize']!;
    const pricePerLiter = FUEL_PRICES_MYR.RON95;
    const litersUsed = (distanceKm / 100) * consumption;
    return {
      totalDistanceKm: Math.round(distanceKm * 10) / 10,
      fuelType: 'RON95' as const,
      pricePerLiter,
      litersUsed: Math.round(litersUsed * 10) / 10,
      totalCost: Math.round(litersUsed * pricePerLiter * 100) / 100,
    };
  }

  private zeroFuel() {
    return { totalDistanceKm: 0, fuelType: 'RON95' as const, pricePerLiter: 0, litersUsed: 0, totalCost: 0 };
  }

  private calculateFood(city: string, plan: AIWeekendPlanOutput, groupSize: number, styleTier: StyleTier) {
    let totalFoodCost = 0;
    let mealCount = 0;

    const mealCategoryMap: Record<string, MealType> = {
      'BREAKFAST': 'breakfast',
      'BRUNCH': 'breakfast',
      'LUNCH': 'lunch',
      'CAFE_STOP': 'cafe',
      'DINNER': 'dinner',
      'SUPPER': 'supper',
    };

    for (const day of plan.days) {
      for (const stop of day.stops) {
        const mealType = mealCategoryMap[stop.category] ?? 'lunch';
        const perPerson = stop.estimatedSpend > 0 ? stop.estimatedSpend : getMealCost(city, mealType, styleTier);
        totalFoodCost += perPerson * groupSize;
        mealCount++;
      }
    }

    return {
      estimatedCost: Math.round(totalFoodCost * 100) / 100,
      mealCount,
      perPersonPerMeal: mealCount > 0 ? Math.round((totalFoodCost / mealCount / groupSize) * 100) / 100 : 0,
    };
  }

  private calculateTickets(city: string, plan: AIWeekendPlanOutput, groupSize: number) {
    let totalTickets = 0;
    const attractions: { name: string; price: number; quantity: number }[] = [];

    for (const day of plan.days) {
      for (const stop of day.stops) {
        const entryFee = stop.entryFee ?? getTicketPrice(city, stop.placeName);
        if (entryFee > 0) {
          totalTickets += entryFee * groupSize;
          attractions.push({ name: stop.placeName, price: entryFee, quantity: groupSize });
        }
      }
    }

    return { estimatedCost: Math.round(totalTickets * 100) / 100, attractions };
  }

  private calculateGrabCost(plan: AIWeekendPlanOutput, groupSize: number) {
    let total = 0;
    let segments = 0;

    for (const day of plan.days) {
      for (const stop of day.stops) {
        const t = stop.transportFromPrev;
        if (t && (t.mode === 'GRAB' || t.mode === 'DRIVING' || t.mode === 'BUS' || t.mode === 'KTM' || t.mode === 'ETS')) {
          total += t.estimatedCost;
          segments++;
        }
      }
    }

    return { estimatedCost: Math.round(total * 100) / 100, segments };
  }

  private normalizeCity(dest: string): string {
    const d = dest.toLowerCase();
    if (d.includes('penang') || d.includes('george')) return 'Penang';
    if (d.includes('kl') || d.includes('kuala lumpur')) return 'Kuala Lumpur';
    if (d.includes('melaka') || d.includes('malacca')) return 'Melaka';
    if (d.includes('langkawi')) return 'Langkawi';
    if (d.includes('cameron')) return 'Cameron Highlands';
    if (d.includes('jb') || d.includes('johor')) return 'Johor Bahru';
    if (d.includes('ipoh')) return 'Ipoh';
    if (d.includes('kk') || d.includes('kinabalu')) return 'Kota Kinabalu';
    if (d.includes('kuching')) return 'Kuching';
    if (d.includes('kuantan')) return 'Kuantan';
    if (d.includes('putrajaya')) return 'Putrajaya';
    return dest;
  }
}
