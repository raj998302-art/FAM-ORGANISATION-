import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NeonText from '../components/ui/NeonText';
import GlowCard from '../components/ui/GlowCard';
import GamingButton from '../components/ui/GamingButton';
import { cn } from '@/lib/utils';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is Fire Arena?',
          a: 'Fire Arena is a premium Free Fire MAX tournament platform where you can compete in daily tournaments, win real cash prizes, and track your gaming performance.'
        },
        {
          q: 'How do I get started?',
          a: 'Simply sign up with your Google account, link your Free Fire UID, add funds to your wallet, and join any available tournament!'
        },
        {
          q: 'Is Fire Arena safe?',
          a: 'Yes! We use secure payment gateways and your data is encrypted. We never ask for your Free Fire password.'
        }
      ]
    },
    {
      category: 'Tournaments',
      questions: [
        {
          q: 'How do I join a tournament?',
          a: 'Go to Tournaments tab, select a tournament, ensure you have enough balance for the entry fee, and click Join. You\'ll receive room ID and password before the match.'
        },
        {
          q: 'What game modes are available?',
          a: 'We offer Solo, Duo, and Squad tournaments on various maps including Bermuda, Purgatory, Kalahari, and Alpine.'
        },
        {
          q: 'When do I receive my winnings?',
          a: 'Winnings are automatically credited to your wallet within 30 minutes after the tournament admin approves the results.'
        },
        {
          q: 'Can I cancel my tournament entry?',
          a: 'No, once you join a tournament, the entry fee is non-refundable. Make sure to check the match time before joining.'
        }
      ]
    },
    {
      category: 'Wallet & Payments',
      questions: [
        {
          q: 'How do I add money to my wallet?',
          a: 'Go to Wallet > Add Money, select the amount, and complete payment via UPI, Paytm, PhonePe, or bank transfer.'
        },
        {
          q: 'What is the minimum withdrawal amount?',
          a: 'The minimum withdrawal amount is ₹50. You can withdraw to your UPI, Paytm, PhonePe, or bank account.'
        },
        {
          q: 'How long does withdrawal take?',
          a: 'Withdrawals are processed within 24-48 hours. You\'ll be notified once your request is approved.'
        },
        {
          q: 'Are there any deposit bonuses?',
          a: 'Yes! We regularly offer deposit bonuses. Check the Wallet page for active offers.'
        }
      ]
    },
    {
      category: 'Account & Profile',
      questions: [
        {
          q: 'How do I link my Free Fire UID?',
          a: 'Go to Profile > Edit Profile, enter your Free Fire UID and click Verify. Make sure you enter the correct UID.'
        },
        {
          q: 'Can I change my Free Fire UID?',
          a: 'Yes, but only if your current UID is not verified. Once verified, contact support to change it.'
        },
        {
          q: 'What is the referral program?',
          a: 'Invite friends using your referral code. You earn ₹10 for each friend who signs up and completes their first tournament.'
        },
        {
          q: 'How do I earn XP and level up?',
          a: 'Earn XP by playing tournaments, winning matches, and completing daily missions. Higher levels unlock exclusive rewards.'
        }
      ]
    },
    {
      category: 'Rules & Fair Play',
      questions: [
        {
          q: 'What happens if I don\'t join the match?',
          a: 'If you register but don\'t join the match room, your entry fee is forfeited. Make sure to join on time!'
        },
        {
          q: 'What if there\'s a technical issue?',
          a: 'Contact support immediately via the Chat page. If the issue is on our end, your entry fee will be refunded.'
        },
        {
          q: 'Can I use hacks or cheats?',
          a: 'Absolutely not! Using hacks/cheats will result in immediate account ban and prize forfeiture.'
        },
        {
          q: 'How are winners determined?',
          a: 'Winners are determined by in-game position and kills. Admins verify results using screenshots before distributing prizes.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="cyan" size="2xl" className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-7 h-7" />
          FAQ
        </NeonText>
        <p className="text-slate-400">Frequently asked questions</p>
      </motion.div>

      {/* Need Help Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <GlowCard glowColor="purple" className="p-5 text-center">
          <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-slate-400 text-sm mb-4">
            Our support team is here to help 24/7
          </p>
          <Link to={createPageUrl('Chat')}>
            <GamingButton variant="primary" size="sm">
              Contact Support
            </GamingButton>
          </Link>
        </GlowCard>
      </motion.div>

      {/* FAQ Categories */}
      {faqs.map((category, categoryIndex) => (
        <motion.div
          key={categoryIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + categoryIndex * 0.05 }}
          className="mb-6"
        >
          <h3 className="text-cyan-400 font-semibold mb-3">{category.category}</h3>
          <div className="space-y-2">
            {category.questions.map((item, index) => {
              const globalIndex = `${categoryIndex}-${index}`;
              const isOpen = openIndex === globalIndex;

              return (
                <GlowCard 
                  key={index}
                  glowColor={isOpen ? 'cyan' : 'slate'}
                  className="overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3"
                  >
                    <p className="font-medium text-white flex-1">{item.q}</p>
                    <ChevronDown 
                      className={cn(
                        "w-5 h-5 text-cyan-400 transition-transform flex-shrink-0",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </GlowCard>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}