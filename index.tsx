import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMsg: error?.message || 'Erreur inattendue au démarrage',
    };
  }

  handleRepair = () => {
    if (typeof (window as any).__repairKhadysCache === 'function') {
      (window as any).__repairKhadysCache();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1A0F0D] text-white flex flex-col items-center justify-center p-6 text-center">
          <img
            src="/logo.png"
            alt="Khady's Food"
            className="w-20 h-20 rounded-full border-2 border-brand-gold mb-4 object-cover"
          />
          <h1 className="text-lg font-black uppercase italic text-brand-gold mb-2">
            Mise à jour détectée
          </h1>
          <p className="text-xs text-white/70 max-w-xs mb-6">
            Une nouvelle version de Khady&apos;s Food &amp; Event est prête. Appuyez ci-dessous pour rafraîchir votre navigateur Chrome.
          </p>
          <button
            onClick={this.handleRepair}
            className="bg-brand-orange text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all"
          >
            ⚡ Ouvrir l&apos;application maintenant
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Erreur critique : Élément racine introuvable.');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);

// Nettoyage du flag de réparation une fois le montage réussi
try {
  sessionStorage.removeItem('__khadys_sw_repaired');
} catch {
  // Ignorer
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});

        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(() => {});
  });
}
