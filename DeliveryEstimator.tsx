import React, { useState, useEffect } from "react";
import {
  DISTRICTS,
  BILLO_LOGO_URL,
  DELIVERY_TIME,
  BILLO_INFO,
} from "../constants";
import { Clock, MapPin, AlertCircle, MessageCircle, Phone } from "lucide-react";

const DeliveryEstimator: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setTime(`${hours}:${minutes}`);
  }, []);

  const calculate = () => {
    if (!selectedDistrict || !time) return;
    const district = DISTRICTS.find((d) => d.name === selectedDistrict);
    if (!district) return;

    const hour = parseInt(time.split(":")[0]);
    const isNight = hour >= 21 || hour < 6;

    let calculatedPrice = 0;
    if (district.zone === "center") {
      calculatedPrice = isNight
        ? BILLO_INFO.tarifs.center.night
        : BILLO_INFO.tarifs.center.day;
    } else {
      calculatedPrice = isNight
        ? BILLO_INFO.tarifs.periphery.night
        : BILLO_INFO.tarifs.periphery.day;
    }
    setPrice(calculatedPrice);
  };

  useEffect(() => {
    calculate();
  }, [selectedDistrict, time]);

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl p-6 sm:p-8 mb-6 border border-gray-100 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl border-2 border-brand-orange bg-white p-1.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={BILLO_LOGO_URL}
              alt="Billo Express"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-black text-brand-brown uppercase tracking-tighter text-lg italic">
              {BILLO_INFO.name}
            </h3>
            <p className="text-[10px] text-brand-orange font-black uppercase tracking-[0.2em]">
              L'éclair de Niamey • Service 24/7
            </p>
          </div>
        </div>

        {/* Contact WhatsApp Billo Direct */}
        <a
          href={`https://wa.me/22792080822?text=${encodeURIComponent("Bonjour Billo Express, je souhaite me renseigner pour une livraison.")}`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase italic shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <MessageCircle size={15} />
          <span>WhatsApp Billo : +227 92 08 08 22</span>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
            <MapPin size={10} className="text-brand-orange" /> Zone
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full text-xs p-4 sm:p-5 bg-[#F8F9FA] rounded-[1.8rem] border-none focus:ring-1 focus:ring-brand-orange font-bold appearance-none cursor-pointer"
          >
            <option value="">Quartier...</option>
            {DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
            <Clock size={10} className="text-brand-orange" /> Heure
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full text-xs p-4 sm:p-5 bg-[#F8F9FA] rounded-[1.8rem] border-none focus:ring-1 focus:ring-brand-orange font-bold"
          />
        </div>
      </div>

      <div className="bg-orange-50 p-5 rounded-[2.2rem] border border-orange-100 flex items-start gap-3">
        <AlertCircle
          size={18}
          className="text-brand-orange flex-shrink-0 mt-0.5"
        />
        <p className="text-[9px] font-bold text-brand-orange leading-relaxed italic uppercase tracking-wider">
          JUMMUA'H MUBARAK : LES LIVRAISONS S'ARRÊTENT À 12H ET REPRENNENT À 15H
          POUR LA PRIÈRE.
        </p>
      </div>

      {price !== null && (
        <div className="mt-6 p-6 bg-brand-brown text-brand-gold rounded-[2.2rem] flex justify-between items-center animate-slide-up shadow-xl border-4 border-white">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase opacity-50 mb-1 tracking-widest">
              Tarif Billo
            </span>
            <span className="text-xl font-black italic">{price} F CFA</span>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black uppercase opacity-50 mb-1 tracking-widest">
              Estimé
            </span>
            <span className="text-xs font-black text-white">
              {DELIVERY_TIME}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryEstimator;
