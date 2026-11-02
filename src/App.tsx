import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CalendarPage } from './pages/CalendarPage'
import { AppLayout } from './app/layout/AppLayout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { CommitmentsPage } from './features/commitments/CommitmentsPage'
import { CommitmentDetailPage } from './features/commitments/CommitmentDetailPage'
import { CommitmentEditorPage } from './features/commitments/CommitmentEditorPage'
import { HistoryPage } from './features/history/HistoryPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { useSettingsController } from './features/settings/useSettingsController'
import { useCommitmentList } from './hooks/useCommitmentList'

function NotFoundPage() {
    return <section className="page-wrap"><div className="panel notfound-panel"><div className="eyebrow">404</div><h1>Pagina non trovata</h1><p>La rotta richiesta non esiste.</p><Link className="primary-btn" to="/">Torna alla Dashboard</Link></div></section>
}

function CommitmentRoute({ onShowNotImplemented }: { onShowNotImplemented: (message: string) => void }) {
    const params = useParams<{ id: string }>()
    const navigate = useNavigate()
    if (!params.id) return <Navigate to="/commitments" replace />
    return <CommitmentDetailPage commitmentId={params.id} onBack={() => navigate('/commitments')} onEdit={id => navigate(`/commitments/${id}/edit`)} onShowNotImplemented={onShowNotImplemented} />
}

function CommitmentEditorRoute({ mode }: { mode: 'create' | 'edit' }) {
    const params = useParams<{ id: string }>()
    if (mode === 'edit' && !params.id) return <Navigate to="/commitments" replace />
    return <CommitmentEditorPage mode={mode} commitmentId={params.id} />
}

export function App() {
    const settings = useSettingsController()
    const activeCommitments = useCommitmentList({ status: 'active' })
    const navigate = useNavigate()
    const location = useLocation()

    const [uiToast, setUiToast] = useState<string | null>(null)

    useEffect(() => {
        const flashState = location.state as { flash?: string } | null
        if (!flashState?.flash) return
        showUiToast(flashState.flash)
        navigate(location.pathname, { replace: true, state: null })
    }, [location.pathname, location.state, navigate])

    const showUiToast = (value: string) => {
        setUiToast(value)
        window.setTimeout(() => {
            setUiToast(current => current === value ? null : current)
        }, 2400)
    }

    const openNewFromTopbar = () => {
        navigate('/commitments/new')
    }

    const openCommitmentFromCalendar = (commitmentId: string) => {
        navigate(`/commitments/${commitmentId}`)
    }

    return <>
        <AppLayout
            activePaymentsCount={activeCommitments.total}
            onOpenNewPayment={openNewFromTopbar}
        >
            <Routes>
                <Route path="/" element={<DashboardPage onGoToPayments={() => navigate('/commitments')} />} />
                <Route path="/commitments" element={<CommitmentsPage onNewCommitment={() => navigate('/commitments/new')} onOpenCommitment={id => navigate(`/commitments/${id}`)} />} />
                <Route path="/commitments/new" element={<CommitmentEditorRoute mode="create" />} />
                <Route path="/commitments/:id" element={<CommitmentRoute onShowNotImplemented={showUiToast} />} />
                <Route path="/commitments/:id/edit" element={<CommitmentEditorRoute mode="edit" />} />
                <Route path="/calendar" element={<CalendarPage onOpenCommitment={openCommitmentFromCalendar} onAddPayment={() => navigate('/commitments/new')} />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage commitmentsCount={settings.commitmentsCount} commitmentTermsCount={settings.commitmentTermsCount} paymentHistoryCount={settings.paymentHistoryCount} onExportBackup={settings.exportBackup} onImportBackup={settings.importBackup} onConfirmRestoreBackup={settings.confirmRestoreBackup} onCancelRestoreBackup={settings.cancelRestoreBackup} onClearAllData={settings.clearAllData} backupError={settings.backupError} pendingBackupPreview={settings.pendingBackupPreview} isRestoringBackup={settings.isRestoringBackup} />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AppLayout>

        {(settings.toast || uiToast) && <div className="toast"><Check size={16} />{settings.toast || uiToast}</div>}
    </>
}
