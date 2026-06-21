'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Camera, MapPin, Heart, ArrowRight, Check } from 'lucide-react';

export function OnboardingWizard() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem('onboardingDone');
    if (!done) setShow(true);
  }, []);

  const finish = () => {
    localStorage.setItem('onboardingDone', 'true');
    setShow(false);
  };

  if (!show) return null;

  const steps = [
    {
      title: 'Welcome to ExploreMY',
      desc: 'Your AI-powered travel companion for discovering Malaysia. Plan trips, track memories, and explore hidden gems.',
      icon: Compass,
      color: 'from-[#C4956A] to-[#D4A574]',
    },
    {
      title: 'Discover & Plan',
      desc: 'Use AI to generate complete weekend itineraries. Search any place in Malaysia. Save your favorite spots.',
      icon: Sparkles,
      color: 'from-[#3B82F6] to-[#6366F1]',
    },
    {
      title: 'Track & Share',
      desc: 'Document your journeys with photos and journals. Build your travel passport. Share memories with your partner.',
      icon: Heart,
      color: 'from-[#EC4899] to-[#F472B6]',
    },
  ];

  const s = steps[step];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="w-full max-w-sm mx-4 bg-white dark:bg-[#1A231D] rounded-[32px] p-8 text-center shadow-2xl"
        >
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#C4956A]' : 'w-1.5 bg-[#E8D5C4] dark:bg-[#3A3D38]'}`} />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-[24px] bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <s.icon className="h-10 w-10 text-white" />
          </div>

          {/* Content */}
          <h2 className="text-[24px] font-extrabold text-[#3C2415] dark:text-white mb-3">{s.title}</h2>
          <p className="text-[15px] text-[#8B7355] dark:text-[#A0A8A0] leading-relaxed mb-8">{s.desc}</p>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={finish} className="flex-1 py-3 rounded-2xl bg-[#F5EDE3] dark:bg-[#242824] text-[#8B7355] dark:text-[#A0A8A0] text-[14px] font-bold hover:bg-[#EDE4D8] transition-colors">
              Skip
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="flex-1 py-3 rounded-2xl bg-[#C4956A] text-white text-[14px] font-extrabold hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-1.5">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={finish} className="flex-1 py-3 rounded-2xl bg-[#C4956A] text-white text-[14px] font-extrabold hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-1.5">
                Get Started <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
