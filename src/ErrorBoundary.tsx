import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled error in app render:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6"
          style={{ background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)' }}>
          <div className="bg-white w-full max-w-xs p-8 shadow-2xl rounded-3xl text-center">
            <img src="/logo-public-burger.png" alt="Public Burger" className="h-12 mb-4 mx-auto" />
            <p className="text-sm font-semibold text-[#1a0a10] mb-2">Qualcosa è andato storto</p>
            <p className="text-[12px] text-black/40 mb-6">Ricarica la pagina per riprovare.</p>
            <button onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-[#CF6990] transition-colors duration-300 rounded-2xl">
              Ricarica
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
