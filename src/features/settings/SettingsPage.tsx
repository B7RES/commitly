import { useRef } from 'react'
import { ArrowUpFromLine, Database, Download, FileJson, LockKeyhole, Trash2 } from 'lucide-react'

interface SettingsPageProps {
    commitmentsCount: number
    commitmentTermsCount: number
    paymentHistoryCount: number
    onExportBackup: () => Promise<void>
    onImportBackup: (file?: File) => Promise<void>
    onConfirmRestoreBackup: () => Promise<void>
    onCancelRestoreBackup: () => void
    onClearAllData: () => Promise<void>
    backupError: string | null
    pendingBackupPreview: {
        fileName: string
        version: number
        exportedAt: string
        commitmentsCount: number
        commitmentTermsCount: number
        paymentHistoryCount: number
    } | null
    isRestoringBackup: boolean
}

export function SettingsPage({
    commitmentsCount,
    commitmentTermsCount,
    paymentHistoryCount,
    onExportBackup,
    onImportBackup,
    onConfirmRestoreBackup,
    onCancelRestoreBackup,
    onClearAllData,
    backupError,
    pendingBackupPreview,
    isRestoringBackup
}: SettingsPageProps) {
    const fileRef = useRef<HTMLInputElement>(null)

    return <section className="page-wrap"><div className="page-heading"><div><div className="eyebrow">IMPOSTAZIONI</div><h1>Impostazioni</h1><p>Gestisci backup e dati dell'app.</p></div></div><div className="settings-grid"><section className="panel setting-panel"><div className="setting-title"><div className="setting-icon"><Database size={19} /></div><div><h2>Riepilogo dati</h2><p>Controlla quanti elementi sono presenti nell'app.</p></div></div><div className="setting-stats"><div><span>Impegni</span><b>{commitmentsCount}</b></div><div><span>Termini</span><b>{commitmentTermsCount}</b></div><div><span>Storico pagamenti</span><b>{paymentHistoryCount}</b></div></div><div className="privacy-explain"><LockKeyhole size={17} /><span>Usa backup periodici per mantenere una copia aggiornata dei tuoi dati.</span></div></section>
        <section className="panel setting-panel"><div className="setting-title"><div className="setting-icon"><FileJson size={19} /></div><div><h2>Backup e ripristino</h2><p>Salva una copia dei dati o ripristinala.</p></div></div><div className="setting-actions"><button className="secondary-btn" onClick={() => void onExportBackup()}><Download size={16} /> Esporta backup JSON</button><button className="secondary-btn" onClick={() => fileRef.current?.click()}><ArrowUpFromLine size={16} /> Importa backup JSON</button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={event => { void onImportBackup(event.target.files?.[0]); event.currentTarget.value = '' }} /></div>
            <p className="setting-footnote">Il ripristino sostituisce tutti i dati applicativi correnti (impegni, termini e storico pagamenti).</p>
            {backupError && <div className="backup-error">{backupError}</div>}
            {pendingBackupPreview && <div className="backup-preview"><h3>Anteprima ripristino</h3><div className="setting-stats"><div><span>File</span><b>{pendingBackupPreview.fileName}</b></div><div><span>Versione</span><b>{pendingBackupPreview.version}</b></div><div><span>Esportato il</span><b>{new Date(pendingBackupPreview.exportedAt).toLocaleString('it-IT')}</b></div><div><span>Impegni</span><b>{pendingBackupPreview.commitmentsCount}</b></div><div><span>Termini</span><b>{pendingBackupPreview.commitmentTermsCount}</b></div><div><span>Storico</span><b>{pendingBackupPreview.paymentHistoryCount}</b></div></div><div className="setting-actions"><button className="secondary-btn" onClick={onCancelRestoreBackup}>Annulla</button><button className="danger-btn" disabled={isRestoringBackup} onClick={() => void onConfirmRestoreBackup()}>{isRestoringBackup ? 'Ripristino in corso...' : 'Conferma ripristino'}</button></div></div>}
        </section>
        <section className="panel setting-panel danger-panel"><div className="setting-title"><div className="setting-icon danger"><Trash2 size={19} /></div><div><h2>Elimina tutti i dati</h2><p>Rimuove definitivamente impegni, termini e storico.</p></div></div><button className="danger-btn" onClick={() => void onClearAllData()}><Trash2 size={16} /> Elimina tutti i dati</button></section>
    </div></section>
}
