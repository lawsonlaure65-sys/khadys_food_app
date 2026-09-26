import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, Share2, Sparkles, Moon, Sun, Smartphone, Square, 
  Image as ImageIcon, Check, Copy, RefreshCw, Eye, Flame, 
  ChefHat, Award, Clock, Gift, ShoppingBag, ShieldCheck, 
  MessageSquare, Globe, ArrowRight, Palette, Layers, CheckCircle2,
  Music, Facebook, Instagram, AlertCircle, Send, Info, Edit3, LayoutGrid
} from 'lucide-react';
import { 
  PlatDuJourConfig, PosterTheme, PosterFormat, PosterLayout, PublicationTiming, 
  DEFAULT_MENU_DU_JOUR_DISHES,
  shareToSocialPlatform, broadcastToWhatsApp, shareImageAndText,
  generatePlatDuJourMarketingTexts, resolveTrioDishImage, isCustomRestaurantImage
} from '../utils/marketing';
import { RESTAURANT_INFO } from '../constants';
import { playSound } from '../utils/audio';
import { MenuItem } from '../types';

interface PlatDuJourPosterStudioProps {
  plat: PlatDuJourConfig;
  items?: MenuItem[];
  onSwitchToRecipeTab?: () => void;
  onChangePlat: (updated: PlatDuJourConfig) => void;
}

export const PlatDuJourPosterStudio: React.FC<PlatDuJourPosterStudioProps> = ({
  plat,
  items,
  onSwitchToRecipeTab,
  onChangePlat
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);
  const [copiedTeaser, setCopiedTeaser] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  // Toggle between Short Status Format (< 7 lines for WhatsApp Status) and Full Text Format
  const [textMode, setTextMode] = useState<'SHORT_STATUS' | 'FULL_TEASER'>('SHORT_STATUS');

  // Theme palettes configuration
  const themesConfig: Record<PosterTheme, {
    name: string;
    badge: string;
    isLightSand?: boolean;
    bgGradient: [string, string, string];
    accentColor: string;
    goldColor: string;
    cardBg: string;
    textColor: string;
    subtextColor: string;
    borderGold: string;
    bannerBg: string;
    bannerTextColor: string;
  }> = {
    SAHEL_TERRACOTTA: {
      name: 'Sahélien Ocre & Crème (Style Samalife)',
      badge: '⭐ RECOMMANDÉ',
      isLightSand: true,
      bgGradient: ['#FAF5EE', '#F3E7D7', '#EBDAC5'],
      accentColor: '#EA580C',
      goldColor: '#C2410C',
      cardBg: '#FFFFFF',
      textColor: '#3A1408',
      subtextColor: '#7C2D12',
      borderGold: '#EA580C',
      bannerBg: '#EA580C',
      bannerTextColor: '#FFFFFF'
    },
    LUXURY_GOLD: {
      name: 'Luxe Noir & Or Royal',
      badge: '👑 SIGNATURE',
      isLightSand: false,
      bgGradient: ['#170A06', '#2A130C', '#0D0503'],
      accentColor: '#FF6B00',
      goldColor: '#F59E0B',
      cardBg: 'rgba(35, 16, 10, 0.85)',
      textColor: '#FFFFFF',
      subtextColor: '#E5D5C5',
      borderGold: '#D97706',
      bannerBg: '#FF6B00',
      bannerTextColor: '#FFFFFF'
    },
    WOOD_FIRE: {
      name: 'Braise & Flamme Vive',
      badge: '🔥 BRAISÉ',
      isLightSand: false,
      bgGradient: ['#1C0704', '#3E0D06', '#120302'],
      accentColor: '#EF4444',
      goldColor: '#F59E0B',
      cardBg: 'rgba(40, 10, 8, 0.88)',
      textColor: '#FFFFFF',
      subtextColor: '#FECACA',
      borderGold: '#EF4444',
      bannerBg: '#DC2626',
      bannerTextColor: '#FFFFFF'
    },
    MODERN_EMERALD: {
      name: 'Émeraude Impérial & Or',
      badge: '🌿 PRESTIGE',
      isLightSand: false,
      bgGradient: ['#042116', '#093A27', '#02150E'],
      accentColor: '#10B981',
      goldColor: '#FBBF24',
      cardBg: 'rgba(4, 40, 26, 0.88)',
      textColor: '#FFFFFF',
      subtextColor: '#A7F3D0',
      borderGold: '#34D399',
      bannerBg: '#059669',
      bannerTextColor: '#FFFFFF'
    }
  };

  const currentTheme = themesConfig[plat.posterTheme || 'SAHEL_TERRACOTTA'] || themesConfig.SAHEL_TERRACOTTA;

  // Dimensions based on format
  const getFormatDimensions = (format: PosterFormat) => {
    switch (format) {
      case 'STORY_PORTRAIT':
        return { width: 1080, height: 1920, label: 'Story & Statut WhatsApp (9:16)' };
      case 'BANNER_LANDSCAPE':
        return { width: 1920, height: 1080, label: 'Bannière Paysage (16:9)' };
      case 'SQUARE_POST':
      default:
        return { width: 1080, height: 1080, label: 'Post Carré Instagram & Facebook (1:1)' };
    }
  };

  // Helper to ensure text matches the current dish on the poster
  const getActiveTextToShare = () => {
    const isEvening = plat.publicationTiming === 'TONIGHT_FOR_TOMORROW';
    const dishLower = (plat.dishName || '').toLowerCase().trim();
    const firstWord = dishLower.split(/\s+/)[0];

    // Helper to check if text is out of sync with current dish name
    const isMismatch = (txt?: string) => {
      if (!txt || !txt.trim()) return true;
      const lower = txt.toLowerCase();
      // If dish is not tiep but text mentions tiep
      if (dishLower.indexOf('tiep') === -1 && lower.indexOf('tiep') !== -1) return true;
      // If dish is tiep but text doesn't mention tiep
      if (dishLower.indexOf('tiep') !== -1 && lower.indexOf('tiep') === -1) return true;
      // If dish name's first word (length > 3) is missing from text
      if (firstWord.length > 3 && lower.indexOf(firstWord) === -1) return true;
      return false;
    };

    const freshTexts = generatePlatDuJourMarketingTexts(plat, 'GOURMAND');

    if (textMode === 'SHORT_STATUS') {
      if (isEvening) {
        return (!isMismatch(plat.marketingTextEveningStatusShort) && plat.marketingTextEveningStatusShort)
          ? plat.marketingTextEveningStatusShort
          : freshTexts.eveningStatusShort;
      } else {
        return (!isMismatch(plat.marketingTextStatusShort) && plat.marketingTextStatusShort)
          ? plat.marketingTextStatusShort
          : freshTexts.statusShort;
      }
    } else {
      if (isEvening) {
        return (!isMismatch(plat.marketingTextEveningTeaser) && plat.marketingTextEveningTeaser)
          ? plat.marketingTextEveningTeaser
          : freshTexts.eveningTeaser;
      } else {
        return (!isMismatch(plat.marketingTextWhatsApp) && plat.marketingTextWhatsApp)
          ? plat.marketingTextWhatsApp
          : freshTexts.whatsapp;
      }
    }
  };

  // Force regenerate all texts for current dish
  const handleRegenerateCurrentTexts = () => {
    playSound('pop');
    const texts = generatePlatDuJourMarketingTexts(plat, 'GOURMAND');
    onChangePlat({
      ...plat,
      marketingTextWhatsApp: texts.whatsapp,
      marketingTextStatusShort: texts.statusShort,
      marketingTextGroups: texts.groups,
      marketingTextSocial: texts.social,
      marketingTextEveningTeaser: texts.eveningTeaser,
      marketingTextEveningStatusShort: texts.eveningStatusShort,
      hashtags: texts.hashtags
    });
  };

  // Helper to load image safely as a Promise (supports both data:image/... base64 and external URLs)
  const loadImgSafe = (src?: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const finalSrc = (src && src.trim()) || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000';
      const img = new Image();
      if (!finalSrc.startsWith('data:') && !finalSrc.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback if CORS fails on an external image
        if (img.crossOrigin) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => resolve(fallbackImg);
          fallbackImg.src = finalSrc;
        } else {
          resolve(img);
        }
      };
      img.src = finalSrc;
    });
  };

  // Render poster on HTML5 Canvas in High Definition
  const drawPosterCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getFormatDimensions(plat.posterFormat || 'SQUARE_POST');
    canvas.width = width;
    canvas.height = height;

    setIsGeneratingCanvas(true);

    const isLight = !!currentTheme.isLightSand;
    const isEvening = plat.publicationTiming === 'TONIGHT_FOR_TOMORROW';
    const isTrioMode = (plat.posterLayout || 'TRIO_POSTER') === 'TRIO_POSTER';

    // Retrieve the 3 dishes: 1 Plat Cuisiné du Jour + 2 Incontournables (Doukounou & Attiéké)
    const dishesList = plat.dishes && plat.dishes.length >= 3 ? plat.dishes : DEFAULT_MENU_DU_JOUR_DISHES;
    const rawDish1 = dishesList[0] || {
      dishName: plat.dishName,
      dishImage: plat.dishImage,
      tagline: plat.tagline,
      description: plat.description,
      accompaniments: plat.accompaniments,
      price: plat.price,
      promoPrice: plat.promoPrice,
      remainingStock: plat.remainingStock
    };
    const rawDish2 = dishesList[1] || DEFAULT_MENU_DU_JOUR_DISHES[1];
    const rawDish3 = dishesList[2] || DEFAULT_MENU_DU_JOUR_DISHES[2];

    // Resolve authentic restaurant images from the registered menu items (Doukounou, Attiéké, Plat du Jour)
    const dish1 = {
      ...rawDish1,
      dishImage: resolveTrioDishImage(
        !isCustomRestaurantImage(rawDish1.dishImage) && isCustomRestaurantImage(plat.dishImage)
          ? { ...rawDish1, dishImage: plat.dishImage }
          : rawDish1,
        0,
        items
      )
    };
    const dish2 = {
      ...rawDish2,
      dishImage: resolveTrioDishImage(rawDish2, 1, items)
    };
    const dish3 = {
      ...rawDish3,
      dishImage: resolveTrioDishImage(rawDish3, 2, items)
    };

    // Load all required images in parallel
    Promise.all([
      loadImgSafe(dish1.dishImage),
      loadImgSafe(dish2.dishImage),
      loadImgSafe(dish3.dishImage)
    ]).then(([img1, img2, img3]) => {
      // 1. Draw Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, currentTheme.bgGradient[0]);
      bgGrad.addColorStop(0.5, currentTheme.bgGradient[1]);
      bgGrad.addColorStop(1, currentTheme.bgGradient[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle luxury background circles / mandalas
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(234, 88, 12, 0.08)' : `${currentTheme.goldColor}15`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width * 0.88, height * 0.12, width * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width * 0.12, height * 0.88, width * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Decorative Outer Border
      const borderPadding = 28;
      ctx.save();
      ctx.strokeStyle = isLight ? 'rgba(194, 65, 12, 0.25)' : `${currentTheme.goldColor}40`;
      ctx.lineWidth = 3;
      ctx.strokeRect(borderPadding, borderPadding, width - borderPadding * 2, height - borderPadding * 2);
      
      // Golden corner flourishes
      const cornerSize = 34;
      ctx.strokeStyle = isLight ? '#EA580C' : currentTheme.goldColor;
      ctx.lineWidth = 5;
      
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(borderPadding, borderPadding + cornerSize);
      ctx.lineTo(borderPadding, borderPadding);
      ctx.lineTo(borderPadding + cornerSize, borderPadding);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(width - borderPadding - cornerSize, borderPadding);
      ctx.lineTo(width - borderPadding, borderPadding);
      ctx.lineTo(width - borderPadding, borderPadding + cornerSize);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(borderPadding, height - borderPadding - cornerSize);
      ctx.lineTo(borderPadding, height - borderPadding);
      ctx.lineTo(borderPadding + cornerSize, height - borderPadding);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(width - borderPadding - cornerSize, height - borderPadding);
      ctx.lineTo(width - borderPadding, height - borderPadding);
      ctx.lineTo(width - borderPadding, height - borderPadding - cornerSize);
      ctx.stroke();
      ctx.restore();

      // 3. Top Header: Circular Restaurant Emblem & Brand Name (Style Samalife)
      ctx.save();
      const isStory = plat.posterFormat === 'STORY_PORTRAIT';
      const isLandscape = plat.posterFormat === 'BANNER_LANDSCAPE';
      const emblemY = borderPadding + (isStory ? 48 : 42);
      
      // Round Logo badge
      ctx.beginPath();
      ctx.arc(width / 2, emblemY, 28, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#FFFFFF' : '#2A130C';
      ctx.fill();
      ctx.strokeStyle = isLight ? '#EA580C' : currentTheme.goldColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Chef / Crown Icon Monogram
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLight ? '#EA580C' : currentTheme.goldColor;
      ctx.font = '900 22px sans-serif';
      ctx.fillText('👑', width / 2, emblemY - 1);

      // Restaurant Name
      ctx.fillStyle = isLight ? '#431407' : currentTheme.goldColor;
      ctx.font = 'bold 22px "Montserrat", sans-serif';
      ctx.fillText('✦ KHADY\'S FOOD & EVENT ✦', width / 2, emblemY + 44);

      // Subtitle
      ctx.fillStyle = isLight ? '#9A3412' : currentTheme.subtextColor;
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.fillText('AUTHENTIQUE GASTRONOMIE SAHÉLIENNE • NIAMEY', width / 2, emblemY + 66);
      ctx.restore();

      // 4. Timing Ribbon Badge ("🌙 AU MENU DEMAIN MIDI" or "🍲 PLAT DU JOUR")
      const badgeText = isEvening 
        ? `🌙 AU MENU DEMAIN MIDI (${(plat.targetDayLabel || 'DEMAIN').toUpperCase()})`
        : `🍲 AU MENU DU JOUR • ${(plat.date || 'AUJOURD\'HUI').toUpperCase()}`;

      const badgeWidth = Math.min(width * 0.68, isLandscape ? 700 : 580);
      const badgeHeight = isStory ? 46 : 40;
      const badgeX = (width - badgeWidth) / 2;
      const badgeY = emblemY + 84;

      ctx.save();
      ctx.fillStyle = isEvening ? '#7C2D12' : currentTheme.accentColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 20);
      ctx.fill();
      ctx.strokeStyle = isLight ? '#FED7AA' : currentTheme.goldColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 17px "Montserrat", sans-serif';
      ctx.fillText(badgeText, width / 2, badgeY + badgeHeight / 2);
      ctx.restore();

      // Helper function: draw circular dish plate with shadow, outer rim and optional badge
      const drawCircularPlate = (
        pImg: HTMLImageElement,
        centerX: number,
        centerY: number,
        radius: number,
        rimColor: string,
        plateBadge?: string,
        plateBadgeBg: string = '#EF4444'
      ) => {
        ctx.save();
        // Realistic deep shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = Math.min(radius * 0.24, 28);
        ctx.shadowOffsetY = Math.min(radius * 0.09, 11);

        // Outer rim
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = rimColor;
        ctx.fill();

        // Inner plate clip
        ctx.shadowColor = 'transparent';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        try {
          const iw = pImg.naturalWidth || pImg.width || radius * 2;
          const ih = pImg.naturalHeight || pImg.height || radius * 2;
          if (iw > 0 && ih > 0) {
            const minDim = Math.min(iw, ih);
            const sx = (iw - minDim) / 2;
            const sy = (ih - minDim) / 2;
            ctx.drawImage(pImg, sx, sy, minDim, minDim, centerX - radius, centerY - radius, radius * 2, radius * 2);
          } else {
            ctx.drawImage(pImg, centerX - radius, centerY - radius, radius * 2, radius * 2);
          }
        } catch {
          ctx.fillStyle = '#2A130C';
          ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        }
        ctx.restore();

        // Optional badge pinned onto the plate rim
        if (plateBadge) {
          ctx.save();
          const tagW = Math.min(radius * 1.55, 250);
          const tagH = 32;
          const tagY = centerY + radius - 16;
          ctx.fillStyle = plateBadgeBg;
          ctx.beginPath();
          ctx.roundRect(centerX - tagW / 2, tagY, tagW, tagH, 16);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '900 12px "Montserrat", sans-serif';
          ctx.fillText(plateBadge, centerX, tagY + tagH / 2);
          ctx.restore();
        }
      };

      // -------------------------------------------------------------
      // CASE A: TRIO_POSTER (Plat du Jour en haut & en grand, Doukounou & Attiéké en bas)
      // -------------------------------------------------------------
      if (isTrioMode) {
        if (isStory) {
          // ==================== STORY / PORTRAIT (1080 x 1920) ====================
          // 1. Top Section: Plat du Jour in Large
          const topBoxY = badgeY + badgeHeight + 25;
          const topBoxH = 750;
          const topBoxW = width - (borderPadding + 12) * 2;
          const topBoxX = borderPadding + 12;

          // Box container
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.75)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(topBoxX, topBoxY, topBoxW, topBoxH, 28);
          ctx.fill();
          ctx.strokeStyle = isLight ? 'rgba(234, 88, 12, 0.35)' : `${currentTheme.goldColor}50`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Header Tag inside Top Box
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = currentTheme.accentColor;
          ctx.font = '900 16px "Montserrat", sans-serif';
          ctx.fillText('👑 1. LE GRAND PLAT CUISINÉ DU JOUR 👑', width / 2, topBoxY + 34);

          // Big Circular Plate for Dish 1 (radius 200 => 400px diameter)
          const dish1CenterX = width / 2;
          const dish1CenterY = topBoxY + 250;
          drawCircularPlate(
            img1,
            dish1CenterX,
            dish1CenterY,
            195,
            isLight ? '#EA580C' : currentTheme.goldColor,
            isEvening ? '🌙 PRÉCOMMANDE VEILLE' : '🔥 ÉDITION DU JOUR',
            '#EF4444'
          );

          // Details under plate
          let textY = dish1CenterY + 225;
          ctx.fillStyle = isLight ? '#3A1208' : '#FFFFFF';
          ctx.font = '900 32px "Playfair Display", "Montserrat", serif';
          ctx.fillText(dish1.dishName.toUpperCase(), width / 2, textY);

          // Tagline
          textY += 36;
          ctx.fillStyle = isLight ? '#C2410C' : currentTheme.goldColor;
          ctx.font = 'italic 700 16px "Inter", sans-serif';
          ctx.fillText(`◆ ${dish1.tagline || 'Recette mijotée avec passion'} ◆`, width / 2, textY);

          // Accompaniments Pill
          if (dish1.accompaniments) {
            textY += 34;
            const accW = Math.min(topBoxW - 60, 680);
            const accH = 40;
            const accX = (width - accW) / 2;
            ctx.fillStyle = isLight ? '#FFF7ED' : 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.roundRect(accX, textY - accH / 2, accW, accH, 20);
            ctx.fill();
            ctx.strokeStyle = isLight ? '#F97316' : currentTheme.goldColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = isLight ? '#9A3412' : '#FDE68A';
            ctx.font = '800 13px "Montserrat", sans-serif';
            ctx.fillText(`🎁 INCLUS : ${dish1.accompaniments.toUpperCase()}`, width / 2, textY);
          }

          // Price Tag for Dish 1
          textY += 46;
          const d1EffectivePrice = dish1.promoPrice || dish1.price;
          const d1PriceText = `${d1EffectivePrice.toLocaleString('fr-FR')} F CFA`;
          ctx.fillStyle = currentTheme.accentColor;
          ctx.font = '900 28px "Montserrat", sans-serif';
          ctx.fillText(d1PriceText, width / 2, textY);
          ctx.restore();

          // 2. Mid Separator Banner (Vos 2 Incontournables)
          const midY = topBoxY + topBoxH + 30;
          ctx.save();
          const midW = width - (borderPadding + 16) * 2;
          const midH = 50;
          const midX = borderPadding + 16;
          ctx.fillStyle = isLight ? '#EA580C' : '#2A130C';
          ctx.beginPath();
          ctx.roundRect(midX, midY, midW, midH, 25);
          ctx.fill();
          ctx.strokeStyle = isLight ? '#FDBA74' : currentTheme.goldColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 16px "Montserrat", sans-serif';
          ctx.fillText('✦ VOS 2 INCONTOURNABLES DISPONIBLES TOUS LES JOURS ✦', width / 2, midY + midH / 2);
          ctx.restore();

          // 3. Bottom Section: Doukounou (left) & Attiéké (right)
          const bottomY = midY + midH + 22;
          const cardH = 510;
          const cardW = (width - (borderPadding + 16) * 2 - 20) / 2;

          // Card 2: Doukounou
          const card2X = borderPadding + 16;
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.85)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(card2X, bottomY, cardW, cardH, 24);
          ctx.fill();
          ctx.strokeStyle = isLight ? 'rgba(217, 119, 6, 0.4)' : '#D97706';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Doukounou Plate
          const d2CenterX = card2X + cardW / 2;
          const d2CenterY = bottomY + 140;
          drawCircularPlate(img2, d2CenterX, d2CenterY, 115, '#D97706', '🌽 DOUKOUNOU', '#D97706');

          // Doukounou Details
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isLight ? '#451A03' : '#FFFFFF';
          ctx.font = '900 20px "Montserrat", sans-serif';
          ctx.fillText('LE FAMEUX DOUKOUNOU', d2CenterX, bottomY + 285);

          ctx.fillStyle = isLight ? '#78350F' : '#FDE68A';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('Pâte de maïs vapeur traditionnelle', d2CenterX, bottomY + 312);
          ctx.fillText('Servie avec sauce mijotée & poisson', d2CenterX, bottomY + 332);

          const d2EffPrice = dish2.promoPrice || dish2.price || 3000;
          ctx.fillStyle = '#D97706';
          ctx.font = '900 22px "Montserrat", sans-serif';
          ctx.fillText(`${d2EffPrice.toLocaleString('fr-FR')} F CFA`, d2CenterX, bottomY + 380);

          if (dish2.accompaniments) {
            ctx.fillStyle = isLight ? '#92400E' : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 11px "Montserrat", sans-serif';
            ctx.fillText(`🎁 ${dish2.accompaniments.split('+')[0] || dish2.accompaniments}`, d2CenterX, bottomY + 412);
          }
          ctx.restore();

          // Card 3: Attiéké
          const card3X = card2X + cardW + 20;
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.85)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(card3X, bottomY, cardW, cardH, 24);
          ctx.fill();
          ctx.strokeStyle = isLight ? 'rgba(5, 150, 105, 0.4)' : '#059669';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Attiéké Plate
          const d3CenterX = card3X + cardW / 2;
          const d3CenterY = bottomY + 140;
          drawCircularPlate(img3, d3CenterX, d3CenterY, 115, '#059669', '🐟 ATTIÉKÉ ROYAL', '#059669');

          // Attiéké Details
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isLight ? '#064E3B' : '#FFFFFF';
          ctx.font = '900 20px "Montserrat", sans-serif';
          ctx.fillText('L\'INCONTOURNABLE ATTIÉKÉ', d3CenterX, bottomY + 285);

          ctx.fillStyle = isLight ? '#047857' : '#A7F3D0';
          ctx.font = '600 12px "Inter", sans-serif';
          ctx.fillText('Semoule de manioc vapeur aérée', d3CenterX, bottomY + 312);
          ctx.fillText('Darne de capitaine braisée & alloco', d3CenterX, bottomY + 332);

          const d3EffPrice = dish3.promoPrice || dish3.price || 4500;
          ctx.fillStyle = '#059669';
          ctx.font = '900 22px "Montserrat", sans-serif';
          ctx.fillText(`${d3EffPrice.toLocaleString('fr-FR')} F CFA`, d3CenterX, bottomY + 380);

          if (dish3.accompaniments) {
            ctx.fillStyle = isLight ? '#065F46' : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 11px "Montserrat", sans-serif';
            ctx.fillText(`🎁 ${dish3.accompaniments.split('+')[0] || dish3.accompaniments}`, d3CenterX, bottomY + 412);
          }
          ctx.restore();

        } else if (isLandscape) {
          // ==================== BANNER / LANDSCAPE (1920 x 1080) ====================
          // Left: Big Plat du Jour
          const leftBoxX = borderPadding + 16;
          const leftBoxY = badgeY + badgeHeight + 20;
          const leftBoxW = 950;
          const leftBoxH = height - leftBoxY - 120;

          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.75)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(leftBoxX, leftBoxY, leftBoxW, leftBoxH, 24);
          ctx.fill();
          ctx.strokeStyle = isLight ? 'rgba(234, 88, 12, 0.35)' : `${currentTheme.goldColor}50`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Plat du jour Plate (left) + Text (right)
          const d1CenterX = leftBoxX + 220;
          const d1CenterY = leftBoxY + leftBoxH / 2;
          drawCircularPlate(img1, d1CenterX, d1CenterY, 175, isLight ? '#EA580C' : currentTheme.goldColor, '🍲 PLAT DU JOUR', '#EF4444');

          const d1TextX = leftBoxX + 430;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = currentTheme.accentColor;
          ctx.font = '900 15px "Montserrat", sans-serif';
          ctx.fillText('👑 1. LE GRAND PLAT CUISINÉ DU JOUR', d1TextX, d1CenterY - 130);

          ctx.fillStyle = isLight ? '#3A1208' : '#FFFFFF';
          ctx.font = '900 30px "Playfair Display", "Montserrat", serif';
          ctx.fillText(dish1.dishName.toUpperCase(), d1TextX, d1CenterY - 80);

          ctx.fillStyle = isLight ? '#C2410C' : currentTheme.goldColor;
          ctx.font = 'italic 700 16px "Inter", sans-serif';
          ctx.fillText(dish1.tagline || 'Cuisiné au feu de bois avec passion', d1TextX, d1CenterY - 40);

          if (dish1.accompaniments) {
            ctx.fillStyle = isLight ? '#7C2D12' : '#FDE68A';
            ctx.font = 'bold 14px "Montserrat", sans-serif';
            ctx.fillText(`🎁 Inclus : ${dish1.accompaniments}`, d1TextX, d1CenterY);
          }

          const d1EffectivePrice = dish1.promoPrice || dish1.price;
          ctx.fillStyle = currentTheme.accentColor;
          ctx.font = '900 28px "Montserrat", sans-serif';
          ctx.fillText(`${d1EffectivePrice.toLocaleString('fr-FR')} F CFA`, d1TextX, d1CenterY + 60);
          ctx.restore();

          // Right: 2 Stacked Cards (Doukounou & Attiéké)
          const rightBoxX = leftBoxX + leftBoxW + 24;
          const rightBoxW = width - rightBoxX - borderPadding - 16;
          const cardH = (leftBoxH - 18) / 2;

          // Doukounou Card
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.85)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(rightBoxX, leftBoxY, rightBoxW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 2;
          ctx.stroke();

          drawCircularPlate(img2, rightBoxX + 130, leftBoxY + cardH / 2, 95, '#D97706', '🌽 DOUKOUNOU', '#D97706');

          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isLight ? '#451A03' : '#FFFFFF';
          ctx.font = '900 20px "Montserrat", sans-serif';
          ctx.fillText('LE FAMEUX DOUKOUNOU', rightBoxX + 255, leftBoxY + cardH / 2 - 40);

          ctx.fillStyle = isLight ? '#78350F' : '#FDE68A';
          ctx.font = '600 13px "Inter", sans-serif';
          ctx.fillText('Pâte de maïs vapeur traditionnelle & sauce mijotée', rightBoxX + 255, leftBoxY + cardH / 2 - 12);

          const d2EffPrice = dish2.promoPrice || dish2.price || 3000;
          ctx.fillStyle = '#D97706';
          ctx.font = '900 22px "Montserrat", sans-serif';
          ctx.fillText(`${d2EffPrice.toLocaleString('fr-FR')} F CFA`, rightBoxX + 255, leftBoxY + cardH / 2 + 30);
          ctx.restore();

          // Attiéké Card
          const attiekeCardY = leftBoxY + cardH + 18;
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.85)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(rightBoxX, attiekeCardY, rightBoxW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2;
          ctx.stroke();

          drawCircularPlate(img3, rightBoxX + 130, attiekeCardY + cardH / 2, 95, '#059669', '🐟 ATTIÉKÉ', '#059669');

          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isLight ? '#064E3B' : '#FFFFFF';
          ctx.font = '900 20px "Montserrat", sans-serif';
          ctx.fillText('L\'INCONTOURNABLE ATTIÉKÉ ROYAL', rightBoxX + 255, attiekeCardY + cardH / 2 - 40);

          ctx.fillStyle = isLight ? '#047857' : '#A7F3D0';
          ctx.font = '600 13px "Inter", sans-serif';
          ctx.fillText('Semoule de manioc vapeur, darne de poisson & alloco', rightBoxX + 255, attiekeCardY + cardH / 2 - 12);

          const d3EffPrice = dish3.promoPrice || dish3.price || 4500;
          ctx.fillStyle = '#059669';
          ctx.font = '900 22px "Montserrat", sans-serif';
          ctx.fillText(`${d3EffPrice.toLocaleString('fr-FR')} F CFA`, rightBoxX + 255, attiekeCardY + cardH / 2 + 30);
          ctx.restore();

        } else {
          // ==================== SQUARE (1080 x 1080) ====================
          // 1. Top Section: Grand Plat du Jour
          const topBoxY = badgeY + badgeHeight + 14;
          const topBoxH = 430;
          const topBoxW = width - (borderPadding + 10) * 2;
          const topBoxX = borderPadding + 10;

          // Box Container
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.78)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(topBoxX, topBoxY, topBoxW, topBoxH, 24);
          ctx.fill();
          ctx.strokeStyle = isLight ? 'rgba(234, 88, 12, 0.35)' : `${currentTheme.goldColor}45`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Big Circular Plate for Dish 1 (diameter 310px)
          const dish1CenterX = topBoxX + 175;
          const dish1CenterY = topBoxY + topBoxH / 2;
          drawCircularPlate(
            img1,
            dish1CenterX,
            dish1CenterY,
            155,
            isLight ? '#EA580C' : currentTheme.goldColor,
            isEvening ? '🌙 PRÉCOMMANDE VEILLE' : '🔥 PLAT DU JOUR',
            '#EF4444'
          );

          // Details right of the plate
          const textStartX = topBoxX + 355;
          const textMaxW = topBoxW - 375;

          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          // Small eyebrow
          ctx.fillStyle = currentTheme.accentColor;
          ctx.font = '900 13px "Montserrat", sans-serif';
          ctx.fillText('👑 1. LE GRAND PLAT CUISINÉ DU JOUR', textStartX, topBoxY + 30);

          // Main Dish Title (can wrap into 2 lines)
          ctx.fillStyle = isLight ? '#3A1208' : '#FFFFFF';
          ctx.font = '900 26px "Playfair Display", "Montserrat", serif';

          const titleWords = dish1.dishName.toUpperCase().split(' ');
          let line1 = '';
          let line2 = '';
          for (const w of titleWords) {
            if ((line1 + w).length < 24) {
              line1 += (line1 ? ' ' : '') + w;
            } else {
              line2 += (line2 ? ' ' : '') + w;
            }
          }

          let curY = topBoxY + 58;
          ctx.fillText(line1, textStartX, curY);
          if (line2) {
            curY += 34;
            ctx.fillText(line2, textStartX, curY);
          }

          // Tagline
          curY += 38;
          ctx.fillStyle = isLight ? '#C2410C' : currentTheme.goldColor;
          ctx.font = 'italic 700 14px "Inter", sans-serif';
          ctx.fillText(`◆ ${dish1.tagline || 'Cuisiné au feu de bois avec passion'} ◆`, textStartX, curY);

          // Accompaniments capsule
          if (dish1.accompaniments) {
            curY += 30;
            const accW = Math.min(textMaxW, 610);
            const accH = 34;
            ctx.fillStyle = isLight ? '#FFF7ED' : 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.roundRect(textStartX, curY, accW, accH, 12);
            ctx.fill();
            ctx.strokeStyle = isLight ? '#FDBA74' : `${currentTheme.goldColor}40`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = isLight ? '#9A3412' : '#FDE68A';
            ctx.font = '800 11px "Montserrat", sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(`🎁 INCLUS : ${dish1.accompaniments.toUpperCase()}`, textStartX + 12, curY + accH / 2);
            ctx.textBaseline = 'top';
          }

          // Price Tag
          curY += 46;
          const d1EffectivePrice = dish1.promoPrice || dish1.price;
          if (dish1.promoPrice && dish1.promoPrice < dish1.price) {
            ctx.fillStyle = isLight ? '#9A3412' : 'rgba(255,255,255,0.5)';
            ctx.font = '700 14px "Montserrat", sans-serif';
            ctx.fillText(`${dish1.price.toLocaleString('fr-FR')} F`, textStartX, curY + 6);
          }

          const priceX = (dish1.promoPrice && dish1.promoPrice < dish1.price) ? textStartX + 85 : textStartX;
          ctx.fillStyle = currentTheme.accentColor;
          ctx.font = '900 26px "Montserrat", sans-serif';
          ctx.fillText(`${d1EffectivePrice.toLocaleString('fr-FR')} F CFA`, priceX, curY);
          ctx.restore();

          // 2. Middle Separator Ribbon
          const midY = topBoxY + topBoxH + 12;
          ctx.save();
          const midW = width - (borderPadding + 14) * 2;
          const midH = 36;
          const midX = borderPadding + 14;
          ctx.fillStyle = isLight ? '#EA580C' : '#2A130C';
          ctx.beginPath();
          ctx.roundRect(midX, midY, midW, midH, 18);
          ctx.fill();
          ctx.strokeStyle = isLight ? '#FDBA74' : currentTheme.goldColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 13px "Montserrat", sans-serif';
          ctx.fillText('✦ VOS 2 INCONTOURNABLES DISPONIBLES TOUS LES JOURS ✦', width / 2, midY + midH / 2);
          ctx.restore();

          // 3. Bottom Section: Doukounou & Attiéké (2 cards side by side)
          const bottomY = midY + midH + 12;
          const cardH = 285;
          const cardW = (width - (borderPadding + 10) * 2 - 16) / 2;

          // Card 2: Doukounou (Left)
          const card2X = borderPadding + 10;
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.88)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(card2X, bottomY, cardW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Small plate
          const d2CenterX = card2X + 85;
          const d2CenterY = bottomY + cardH / 2;
          drawCircularPlate(img2, d2CenterX, d2CenterY, 68, '#D97706', '🌽 DOUKOUNOU', '#D97706');

          // Text right of plate
          const d2TextX = card2X + 170;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          ctx.fillStyle = isLight ? '#451A03' : '#FFFFFF';
          ctx.font = '900 17px "Montserrat", sans-serif';
          ctx.fillText('LE FAMEUX DOUKOUNOU', d2TextX, bottomY + 35);

          ctx.fillStyle = isLight ? '#78350F' : '#FDE68A';
          ctx.font = '600 11px "Inter", sans-serif';
          ctx.fillText('Pâte de maïs vapeur traditionnelle', d2TextX, bottomY + 68);
          ctx.fillText('Sauce mijotée & poisson frit', d2TextX, bottomY + 86);

          if (dish2.accompaniments) {
            ctx.fillStyle = isLight ? '#92400E' : 'rgba(255,255,255,0.75)';
            ctx.font = 'bold 10px "Montserrat", sans-serif';
            ctx.fillText(`🎁 ${dish2.accompaniments.split('+')[0] || dish2.accompaniments}`, d2TextX, bottomY + 115);
          }

          const d2EffPrice = dish2.promoPrice || dish2.price || 3000;
          ctx.fillStyle = '#D97706';
          ctx.font = '900 20px "Montserrat", sans-serif';
          ctx.fillText(`${d2EffPrice.toLocaleString('fr-FR')} F CFA`, d2TextX, bottomY + 155);
          ctx.restore();

          // Card 3: Attiéké (Right)
          const card3X = card2X + cardW + 16;
          ctx.save();
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.88)' : currentTheme.cardBg;
          ctx.beginPath();
          ctx.roundRect(card3X, bottomY, cardW, cardH, 20);
          ctx.fill();
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Small plate
          const d3CenterX = card3X + 85;
          const d3CenterY = bottomY + cardH / 2;
          drawCircularPlate(img3, d3CenterX, d3CenterY, 68, '#059669', '🐟 ATTIÉKÉ', '#059669');

          // Text right of plate
          const d3TextX = card3X + 170;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          ctx.fillStyle = isLight ? '#064E3B' : '#FFFFFF';
          ctx.font = '900 17px "Montserrat", sans-serif';
          ctx.fillText('L\'INCONTOURNABLE ATTIÉKÉ', d3TextX, bottomY + 35);

          ctx.fillStyle = isLight ? '#047857' : '#A7F3D0';
          ctx.font = '600 11px "Inter", sans-serif';
          ctx.fillText('Semoule manioc vapeur aérée', d3TextX, bottomY + 68);
          ctx.fillText('Capitaine braisé & alloco doré', d3TextX, bottomY + 86);

          if (dish3.accompaniments) {
            ctx.fillStyle = isLight ? '#065F46' : 'rgba(255,255,255,0.75)';
            ctx.font = 'bold 10px "Montserrat", sans-serif';
            ctx.fillText(`🎁 ${dish3.accompaniments.split('+')[0] || dish3.accompaniments}`, d3TextX, bottomY + 115);
          }

          const d3EffPrice = dish3.promoPrice || dish3.price || 4500;
          ctx.fillStyle = '#059669';
          ctx.font = '900 20px "Montserrat", sans-serif';
          ctx.fillText(`${d3EffPrice.toLocaleString('fr-FR')} F CFA`, d3TextX, bottomY + 155);
          ctx.restore();
        }

      } else {
        // -------------------------------------------------------------
        // CASE B: SINGLE_DISH (Focus exclusif sur le Plat du Jour seul)
        // -------------------------------------------------------------
        let imgSize = 0;
        let imgX = 0;
        let imgY = 0;

        if (isStory) {
          imgSize = 640;
          imgX = (width - imgSize) / 2;
          imgY = badgeY + badgeHeight + 35;
        } else if (isLandscape) {
          imgSize = 580;
          imgX = borderPadding + 60;
          imgY = (height - imgSize) / 2 + 30;
        } else {
          // Square 1:1
          imgSize = 480;
          imgX = (width - imgSize) / 2;
          imgY = badgeY + badgeHeight + 25;
        }

        drawCircularPlate(
          img1,
          imgX + imgSize / 2,
          imgY + imgSize / 2,
          imgSize / 2,
          isLight ? '#EA580C' : currentTheme.goldColor,
          isEvening ? '🌙 PRÉCOMMANDE VEILLE' : '🔥 ÉDITION DU JOUR',
          '#EF4444'
        );

        // Details
        let textStartX = 0;
        let textStartY = 0;
        let textMaxWidth = 0;

        if (isLandscape) {
          textStartX = imgX + imgSize + 50;
          textStartY = borderPadding + 140;
          textMaxWidth = width - textStartX - borderPadding - 40;
        } else if (isStory) {
          textStartX = borderPadding + 30;
          textStartY = imgY + imgSize + 35;
          textMaxWidth = width - (borderPadding + 30) * 2;
        } else {
          textStartX = borderPadding + 30;
          textStartY = imgY + imgSize + 25;
          textMaxWidth = width - (borderPadding + 30) * 2;
        }

        ctx.save();
        ctx.textAlign = isLandscape ? 'left' : 'center';
        const textCenterX = isLandscape ? textStartX : width / 2;

        ctx.fillStyle = isLight ? '#3A1208' : '#FFFFFF';
        ctx.font = '900 36px "Playfair Display", "Montserrat", serif';

        const titleWords = dish1.dishName.toUpperCase().split(' ');
        let l1 = '';
        let l2 = '';
        for (const word of titleWords) {
          if ((l1 + word).length < 24) {
            l1 += (l1 ? ' ' : '') + word;
          } else {
            l2 += (l2 ? ' ' : '') + word;
          }
        }

        ctx.fillText(l1, textCenterX, textStartY + 15);
        if (l2) {
          ctx.fillText(l2, textCenterX, textStartY + 55);
          textStartY += 40;
        }

        ctx.fillStyle = isLight ? '#C2410C' : currentTheme.goldColor;
        ctx.font = 'italic 700 18px "Inter", sans-serif';
        ctx.fillText(`◆ ${dish1.tagline || 'Cuisiné au feu de bois avec passion'} ◆`, textCenterX, textStartY + 50);

        if (dish1.accompaniments) {
          const bonusY = textStartY + 72;
          const bonusW = Math.min(textMaxWidth, 780);
          const bonusH = 48;
          const bonusX = isLandscape ? textStartX : (width - bonusW) / 2;

          ctx.fillStyle = isLight ? '#FFFBEB' : 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.roundRect(bonusX, bonusY, bonusW, bonusH, 16);
          ctx.fill();
          ctx.strokeStyle = isLight ? '#F59E0B' : `${currentTheme.goldColor}60`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = isLight ? '#B45309' : currentTheme.goldColor;
          ctx.font = '900 15px "Montserrat", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🎁 INCLUS : ${dish1.accompaniments.toUpperCase()}`, bonusX + bonusW / 2, bonusY + 30);
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 5. Solid Bottom Call-to-Action Bar (Style Samalife & WhatsApp)
      // -------------------------------------------------------------
      const barH = isStory ? 110 : 88;
      const barY = height - borderPadding - barH - 6;
      const barW = width - (borderPadding + 14) * 2;
      const barX = borderPadding + 14;

      ctx.save();
      ctx.fillStyle = currentTheme.bannerBg;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 22);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Left Column: WhatsApp Ordering
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${isStory ? '18px' : '16px'} "Montserrat", sans-serif`;
      ctx.fillText(`💬 COMMANDES WHATSAPP : ${RESTAURANT_INFO.whatsapp}`, barX + 22, barY + (isStory ? 38 : 30));

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `700 ${isStory ? '14px' : '12px'} "Inter", sans-serif`;
      ctx.fillText(`🛵 Livraison express partout à Niamey par Billo Express`, barX + 22, barY + (isStory ? 72 : 58));

      // Right Column: Pill Button
      const btnW = isStory ? 240 : 210;
      const btnH = isStory ? 64 : 52;
      const btnX = barX + barW - btnW - 18;
      const btnY = barY + (barH - btnH) / 2;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, btnH / 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = currentTheme.bannerBg;
      ctx.font = '900 14px "Montserrat", sans-serif';
      ctx.fillText('COMMANDER', btnX + btnW / 2, btnY + (isStory ? 22 : 18));

      ctx.font = '800 10px "Montserrat", sans-serif';
      ctx.fillStyle = '#7C2D12';
      ctx.fillText('AU COMPTOIR OU LIVRÉ', btnX + btnW / 2, btnY + (isStory ? 42 : 34));

      ctx.restore();
      setIsGeneratingCanvas(false);
    }).catch(() => {
      setIsGeneratingCanvas(false);
    });
  }, [plat, currentTheme, items]);

  // Redraw when plat or theme changes
  useEffect(() => {
    drawPosterCanvas();
  }, [drawPosterCanvas]);

  // Download high-resolution PNG image
  const handleDownloadPoster = () => {
    playSound('cash');
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    const filename = `affiche-plat-du-jour-${plat.dishName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${plat.posterFormat.toLowerCase()}.png`;
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Copy active teaser/status text
  const handleCopyActiveText = () => {
    playSound('pop');
    const textToCopy = getActiveTextToShare();
    navigator.clipboard.writeText(textToCopy);
    setCopiedTeaser(true);
    setTimeout(() => setCopiedTeaser(false), 2500);
  };

  // Direct Image & Text Native Web Share (solves WhatsApp status & attachment issue)
  const handleShareImageAndTextDirect = async () => {
    playSound('pop');
    setIsSharing(true);
    setShareStatus('Préparation de l\'affiche haute définition...');

    const textToShare = getActiveTextToShare();
    const filename = `khadys-plat-du-jour-${plat.dishName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;

    try {
      const res = await shareImageAndText(
        canvasRef.current,
        `Plat du Jour : ${plat.dishName} - Khady's Food`,
        textToShare,
        filename
      );

      setShareStatus(res.message);
      if (res.success) {
        playSound('success');
      }
    } catch (e: any) {
      setShareStatus('Erreur lors du partage.');
    } finally {
      setIsSharing(false);
      setTimeout(() => setShareStatus(null), 8000);
    }
  };

  // Standard WhatsApp Web Broadcast
  const handleBroadcastWhatsApp = () => {
    playSound('pop');
    const textToSend = getActiveTextToShare();
    broadcastToWhatsApp(textToSend);
  };

  const activeText = getActiveTextToShare();
  const textLineCount = activeText.split('\n').length;
  const textCharCount = activeText.length;
  const isStatusSafe = textLineCount <= 8 && textCharCount <= 400;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Studio Hero Header */}
      <div className="bg-gradient-to-r from-[#2A120B] via-[#35180E] to-[#1A0805] p-6 sm:p-8 rounded-[2.5rem] border-2 border-brand-gold/40 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm flex items-center gap-1.5">
              <Sparkles size={12} /> Studio Graphique & Affiches Réseaux Sociaux
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} /> Format WhatsApp Statut Garanti
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-white tracking-wide flex items-center gap-2.5">
            <ImageIcon className="text-brand-gold" size={26} /> Créateur d'Affiches Alléchantes & Partage Direct
          </h3>
          <p className="text-xs text-white/70 font-medium max-w-2xl leading-relaxed">
            Créez une affiche de haute qualité (style Samalife), téléchargez l'image PNG et partagez le texte adapté aux **Statuts WhatsApp** (sans risque de coupure ou dépassement de 700 caractères).
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShareImageAndTextDirect}
            disabled={isSharing}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2"
          >
            {isSharing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            <span>📲 Partager Affiche + Texte Direct</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPoster}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border border-white/20 active:scale-95 transition-all flex items-center gap-2"
          >
            {downloadSuccess ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Download size={16} />}
            <span>{downloadSuccess ? 'Téléchargé !' : 'Télécharger PNG HD'}</span>
          </button>
        </div>
      </div>

      {/* Share Status Toast / Notification Banner */}
      {shareStatus && (
        <div className="bg-emerald-950/80 border-2 border-emerald-500/60 p-4 rounded-2xl flex items-center justify-between gap-4 animate-fade-in shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              {shareStatus}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShareStatus(null)}
            className="text-white/60 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Studio Workspace: 2 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Creative Controls & Publication Timing (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Active Dish Quick-Card with Trio Preview & Direct Switch to 100% Custom Edition */}
          <div className="bg-gradient-to-r from-brand-orange/20 via-brand-gold/15 to-transparent p-5 rounded-[2rem] border-2 border-brand-gold/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                <ChefHat size={14} className="text-brand-orange" /> Photos Officielles du Trio sur l'Affiche
              </span>
              <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                ✓ Photos Restaurant Synchronisées
              </span>
            </div>

            {(() => {
              const dishesList = plat.dishes && plat.dishes.length >= 3 ? plat.dishes : DEFAULT_MENU_DU_JOUR_DISHES;
              const img1Url = resolveTrioDishImage(dishesList[0] || { dishName: plat.dishName, dishImage: plat.dishImage }, 0, items);
              const img2Url = resolveTrioDishImage(dishesList[1] || DEFAULT_MENU_DU_JOUR_DISHES[1], 1, items);
              const img3Url = resolveTrioDishImage(dishesList[2] || DEFAULT_MENU_DU_JOUR_DISHES[2], 2, items);

              return (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-black/40 p-2 rounded-2xl border border-brand-orange/40 flex flex-col items-center text-center gap-1">
                    <img
                      src={img1Url}
                      alt={plat.dishName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-brand-orange shadow-md"
                    />
                    <span className="text-[8px] font-black uppercase text-brand-orange">1. Plat du Jour</span>
                    <span className="text-[9px] font-bold text-white truncate w-full">{plat.dishName}</span>
                  </div>

                  <div className="bg-black/40 p-2 rounded-2xl border border-amber-500/40 flex flex-col items-center text-center gap-1">
                    <img
                      src={img2Url}
                      alt="Le Fameux Doukounou"
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shadow-md"
                    />
                    <span className="text-[8px] font-black uppercase text-amber-400">2. Doukounou</span>
                    <span className="text-[9px] font-bold text-white truncate w-full">Le Fameux Doukounou</span>
                  </div>

                  <div className="bg-black/40 p-2 rounded-2xl border border-emerald-500/40 flex flex-col items-center text-center gap-1">
                    <img
                      src={img3Url}
                      alt="L'Incontournable Attiéké"
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <span className="text-[8px] font-black uppercase text-emerald-400">3. Attiéké</span>
                    <span className="text-[9px] font-bold text-white truncate w-full">Attiéké Royal</span>
                  </div>
                </div>
              );
            })()}

            {/* Direct Button to 100% Custom Edition Form */}
            {onSwitchToRecipeTab && (
              <button
                type="button"
                onClick={onSwitchToRecipeTab}
                className="w-full bg-brand-gold hover:bg-amber-400 text-brand-brown py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Edit3 size={13} />
                <span>✍️ Modifier les 3 Plats, Photos, Prix & Ingrédients ➔</span>
              </button>
            )}
          </div>

          {/* 1. Publication Timing Selector (Veille au Soir vs Aujourd'hui) */}
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
                <Clock size={16} className="text-brand-orange" /> 1. Moment de Diffusion & Teasing
              </h4>
              <span className="text-[8px] font-bold text-white/50 uppercase">Stratégie 24h</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onChangePlat({ ...plat, publicationTiming: 'TONIGHT_FOR_TOMORROW' });
                }}
                className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                  plat.publicationTiming === 'TONIGHT_FOR_TOMORROW'
                    ? 'bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border-purple-400 text-white shadow-xl shadow-purple-950/40'
                    : 'bg-black/30 border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
                    <Moon size={18} />
                  </span>
                  {plat.publicationTiming === 'TONIGHT_FOR_TOMORROW' && (
                    <span className="text-[8px] font-black uppercase bg-purple-500 text-white px-2 py-0.5 rounded-full">
                      Recommandé
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-white">🌙 La Veille au Soir</p>
                  <p className="text-[9px] text-white/60 mt-0.5 leading-snug">
                    Pour annoncer le menu de demain et ouvrir les précommandes dès 20h.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onChangePlat({ ...plat, publicationTiming: 'TODAY_LUNCH' });
                }}
                className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                  plat.publicationTiming === 'TODAY_LUNCH'
                    ? 'bg-gradient-to-br from-amber-950/80 to-orange-950/80 border-amber-400 text-white shadow-xl shadow-amber-950/40'
                    : 'bg-black/30 border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
                    <Sun size={18} />
                  </span>
                  {plat.publicationTiming === 'TODAY_LUNCH' && (
                    <span className="text-[8px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      Actif
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-white">☀️ Le Matin Même</p>
                  <p className="text-[9px] text-white/60 mt-0.5 leading-snug">
                    Pour booster les ventes directes du midi dès 10h30.
                  </p>
                </div>
              </button>
            </div>

            {/* Custom Day Target Label */}
            {plat.publicationTiming === 'TONIGHT_FOR_TOMORROW' && (
              <div className="bg-purple-950/30 p-3.5 rounded-2xl border border-purple-500/20 space-y-1.5 animate-fade-in">
                <label className="text-[9px] font-black uppercase text-purple-300 flex items-center gap-1.5">
                  <ChefHat size={12} /> Intitulé du jour cible sur l'affiche
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Demain Midi', 'Demain Vendredi', 'Demain Samedi', 'Demain Dimanche', 'Ce Midi'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        onChangePlat({ ...plat, targetDayLabel: label });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all border ${
                        plat.targetDayLabel === label
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-black/40 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Format Selector (Story 9:16 vs Carré 1:1 vs Bannière 16:9) */}
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
              <Layers size={16} className="text-brand-orange" /> 2. Format de Publication
            </h4>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'SQUARE_POST', label: 'Post Carré', ratio: '1:1 (1080x1080)', icon: Square, sub: 'Facebook / Instagram' },
                { id: 'STORY_PORTRAIT', label: 'Story & Statut', ratio: '9:16 (1080x1920)', icon: Smartphone, sub: 'WhatsApp / Story' },
                { id: 'BANNER_LANDSCAPE', label: 'Bannière', ratio: '16:9 (1920x1080)', icon: Globe, sub: 'Couverture / Web' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    onChangePlat({ ...plat, posterFormat: fmt.id as PosterFormat });
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    plat.posterFormat === fmt.id
                      ? 'bg-brand-orange text-white border-brand-orange shadow-lg'
                      : 'bg-black/30 border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  <fmt.icon size={16} className={plat.posterFormat === fmt.id ? 'text-white' : 'text-brand-gold'} />
                  <p className="text-[10px] font-black uppercase mt-1.5 leading-tight">{fmt.label}</p>
                  <p className="text-[8px] opacity-80 mt-0.5">{fmt.ratio}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Poster Layout Selector: Trio (3 plats) vs Plat Unique */}
          <div className="bg-white/5 p-6 rounded-[2.5rem] border-2 border-brand-gold/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
                <LayoutGrid size={16} className="text-brand-orange" /> 3. Composition de l'Affiche
              </h4>
              <span className="text-[8px] font-black uppercase bg-brand-gold text-brand-brown px-2 py-0.5 rounded-full">
                Nouveau
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onChangePlat({ ...plat, posterLayout: 'TRIO_POSTER' });
                }}
                className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                  (plat.posterLayout || 'TRIO_POSTER') === 'TRIO_POSTER'
                    ? 'bg-gradient-to-br from-brand-orange/30 to-amber-950/60 border-brand-gold text-white shadow-xl ring-2 ring-brand-gold/40'
                    : 'bg-black/30 border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 bg-brand-orange/20 text-brand-gold rounded-xl">
                    <ChefHat size={18} />
                  </span>
                  {(plat.posterLayout || 'TRIO_POSTER') === 'TRIO_POSTER' && (
                    <span className="text-[8px] font-black uppercase bg-brand-orange text-white px-2 py-0.5 rounded-full">
                      Recommandé
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>👑 Trio Quotidien</span>
                    <span className="text-[9px] text-brand-gold font-bold">(3 Plats)</span>
                  </p>
                  <p className="text-[9px] text-white/70 mt-1 leading-snug">
                    <strong className="text-brand-gold">En haut et en grand :</strong> le Plat du Jour.<br />
                    <strong className="text-emerald-400">En bas :</strong> le Doukounou et l'Attiéké.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onChangePlat({ ...plat, posterLayout: 'SINGLE_DISH' });
                }}
                className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                  plat.posterLayout === 'SINGLE_DISH'
                    ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-purple-400 text-white shadow-xl ring-2 ring-purple-400/40'
                    : 'bg-black/30 border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
                    <Sparkles size={18} />
                  </span>
                  {plat.posterLayout === 'SINGLE_DISH' && (
                    <span className="text-[8px] font-black uppercase bg-purple-500 text-white px-2 py-0.5 rounded-full">
                      Sélectionné
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>🍲 Plat Unique</span>
                    <span className="text-[9px] text-purple-300 font-bold">(1 Plat)</span>
                  </p>
                  <p className="text-[9px] text-white/70 mt-1 leading-snug">
                    Affiche centrée exclusivement sur le plat cuisiné du jour en format géant.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Graphic Theme Selector (Luxe Noir/Or, Sahélien Ocre, Braisé, Émeraude) */}
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
              <Palette size={16} className="text-brand-orange" /> 4. Ambiance & Thème Graphique
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(themesConfig) as PosterTheme[]).map((themeKey) => {
                const th = themesConfig[themeKey];
                const isSelected = (plat.posterTheme || 'SAHEL_TERRACOTTA') === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => {
                      playSound('pop');
                      onChangePlat({ ...plat, posterTheme: themeKey });
                    }}
                    className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-brand-gold shadow-lg ring-2 ring-brand-gold/40'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${th.bgGradient[0]}, ${th.bgGradient[1]})`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        th.isLightSand ? 'bg-orange-600 text-white' : 'bg-black/40 text-white'
                      }`}>
                        {th.badge}
                      </span>
                      {isSelected && <CheckCircle2 size={14} className={th.isLightSand ? 'text-orange-600' : 'text-brand-gold'} />}
                    </div>
                    <p className={`text-xs font-black ${th.isLightSand ? 'text-amber-950' : 'text-white'}`}>{th.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Text Format Switcher (Format Court Spécial Statut vs Format Long) */}
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
                <MessageSquare size={16} className="text-brand-orange" /> 4. Texte de Diffusion WhatsApp
              </h4>
              <button
                type="button"
                onClick={handleCopyActiveText}
                className="text-[9px] font-black text-white/80 hover:text-white uppercase flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
              >
                {copiedTeaser ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedTeaser ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            {/* Toggle tabs for Short vs Full */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  setTextMode('SHORT_STATUS');
                }}
                className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  textMode === 'SHORT_STATUS'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone size={13} />
                <span>Format Court (Statut &lt; 7 lignes)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  setTextMode('FULL_TEASER');
                }}
                className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  textMode === 'FULL_TEASER'
                    ? 'bg-brand-orange text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <MessageSquare size={13} />
                <span>Format Long (Groupes)</span>
              </button>
            </div>

            {/* Validation Indicator & Regenerate Button */}
            <div className="flex items-center justify-between text-[10px] px-1 gap-2 flex-wrap">
              <span className={`font-bold flex items-center gap-1 ${isStatusSafe ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isStatusSafe ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {isStatusSafe ? 'Parfait pour Statut WhatsApp (< 700 car.)' : 'Texte long : idéal pour Groupes WhatsApp'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateCurrentTexts}
                  className="text-[9px] font-black text-brand-gold hover:text-amber-300 uppercase flex items-center gap-1 bg-brand-gold/10 hover:bg-brand-gold/20 px-2 py-1 rounded-lg border border-brand-gold/30 transition-all active:scale-95"
                  title="Régénérer automatiquement le texte pour ce plat"
                >
                  <RefreshCw size={11} />
                  <span>Régénérer texte</span>
                </button>
                <span className="font-mono text-white/50 text-[9px]">
                  {textLineCount} lig. • {textCharCount} car.
                </span>
              </div>
            </div>

            <textarea
              rows={textMode === 'SHORT_STATUS' ? 6 : 9}
              value={activeText}
              onChange={(e) => {
                const val = e.target.value;
                const isEvening = plat.publicationTiming === 'TONIGHT_FOR_TOMORROW';
                if (textMode === 'SHORT_STATUS') {
                  if (isEvening) {
                    onChangePlat({ ...plat, marketingTextEveningStatusShort: val });
                  } else {
                    onChangePlat({ ...plat, marketingTextStatusShort: val });
                  }
                } else {
                  if (isEvening) {
                    onChangePlat({ ...plat, marketingTextEveningTeaser: val });
                  } else {
                    onChangePlat({ ...plat, marketingTextWhatsApp: val });
                  }
                }
              }}
              className="w-full bg-[#120B09] border border-white/15 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-brand-gold leading-relaxed resize-none shadow-inner"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleBroadcastWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Smartphone size={13} /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => shareToSocialPlatform(activeText, 'facebook')}
                className="bg-[#1877F2] hover:bg-blue-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Facebook size={13} /> Facebook
              </button>
              <button
                type="button"
                onClick={() => shareToSocialPlatform(activeText, 'instagram')}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:opacity-90 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Instagram size={13} /> Instagram
              </button>
              <button
                type="button"
                onClick={() => shareToSocialPlatform(activeText, 'tiktok')}
                className="bg-black hover:bg-zinc-800 border border-white/20 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Music size={13} className="text-cyan-400" /> TikTok
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Live HD Canvas Poster Preview & Direct Share Hub (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          
          <div className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6 flex flex-col items-center">
            
            {/* Header with Dimensions & Refresh */}
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[9px] font-black uppercase text-brand-gold flex items-center gap-1.5">
                  <Eye size={14} /> Rendu Graphique HD
                </span>
                <p className="text-[10px] text-white/60 font-bold">
                  {getFormatDimensions(plat.posterFormat || 'SQUARE_POST').label}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={drawPosterCanvas}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                  <RefreshCw size={12} className={isGeneratingCanvas ? 'animate-spin' : ''} />
                  <span>Actualiser</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPoster}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Download size={14} />
                  <span>Télécharger PNG</span>
                </button>
              </div>
            </div>

            {/* Live Canvas View Container (Scaled cleanly to fit screen) */}
            <div className="w-full flex justify-center items-center py-2 overflow-hidden bg-black/40 rounded-3xl p-4 border border-white/5 shadow-inner">
              <div 
                className="relative shadow-2xl rounded-2xl overflow-hidden border-2 border-brand-gold/30 transition-all duration-300"
                style={{
                  maxWidth: plat.posterFormat === 'STORY_PORTRAIT' ? '380px' : plat.posterFormat === 'BANNER_LANDSCAPE' ? '650px' : '480px',
                  width: '100%'
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto block rounded-2xl"
                />
              </div>
            </div>

            {/* Step by Step Guide for WhatsApp Status */}
            <div className="w-full bg-gradient-to-r from-emerald-950/40 via-brand-brown/40 to-black/40 p-5 rounded-2xl border border-emerald-500/30 flex items-start gap-4">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0 mt-0.5">
                <Info size={22} />
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-black uppercase text-emerald-300">
                  📱 Comment publier l'affiche &amp; le texte sur votre Statut WhatsApp :
                </h5>
                <ol className="text-[10px] text-white/80 leading-relaxed list-decimal list-inside space-y-1">
                  <li>Cliquez sur **« Partager Affiche + Texte Direct »** ci-dessous pour ouvrir directement WhatsApp sur mobile.</li>
                  <li>Sur ordinateur : Téléchargez l'affiche PNG puis copiez le texte en 1 clic.</li>
                  <li>Sélectionnez l'image dans votre Statut WhatsApp et collez le texte en légende !</li>
                </ol>
              </div>
            </div>

            {/* Big Action Buttons */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleShareImageAndTextDirect}
                disabled={isSharing}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSharing ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Partager Affiche + Texte Direct</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPoster}
                className="w-full bg-brand-orange hover:bg-orange-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-brand-orange/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} />
                <span>Télécharger l'Image PNG HD</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
