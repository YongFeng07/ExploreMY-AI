import { create } from 'zustand';

export interface WeekendPlannerInput {
  destination: string;
  destinationLat: number;
  destinationLng: number;
  startDate: string;
  endDate: string;
  planType: string;
  budget: number;
  budgetCurrency: string;
  transportMode: string;
  groupType: string;
  travelStyles: string[];
  specialPreferences: string[];
  groupSize: number;
}

interface GenerationStep {
  label: string;
  done: boolean;
}

interface WeekendPlannerState {
  // Input form
  input: WeekendPlannerInput | null;
  setInput: (input: WeekendPlannerInput) => void;

  // Generation state
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  steps: GenerationStep[];
  startGeneration: () => void;
  updateProgress: (stepIndex: number, stepLabel: string) => void;
  setGenerating: (v: boolean) => void;

  // Result
  plan: any | null;
  setPlan: (plan: any) => void;

  // UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeDay: number;
  setActiveDay: (day: number) => void;

  // Stop detail modal
  selectedStop: any | null;
  setSelectedStop: (stop: any | null) => void;

  // Reset
  resetToInput: () => void;
}

const LOADING_STEPS: GenerationStep[] = [
  { label: 'Analyzing places in your destination', done: false },
  { label: 'Matching your travel style preferences', done: false },
  { label: 'Calculating optimal routes', done: false },
  { label: 'Checking weather forecast', done: false },
  { label: 'Finding hidden gems locals love', done: false },
  { label: 'Estimating costs with real-time prices', done: false },
  { label: 'Finalizing your itinerary', done: false },
];

export const useWeekendPlannerStore = create<WeekendPlannerState>((set) => ({
  input: null,
  setInput: (input) => set({ input }),

  isGenerating: false,
  progress: 0,
  currentStep: '',
  steps: LOADING_STEPS.map(s => ({ ...s })),
  startGeneration: () =>
    set({
      isGenerating: true,
      progress: 0,
      currentStep: LOADING_STEPS[0]!.label,
      steps: LOADING_STEPS.map(s => ({ ...s })),
      plan: null,
    }),
  updateProgress: (stepIndex, stepLabel) =>
    set((state) => {
      const steps = state.steps.map((s, i) =>
        i <= stepIndex ? { ...s, done: true } : s,
      );
      return {
        progress: Math.round(((stepIndex + 1) / steps.length) * 100),
        currentStep: stepLabel,
        steps,
      };
    }),
  setGenerating: (v) => set({ isGenerating: v }),

  plan: null,
  setPlan: (plan) => set({ plan, isGenerating: false, progress: 100 }),

  activeTab: 'timeline',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeDay: 1,
  setActiveDay: (day) => set({ activeDay: day }),

  selectedStop: null,
  setSelectedStop: (stop) => set({ selectedStop: stop }),

  resetToInput: () =>
    set({
      plan: null,
      isGenerating: false,
      progress: 0,
      activeTab: 'timeline',
      activeDay: 1,
      selectedStop: null,
      steps: LOADING_STEPS.map(s => ({ ...s })),
    }),
}));
