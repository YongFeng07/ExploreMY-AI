import { Injectable } from '@nestjs/common';

// ═══════════════════════════════════════════════════════════════════
// DESTINATION COST DATABASE — Real estimated costs (MYR)
// ═══════════════════════════════════════════════════════════════════

interface DestinationCost {
  accommodation: number; transport: number; food: number; activities: number;
  totalPerDay: number; minTotal: number; recommendedBudget: number; luxuryBudget: number;
}

const DESTINATION_COSTS: Record<string, DestinationCost> = {
  'Kuala Lumpur': {accommodation:120,transport:30,food:50,activities:60,totalPerDay:260,minTotal:500,recommendedBudget:800,luxuryBudget:2000},
  'Penang': {accommodation:100,transport:25,food:40,activities:50,totalPerDay:215,minTotal:400,recommendedBudget:700,luxuryBudget:1800},
  'Langkawi': {accommodation:150,transport:40,food:60,activities:80,totalPerDay:330,minTotal:600,recommendedBudget:1000,luxuryBudget:2500},
  'Melaka': {accommodation:80,transport:20,food:35,activities:40,totalPerDay:175,minTotal:300,recommendedBudget:500,luxuryBudget:1200},
  'Johor Bahru': {accommodation:90,transport:25,food:40,activities:50,totalPerDay:205,minTotal:350,recommendedBudget:600,luxuryBudget:1500},
  'Kota Kinabalu': {accommodation:130,transport:45,food:55,activities:90,totalPerDay:320,minTotal:700,recommendedBudget:1200,luxuryBudget:2800},
  'Kuching': {accommodation:100,transport:35,food:40,activities:70,totalPerDay:245,minTotal:500,recommendedBudget:800,luxuryBudget:2000},
  'Cameron Highlands': {accommodation:90,transport:20,food:35,activities:40,totalPerDay:185,minTotal:350,recommendedBudget:550,luxuryBudget:1300},
  'Bangkok': {accommodation:100,transport:20,food:30,activities:50,totalPerDay:200,minTotal:800,recommendedBudget:1500,luxuryBudget:3500},
  'Singapore': {accommodation:300,transport:50,food:80,activities:100,totalPerDay:530,minTotal:1200,recommendedBudget:2500,luxuryBudget:6000},
  'Bali': {accommodation:120,transport:35,food:40,activities:70,totalPerDay:265,minTotal:1000,recommendedBudget:2000,luxuryBudget:5000},
  'Tokyo': {accommodation:350,transport:80,food:100,activities:120,totalPerDay:650,minTotal:3000,recommendedBudget:5000,luxuryBudget:12000},
  'Seoul': {accommodation:200,transport:40,food:60,activities:70,totalPerDay:370,minTotal:1800,recommendedBudget:3000,luxuryBudget:7000},
  'London': {accommodation:500,transport:100,food:150,activities:150,totalPerDay:900,minTotal:5000,recommendedBudget:8000,luxuryBudget:20000},
  'Paris': {accommodation:450,transport:80,food:130,activities:140,totalPerDay:800,minTotal:4500,recommendedBudget:7500,luxuryBudget:18000},
};

// Default fallback
const DEFAULT_COST: DestinationCost = {accommodation:150,transport:35,food:50,activities:60,totalPerDay:295,minTotal:600,recommendedBudget:1000,luxuryBudget:2500};

@Injectable()
export class SavingsCoachService {
  /** Estimate trip cost for a destination */
  estimateTripCost(destination: string, days: number, style: 'budget'|'recommended'|'luxury' = 'recommended'): {
    accommodation: number; transport: number; food: number; activities: number;
    totalPerDay: number; totalCost: number; currency: string;
  } {
    const costs = DESTINATION_COSTS[destination] || DEFAULT_COST;
    const multiplier = style === 'budget' ? 0.6 : style === 'luxury' ? 2.0 : 1.0;
    const totalPerDay = Math.round(costs.totalPerDay * multiplier);
    return {
      accommodation: Math.round(costs.accommodation * multiplier * days),
      transport: Math.round(costs.transport * multiplier * days),
      food: Math.round(costs.food * multiplier * days),
      activities: Math.round(costs.activities * multiplier * days),
      totalPerDay,
      totalCost: Math.round(totalPerDay * days),
      currency: 'MYR',
    };
  }

  /** Calculate savings plan */
  calculateSavingsPlan(targetAmount: number, targetDate: Date, currentSavings: number = 0): {
    remainingAmount: number;
    daysUntilTarget: number;
    dailyTarget: number;
    weeklyTarget: number;
    monthlyTarget: number;
    forecastDate: Date;
    isFeasible: boolean;
    feasibilityNote: string;
  } {
    const now = new Date();
    const daysUntilTarget = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / 86400000));
    const remainingAmount = Math.max(0, targetAmount - currentSavings);
    const dailyTarget = Math.round((remainingAmount / daysUntilTarget) * 100) / 100;
    const weeklyTarget = Math.round(dailyTarget * 7 * 100) / 100;
    const monthlyTarget = Math.round(dailyTarget * 30 * 100) / 100;

    // Forecast: if saving at dailyTarget rate, when will we reach the goal?
    const forecastDays = dailyTarget > 0 ? Math.ceil(remainingAmount / dailyTarget) : daysUntilTarget;
    const forecastDate = new Date(now.getTime() + forecastDays * 86400000);

    // Feasibility check
    const isFeasible = forecastDate <= targetDate;
    const feasibilityNote = isFeasible
      ? `✅ On track! At RM ${dailyTarget}/day, you'll reach your goal by ${forecastDate.toLocaleDateString('en-MY',{month:'short',day:'numeric',year:'numeric'})}.`
      : `⚠️ At RM ${dailyTarget}/day, you'll reach your goal by ${forecastDate.toLocaleDateString('en-MY',{month:'short',day:'numeric',year:'numeric'})} — ${Math.ceil((forecastDate.getTime()-targetDate.getTime())/86400000)} days after your target. Increase savings to RM ${Math.round((remainingAmount/daysUntilTarget)*100)/100}/day to meet your deadline.`;

    return { remainingAmount, daysUntilTarget, dailyTarget, weeklyTarget, monthlyTarget, forecastDate, isFeasible, feasibilityNote };
  }

  /** Calculate travel affordability score (0-100) */
  calculateAffordabilityScore(monthlyIncome: number, targetAmount: number, monthsUntilTrip: number, currentSavings: number): {
    score: number; level: string; analysis: string;
  } {
    const monthlySavingsNeeded = (targetAmount - currentSavings) / Math.max(1, monthsUntilTrip);
    const savingsRate = monthlySavingsNeeded / Math.max(1, monthlyIncome);
    const score = Math.round(Math.max(0, Math.min(100, 100 - savingsRate * 100)));

    const level = score >= 80 ? 'Very Affordable' : score >= 60 ? 'Manageable' : score >= 40 ? 'Stretching' : score >= 20 ? 'Challenging' : 'Currently Unaffordable';
    const analysis = score >= 80
      ? `Excellent! RM ${Math.round(monthlySavingsNeeded)}/month is only ${Math.round(savingsRate*100)}% of your income. You can comfortably save for this trip.`
      : score >= 60
      ? `Good. RM ${Math.round(monthlySavingsNeeded)}/month is ${Math.round(savingsRate*100)}% of income — manageable with some adjustments.`
      : score >= 40
      ? `Tight. RM ${Math.round(monthlySavingsNeeded)}/month is ${Math.round(savingsRate*100)}% of income. Consider a longer timeline or budget destination.`
      : `RM ${Math.round(monthlySavingsNeeded)}/month is ${Math.round(savingsRate*100)}% of income — this would be very difficult. We recommend adjusting your target or extending the timeline.`;

    return { score, level, analysis };
  }

  /** Generate AI savings recommendations */
  generateRecommendations(targetAmount: number, dailyTarget: number, destination: string): string[] {
    const tips: string[] = [
      `💰 Set up auto-transfer of RM ${Math.round(dailyTarget)}/day to your Travel Wallet`,
      `📊 Track progress weekly — small wins compound into big results`,
      `☕ Skip RM 15 daily coffee = RM ${Math.round(15*30)}/month saved`,
      `🍜 Cook at home 3x/week = save ~RM ${Math.round(20*12)}/month on food delivery`,
      `🚗 Use public transit 2x/week = save ~RM ${Math.round(15*8)}/month on parking + fuel`,
    ];

    if (dailyTarget > 50) {
      tips.push(`💼 Consider a side hustle: freelance, tutoring, or selling unused items — can add RM 200-500/month`);
    }
    if (dailyTarget > 100) {
      tips.push(`🏦 Look into high-yield savings accounts — even 3% annual interest helps on large goals`);
    }

    tips.push(`🎯 Visualize ${destination}: keep a photo as your phone wallpaper for daily motivation`);
    tips.push(`📱 Use the ExploreMY app to track flight + hotel price drops for ${destination}`);

    return tips;
  }

  /** Calculate milestones */
  calculateMilestones(currentSavings: number, targetAmount: number): {
    pct: number; milestones: { milestone: number; title: string; badgeEmoji: string; reached: boolean; remaining: number }[];
  } {
    const pct = targetAmount > 0 ? Math.round((currentSavings / targetAmount) * 100) : 0;
    const milestones = [
      {milestone:25,title:'First Quarter — Momentum Builder',badgeEmoji:'🌱',reached:false,remaining:0},
      {milestone:50,title:'Halfway There — Steady Progress',badgeEmoji:'🏃',reached:false,remaining:0},
      {milestone:75,title:'Final Stretch — Almost There',badgeEmoji:'🚀',reached:false,remaining:0},
      {milestone:100,title:'Goal Achieved — Trip Ready!',badgeEmoji:'🏆',reached:false,remaining:0},
    ];

    for (const m of milestones) {
      m.reached = pct >= m.milestone;
      m.remaining = m.reached ? 0 : Math.round((targetAmount * m.milestone / 100) - currentSavings);
    }

    return { pct, milestones };
  }

  /** Calculate couple wallet "Love Progress" score */
  calculateCoupleScore(partner1Savings: number, partner2Savings: number, targetAmount: number, daysLeft: number): {
    loveProgress: number; travelReadiness: number; combinedSavings: number; progressPct: number;
    message: string;
  } {
    const combinedSavings = partner1Savings + partner2Savings;
    const progressPct = targetAmount > 0 ? Math.round((combinedSavings / targetAmount) * 100) : 0;
    const contributionBalance = Math.abs(partner1Savings - partner2Savings) / Math.max(1, combinedSavings);
    const loveProgress = Math.round(100 - contributionBalance * 50);
    const travelReadiness = Math.round((progressPct * 0.7) + (loveProgress * 0.3));

    const message = loveProgress >= 80
      ? '💕 Beautiful teamwork! Your contributions are perfectly balanced.'
      : loveProgress >= 60
      ? '🤝 Great partnership! Small adjustment could balance things perfectly.'
      : '💪 One partner is carrying more — consider rebalancing to share the journey equally.';

    return { loveProgress, travelReadiness, combinedSavings, progressPct, message };
  }

  /** Calculate group wallet readiness */
  calculateGroupReadiness(members: {name:string;contribution:number}[], targetAmount: number): {
    totalContributed: number; progressPct: number; leaderboard: {name:string;contribution:number;pct:number}[];
    remainingBalance: number; tripReadiness: number;
  } {
    const totalContributed = members.reduce((s,m) => s + m.contribution, 0);
    const progressPct = targetAmount > 0 ? Math.round((totalContributed / targetAmount) * 100) : 0;
    const maxContrib = Math.max(1, ...members.map(m => m.contribution));
    const leaderboard = members
      .map(m => ({...m, pct: Math.round((m.contribution / maxContrib) * 100)}))
      .sort((a,b) => b.contribution - a.contribution);
    const remainingBalance = Math.max(0, targetAmount - totalContributed);
    const avgContribution = totalContributed / Math.max(1, members.length);
    const fairness = 1 - (Math.max(...members.map(m=>m.contribution),1) - Math.min(...members.map(m=>m.contribution),0)) / Math.max(1, avgContribution);
    const tripReadiness = Math.round((progressPct * 0.6) + (Math.max(0, fairness) * 40));

    return { totalContributed, progressPct, leaderboard, remainingBalance, tripReadiness };
  }
}
