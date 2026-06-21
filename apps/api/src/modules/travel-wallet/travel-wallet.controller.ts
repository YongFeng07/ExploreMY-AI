import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { TravelWalletService } from './travel-wallet.service';
import { SavingsCoachService } from './services/savings-coach.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('travel-wallet')
@Public()
export class TravelWalletController {
  constructor(
    private readonly walletService: TravelWalletService,
    private readonly coach: SavingsCoachService,
  ) {}

  /** Create a new travel savings goal */
  @Post('goals')
  async createGoal(@Body() body: {
    userId: string; tripName: string; destination: string;
    targetAmount: number; targetDate: string; description?: string;
    walletType?: string; coverPhoto?: string; tripDays?: number;
  }) {
    const goal = await this.walletService.createGoal(body);
    const days = body.tripDays || 3;
    // AI: Calculate savings plan
    const plan = this.coach.calculateSavingsPlan(body.targetAmount, new Date(body.targetDate));
    // AI: Estimate trip cost
    const estimate = this.coach.estimateTripCost(body.destination, days);
    // AI: Recommendations
    const tips = this.coach.generateRecommendations(body.targetAmount, plan.dailyTarget, body.destination);
    // AI: Milestones
    const milestones = this.coach.calculateMilestones(0, body.targetAmount);
    return { data: { ...goal, savingsPlan: plan, tripEstimate: estimate, aiTips: tips, milestones } };
  }

  /** Get user's goals */
  @Get('goals/user/:userId')
  async getUserGoals(@Param('userId') userId: string) {
    return { data: await this.walletService.getUserGoals(userId) };
  }

  /** Get single goal with full AI analysis */
  @Get('goals/:goalId')
  async getGoal(@Param('goalId') goalId: string) {
    const goal = await this.walletService.getGoal(goalId);
    if (!goal) return { error: 'Goal not found' };
    const plan = this.coach.calculateSavingsPlan(goal.targetAmount, new Date(goal.targetDate), goal.currentSavings);
    const milestones = this.coach.calculateMilestones(goal.currentSavings, goal.targetAmount);
    const tips = this.coach.generateRecommendations(goal.targetAmount, plan.dailyTarget, goal.destination);
    return { data: { ...goal, savingsPlan: plan, milestones, aiTips: tips } };
  }

  /** Add contribution */
  @Post('goals/:goalId/contribute')
  async contribute(@Param('goalId') goalId: string, @Body() body: { userId: string; amount: number; note?: string }) {
    return { data: await this.walletService.addContribution(goalId, body.userId, body.amount, body.note) };
  }

  /** Create couple wallet */
  @Post('couple')
  async createCoupleWallet(@Body() body: {
    goalId: string; partner1Id: string; partner2Id: string;
  }) {
    return { data: await this.walletService.createCoupleWallet(body) };
  }

  /** Get couple wallet status */
  @Get('couple/:goalId')
  async getCoupleWallet(@Param('goalId') goalId: string) {
    const wallet = await this.walletService.getCoupleWallet(goalId);
    if (!wallet) return { error: 'Couple wallet not found' };
    const goal = await this.walletService.getGoal(goalId);
    const daysLeft = goal ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now())/86400000) : 30;
    const scores = this.coach.calculateCoupleScore(wallet.partner1Savings, wallet.partner2Savings, goal?.targetAmount||0, daysLeft);
    return { data: { ...wallet, scores } };
  }

  /** Create group wallet */
  @Post('group')
  async createGroupWallet(@Body() body: {
    goalId: string; adminId: string; groupName: string; members: {name:string;userId:string}[];
  }) {
    return { data: await this.walletService.createGroupWallet(body) };
  }

  /** Get group wallet with leaderboard */
  @Get('group/:goalId')
  async getGroupWallet(@Param('goalId') goalId: string) {
    const wallet = await this.walletService.getGroupWallet(goalId);
    if (!wallet) return { error: 'Group wallet not found' };
    const goal = await this.walletService.getGoal(goalId);
    const members = (wallet.members || []) as any[];
    const readiness = this.coach.calculateGroupReadiness(members, goal?.targetAmount||0);
    return { data: { ...wallet, readiness } };
  }

  /** AI: Estimate trip cost */
  @Get('estimate')
  estimateTrip(@Query('destination') dest: string, @Query('days') days: string, @Query('style') style: string) {
    return { data: this.coach.estimateTripCost(dest||'Kuala Lumpur', parseInt(days||'3'), (style||'recommended') as any) };
  }

  /** AI: Calculate savings plan */
  @Get('savings-plan')
  savingsPlan(@Query('targetAmount') amount: string, @Query('targetDate') date: string, @Query('currentSavings') savings: string) {
    return { data: this.coach.calculateSavingsPlan(parseFloat(amount||'1000'), new Date(date||'2026-12-31'), parseFloat(savings||'0')) };
  }

  /** AI: Affordability score */
  @Get('affordability')
  affordability(@Query('monthlyIncome') income: string, @Query('targetAmount') amount: string, @Query('monthsUntilTrip') months: string, @Query('currentSavings') savings: string) {
    return { data: this.coach.calculateAffordabilityScore(parseFloat(income||'3000'), parseFloat(amount||'1000'), parseInt(months||'6'), parseFloat(savings||'0')) };
  }
}
