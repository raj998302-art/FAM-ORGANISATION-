import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Award, Download, Trophy } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function TrophyRoom() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      const certs = await apiClient.entities.Certificate.filter(
        { user_email: currentUser.email },
        '-certificate_date'
      );
      setCertificates(certs);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (cert) => {
    const link = document.createElement('a');
    link.href = cert.certificate_image;
    link.download = `${cert.tournament_name}_${cert.position}.png`;
    link.click();
  };

  if (loading) {
    return <LoadingScreen message="Loading trophy room..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="gold" size="2xl" className="flex items-center gap-2 mb-2">
          <Trophy className="w-7 h-7" />
          MY TROPHY ROOM
        </NeonText>
        <p className="text-slate-400">Your achievements and certificates</p>
      </motion.div>

      {certificates.length === 0 ? (
        <GlowCard glowColor="purple" className="p-8 text-center">
          <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <NeonText color="cyan" size="lg" className="block mb-2">No Certificates Yet</NeonText>
          <p className="text-slate-400">Win tournaments to earn certificates!</p>
        </GlowCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlowCard 
                glowColor={cert.position === 1 ? 'gold' : cert.position === 2 ? 'cyan' : 'orange'} 
                className="p-4"
              >
                <img 
                  src={cert.certificate_image} 
                  alt={cert.tournament_name}
                  className="w-full rounded-lg mb-3"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">{cert.tournament_name}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-black ${
                        cert.position === 1 ? 'bg-yellow-500 text-slate-900' :
                        cert.position === 2 ? 'bg-slate-400 text-slate-900' :
                        'bg-orange-500 text-white'
                      }`}>{cert.position}</span>
                      {cert.position === 1 ? '1st' : cert.position === 2 ? '2nd' : '3rd'} Place
                    </p>
                  </div>
                  <GamingButton
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => downloadCertificate(cert)}
                  >
                    Download
                  </GamingButton>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}