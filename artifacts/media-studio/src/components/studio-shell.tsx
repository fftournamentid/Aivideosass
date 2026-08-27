import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react';
import { ArrowRight, Clapperboard, Image, Library, Menu, Music2, PanelLeftClose, Settings, Sparkles, UserRound, X, Zap } from 'lucide-react';
import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';

type AuthContextValue = {
  isGuest: boolean;
  requireAuth: (action?: string) => boolean;
  openAuth: (action?: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useStudioAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useStudioAuth must be used inside StudioShell');
  return context;
}

const navItems = [
  { href: '/', label: 'Video studio', icon: Clapperboard },
  { href: '/image-studio', label: 'Image studio', icon: Image },
  { href: '/music-studio', label: 'Music + SFX', icon: Music2 },
  { href: '/vault', label: 'Media vault', icon: Library },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-brand-home">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl border border-primary/40 bg-primary/10">
        <span className="absolute size-14 rounded-full border border-primary/25" />
        <span className="absolute size-5 rounded-full bg-primary shadow-[0_0_22px_hsl(var(--primary)/.7)]" />
        <span className="absolute h-px w-12 rotate-45 bg-primary/50" />
      </span>
      <span>
        <span className="block font-serif text-sm font-bold tracking-tight text-foreground">LUMEN</span>
        <span className="block font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">AI media generation</span>
      </span>
    </Link>
  );
}

function AuthModal({ action, onClose }: { action: string; onClose: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true" data-testid="modal-auth">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-card-border bg-card shadow-2xl shadow-black/40 animate-rise">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid="button-close-auth">
          <X className="size-4" />
        </button>
        <div className="border-b border-border bg-[radial-gradient(circle_at_85%_15%,hsl(var(--primary)/.18),transparent_35%)] px-7 pb-6 pt-8">
          <div className="mb-5 grid size-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Zap className="size-5" /></div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-primary">Continue your session</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">{action || 'Keep creating'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Save your projects, preserve generation history, and keep your creative queue moving.</p>
        </div>
        <div className="space-y-4 px-7 py-6" data-testid="form-auth">
          <div className="flex rounded-lg border border-border bg-background/50 p-1">
            <button type="button" onClick={() => setMode('signin')} className={`flex-1 rounded-md py-2 text-sm ${mode === 'signin' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`} data-testid="button-auth-signin">Sign in</button>
            <button type="button" onClick={() => setMode('signup')} className={`flex-1 rounded-md py-2 text-sm ${mode === 'signup' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`} data-testid="button-auth-signup">Create account</button>
          </div>
          <Link href={mode === 'signin' ? '/sign-in' : '/sign-up'} onClick={onClose} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-auth-submit">
            {mode === 'signin' ? 'Enter studio' : 'Start creating'} <ArrowRight className="size-4" />
          </Link>
          <p className="text-center text-[11px] text-muted-foreground">Guest preview stays free. No card required.</p>
        </div>
      </div>
    </div>
  );
}

export function StudioShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 30000 } });
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState('Sign in to continue');
  const isGuest = isLoaded && !isSignedIn;
  const openAuth = (action = 'Sign in to continue') => { setAuthAction(action); setAuthOpen(true); };
  const requireAuth = (action = 'Sign in to continue') => { if (isGuest) { openAuth(action); return false; } return true; };

  return (
    <AuthContext.Provider value={{ isGuest, requireAuth, openAuth }}>
      <div className="min-h-[100dvh] bg-background text-foreground">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between px-2"><Brand /><button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden" data-testid="button-close-sidebar"><PanelLeftClose className="size-4" /></button></div>
          <div className="mt-10 px-2 font-mono text-[10px] uppercase tracking-[.22em] text-muted-foreground">Workspace</div>
          <nav className="mt-3 space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location === item.href;
              return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-primary/12 font-semibold text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}>
                <Icon className={`size-[17px] ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} /> {item.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />}
              </Link>;
            })}
          </nav>
          <div className="mt-auto space-y-4">
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Studio plan</span><Sparkles className="size-3.5 text-primary" /></div>
              <div className="mt-3 flex items-end justify-between"><span className="font-serif text-xl font-semibold">240</span><span className="pb-0.5 font-mono text-[10px] text-muted-foreground">credits left</span></div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[68%] rounded-full bg-primary" /></div>
              <button onClick={() => openAuth('Upgrade your creative capacity')} className="mt-3 flex w-full items-center justify-between text-xs font-semibold text-primary hover:text-accent" data-testid="button-upgrade-plan">Explore Studio+ <ArrowRight className="size-3.5" /></button>
            </div>
            <nav className="space-y-1">
              <Link href="/settings" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${location === '/settings' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid="link-nav-settings"><Settings className="size-[17px]" /> Settings</Link>
              <button onClick={() => isGuest ? openAuth('Sign in to your workspace') : signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid="button-account">
                <UserRound className="size-[17px]" /> {isGuest ? 'Guest preview' : 'Sign out'}
              </button>
            </nav>
          </div>
        </aside>
        {mobileOpen && <button className="fixed inset-0 z-30 bg-background/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-overlay-close" />}
        <main className="min-h-[100dvh] pb-20 lg:pl-[248px] lg:pb-0">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl sm:px-8">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden" data-testid="button-open-sidebar"><Menu className="size-5" /></button>
            <div className="hidden items-center gap-2 lg:flex" data-testid="status-system-health"><span className={`size-1.5 rounded-full ${healthQuery.isError ? 'bg-destructive' : 'bg-accent'}`} /><span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">{healthQuery.isError ? 'Preview mode active' : 'All systems nominal'}</span></div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 sm:flex"><Zap className="size-3.5 text-primary" /><span className="font-mono text-[11px] text-muted-foreground">240 credits</span></div>
              {isGuest ? <button onClick={() => openAuth('Welcome back')} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary" data-testid="button-header-signin">Sign in</button> : <div className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary" data-testid="avatar-user">{(user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'U').toUpperCase()}</div>}
            </div>
          </header>
          {children}
        </main>
        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-border bg-sidebar/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden" aria-label="Mobile studio navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-semibold transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`} data-testid={`link-bottom-${item.label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon className="size-4" />
              <span className="truncate">{item.label.replace(' studio', '').replace(' + SFX', '')}</span>
            </Link>;
          })}
        </nav>
        {authOpen && <AuthModal action={authAction} onClose={() => setAuthOpen(false)} />}
      </div>
    </AuthContext.Provider>
  );
}