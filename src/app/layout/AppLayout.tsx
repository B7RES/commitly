import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Activity, CalendarDays, CreditCard, LayoutDashboard, Menu, Plus, Settings, Wallet, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

interface AppLayoutProps {
    activePaymentsCount: number
    onOpenNewPayment: () => void
    children: ReactNode
}

export function AppLayout({ activePaymentsCount, onOpenNewPayment, children }: AppLayoutProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
    const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)
    const mobileDrawerCloseRef = useRef<HTMLButtonElement | null>(null)
    const hadDrawerOpenedRef = useRef(false)

    const isCommitmentsRoute = location.pathname === '/commitments' || location.pathname.startsWith('/commitments/')

    const closeMobileDrawer = () => {
        setMobileDrawerOpen(false)
    }

    useEffect(() => {
        closeMobileDrawer()
    }, [location.pathname])

    useEffect(() => {
        if (mobileDrawerOpen) {
            hadDrawerOpenedRef.current = true
            document.body.classList.add('drawer-open')
            mobileDrawerCloseRef.current?.focus()
            return
        }

        document.body.classList.remove('drawer-open')
        if (hadDrawerOpenedRef.current) mobileMenuButtonRef.current?.focus()
    }, [mobileDrawerOpen])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || !mobileDrawerOpen) return
            closeMobileDrawer()
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [mobileDrawerOpen])

    useEffect(() => {
        return () => {
            document.body.classList.remove('drawer-open')
        }
    }, [])

    return <div className="app-shell">
        <aside className="sidebar desktop-sidebar">
            <div className="brand"><div className="brand-mark"><Wallet size={21} /></div><div><strong>payments</strong><span>GESTIONE IMPEGNI</span></div></div>
            <div className="nav-label">MENU</div>
            <nav>
                <NavLink to="/" end className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} /><span>Panoramica</span></NavLink>
                <NavLink to="/calendar" className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><CalendarDays size={18} /><span>Calendario</span></NavLink>
                <NavLink to="/commitments" className={() => `nav-button ${isCommitmentsRoute ? 'active' : ''}`}><CreditCard size={18} /><span>Impegni</span><small>{activePaymentsCount}</small></NavLink>
                <NavLink to="/history" className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><Activity size={18} /><span>Cronologia</span></NavLink>
            </nav>
            <div className="sidebar-bottom">
                <NavLink to="/settings" className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><Settings size={18} /><span>Impostazioni</span></NavLink>
                <div className="version">Versione 0.2.0</div>
            </div>
        </aside>
        <div
            className={`mobile-drawer-overlay ${mobileDrawerOpen ? 'open' : ''}`}
            aria-hidden={!mobileDrawerOpen}
            onClick={closeMobileDrawer}
        />
        <aside
            id="mobile-navigation-drawer"
            className={`mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`}
            role="dialog"
            aria-label="Menu di navigazione"
            aria-modal="true"
            aria-hidden={!mobileDrawerOpen}
        >
            <div className="mobile-drawer-header">
                <div className="brand"><div className="brand-mark"><Wallet size={21} /></div><div><strong>payments</strong><span>GESTIONE IMPEGNI</span></div></div>
                <button
                    ref={mobileDrawerCloseRef}
                    className="icon-btn"
                    onClick={closeMobileDrawer}
                    aria-label="Chiudi menu"
                >
                    <X size={18} />
                </button>
            </div>
            <div className="nav-label">MENU</div>
            <nav>
                <NavLink to="/" end className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} /><span>Panoramica</span></NavLink>
                <NavLink to="/calendar" className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><CalendarDays size={18} /><span>Calendario</span></NavLink>
                <NavLink to="/commitments" className={() => `nav-button ${isCommitmentsRoute ? 'active' : ''}`}><CreditCard size={18} /><span>Impegni</span><small>{activePaymentsCount}</small></NavLink>
                <NavLink to="/history" className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><Activity size={18} /><span>Cronologia</span></NavLink>
            </nav>
            <div className="sidebar-bottom">
                <NavLink to="/settings" className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}><Settings size={18} /><span>Impostazioni</span></NavLink>
                <div className="version">Versione 0.2.0</div>
            </div>
        </aside>
        <main className="main-content">
            <header className="topbar"><div className="topbar-left">
                <button
                    ref={mobileMenuButtonRef}
                    className="icon-btn mobile-menu-btn"
                    onClick={() => setMobileDrawerOpen(true)}
                    aria-label="Apri menu"
                    aria-expanded={mobileDrawerOpen}
                    aria-controls="mobile-navigation-drawer"
                >
                    <Menu size={18} />
                </button>
                <div className="mobile-brand">
                    <div className="brand-mark">
                        <Wallet size={19} />
                    </div>
                    <strong>payments</strong>
                </div>
            </div>
                <div className="topbar-right">
                    <button className="icon-btn mobile-settings" onClick={() => navigate('/settings')} aria-label="Impostazioni">
                        <Settings size={18} />
                    </button>
                    <button className="primary-btn small" onClick={onOpenNewPayment}>
                        <Plus size={17} /> Nuovo impegno</button>
                </div>
            </header>
            {children}
            <footer className="footer"><span>payments</span></footer>
        </main>
    </div>
}
