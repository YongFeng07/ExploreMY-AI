import { Injectable } from '@nestjs/common';
import { SavingsCoachService } from './services/savings-coach.service';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'exploremy-data.json');

function loadWallet(): { goals: any[], coupleWallets: any[], groupWallets: any[] } {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      return { goals: raw.walletGoals || [], coupleWallets: raw.coupleWallets || [], groupWallets: raw.groupWallets || [] };
    }
  } catch(e) {}
  return { goals: [], coupleWallets: [], groupWallets: [] };
}

function saveWallet(goals: any[], coupleWallets: any[], groupWallets: any[]) {
  try {
    const existing = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) : {};
    existing.walletGoals = goals;
    existing.coupleWallets = coupleWallets;
    existing.groupWallets = groupWallets;
    fs.writeFileSync(DB_PATH, JSON.stringify(existing, null, 2));
  } catch(e) {}
}

const { goals, coupleWallets, groupWallets } = loadWallet();
// Expose globally for achievements service
(global as any).__walletGoals = goals;
// Periodic auto-save every 30 seconds
setInterval(() => { saveWallet(goals, coupleWallets, groupWallets); (global as any).__walletGoals = goals; }, 30000);

@Injectable()
export class TravelWalletService {
  constructor(private readonly coach: SavingsCoachService) {}

  async createGoal(input: {
    userId: string; tripName: string; destination: string;
    targetAmount: number; targetDate: string; description?: string;
    walletType?: string; coverPhoto?: string;
  }) {
    const now = new Date();
    const targetDate = input.targetDate ? new Date(input.targetDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const plan = this.coach.calculateSavingsPlan(input.targetAmount, targetDate);
    const estimate = this.coach.estimateTripCost(input.destination, 3);
    const milestones = this.coach.calculateMilestones(0, input.targetAmount);

    const goal = {
      id: `goal-${Date.now()}`,
      userId: input.userId,
      walletType: input.walletType || 'SOLO',
      tripName: input.tripName,
      destination: input.destination,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate ? new Date(input.targetDate).toISOString() : new Date(Date.now() + 90*24*60*60*1000).toISOString(),
      description: input.description || '',
      coverPhoto: input.coverPhoto || '',
      currentSavings: 0,
      remainingAmount: plan.remainingAmount,
      progressPct: 0,
      forecastDate: plan.forecastDate.toISOString(),
      dailyTarget: plan.dailyTarget,
      weeklyTarget: plan.weeklyTarget,
      monthlyTarget: plan.monthlyTarget,
      budgetFeasibility: plan.isFeasible ? 100 : 50,
      affordabilityScore: 50,
      estimatedTripCost: estimate.totalCost,
      recommendedBudget: estimate.totalCost,
      accommodationEst: estimate.accommodation,
      transportEst: estimate.transport,
      foodEst: estimate.food,
      activitiesEst: estimate.activities,
      status: 'ACTIVE',
      currency: 'MYR',
      milestones: milestones.milestones,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    goals.unshift(goal); saveWallet(goals, coupleWallets, groupWallets);
    return goal;
  }

  async getUserGoals(userId: string) {
    return goals.filter(g => g.userId === userId);
  }

  async getGoal(goalId: string) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return null;
    const plan = this.coach.calculateSavingsPlan(goal.targetAmount, new Date(goal.targetDate), goal.currentSavings);
    const milestones = this.coach.calculateMilestones(goal.currentSavings, goal.targetAmount);
    return { ...goal, savingsPlan: plan, milestones: Array.isArray(milestones.milestones) ? milestones.milestones : [], progressPct: milestones.pct };
  }

  async addContribution(goalId: string, userId: string, amount: number, note?: string) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return null;
    goal.currentSavings = (goal.currentSavings || 0) + amount;
    goal.remainingAmount = Math.max(0, goal.targetAmount - goal.currentSavings);
    goal.progressPct = Math.round((goal.currentSavings / goal.targetAmount) * 100);
    goal.updatedAt = new Date().toISOString();

    // Check milestones
    const pct = goal.progressPct;
    if (pct >= 25 && !goal.milestones?.find((m:any)=>m.milestone===25)?.reached) {
      goal.milestones = goal.milestones?.map((m:any)=> m.milestone===25 ? {...m,reached:true} : m);
    }
    if (pct >= 50 && !goal.milestones?.find((m:any)=>m.milestone===50)?.reached) {
      goal.milestones = goal.milestones?.map((m:any)=> m.milestone===50 ? {...m,reached:true} : m);
    }
    if (pct >= 75 && !goal.milestones?.find((m:any)=>m.milestone===75)?.reached) {
      goal.milestones = goal.milestones?.map((m:any)=> m.milestone===75 ? {...m,reached:true} : m);
    }
    if (pct >= 100) {
      goal.milestones = goal.milestones?.map((m:any)=> m.milestone===100 ? {...m,reached:true} : m);
      goal.status = 'COMPLETED';
    }

    const plan = this.coach.calculateSavingsPlan(goal.targetAmount, new Date(goal.targetDate), goal.currentSavings);
    goal.dailyTarget = plan.dailyTarget;
    goal.forecastDate = plan.forecastDate.toISOString();

    return goal;
  }

  async createCoupleWallet(input: { goalId: string; partner1Id: string; partner2Id: string }) {
    const wallet = {
      id: `couple-${Date.now()}`,
      goalId: input.goalId,
      partner1Id: input.partner1Id,
      partner2Id: input.partner2Id,
      partner1Savings: 0,
      partner2Savings: 0,
      combinedSavings: 0,
      monthlySavings: 0,
      loveProgress: 50,
      travelReadiness: 0,
      daysUntilTrip: null,
      milestone25: false, milestone50: false, milestone75: false, milestone100: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    coupleWallets.push(wallet);
    // Update goal to COUPLE type
    const goal = goals.find(g => g.id === input.goalId);
    if (goal) goal.walletType = 'COUPLE';
    return wallet;
  }

  async getCoupleWallet(goalId: string) {
    return coupleWallets.find(w => w.goalId === goalId) || null;
  }

  async createGroupWallet(input: { goalId: string; adminId: string; groupName: string; members: {name:string;userId:string}[] }) {
    const wallet = {
      id: `group-${Date.now()}`,
      goalId: input.goalId,
      adminId: input.adminId,
      groupName: input.groupName,
      members: input.members.map(m => ({...m, contribution: 0})),
      totalTarget: 0,
      totalContributed: 0,
      remainingBalance: 0,
      memberCount: input.members.length,
      tripReadiness: 0,
      leaderboard: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    groupWallets.push(wallet);
    const goal = goals.find(g => g.id === input.goalId);
    if (goal) { wallet.totalTarget = goal.targetAmount; wallet.remainingBalance = goal.targetAmount; goal.walletType = 'GROUP'; }
    return wallet;
  }

  async getGroupWallet(goalId: string) {
    return groupWallets.find(w => w.goalId === goalId) || null;
  }
}
