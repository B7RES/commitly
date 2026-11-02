import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../services/database'
import {
    exportBackupV2,
    parseAndValidateBackupV2,
    restoreBackupV2,
    type AppBackupDataV2,
    type BackupPreview
} from '../../services/backupService'

export function useSettingsController() {
    const commitmentsCount = useLiveQuery(() => db.commitments.count(), []) ?? 0
    const commitmentTermsCount = useLiveQuery(() => db.commitmentTerms.count(), []) ?? 0
    const paymentHistoryCount = useLiveQuery(() => db.paymentHistory.count(), []) ?? 0

    const [toast, setToast] = useState<string | null>(null)
    const [backupError, setBackupError] = useState<string | null>(null)
    const [pendingBackupData, setPendingBackupData] = useState<AppBackupDataV2 | null>(null)
    const [pendingBackupPreview, setPendingBackupPreview] = useState<BackupPreview | null>(null)
    const [isRestoringBackup, setIsRestoringBackup] = useState(false)

    const notify = (message: string) => {
        setToast(message)
        window.setTimeout(() => {
            setToast(current => current === message ? null : current)
        }, 2600)
    }

    async function exportBackup() {
        setBackupError(null)
        const backup = await exportBackupV2()

        const blob = new Blob([backup.content], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = backup.filename
        anchor.click()
        URL.revokeObjectURL(url)
        notify('Backup esportato')
    }

    async function importBackup(file?: File) {
        if (!file) return
        setBackupError(null)

        try {
            const parsed = parseAndValidateBackupV2(await file.text(), file.name)
            setPendingBackupData(parsed.data)
            setPendingBackupPreview(parsed.preview)
        } catch (error: unknown) {
            setPendingBackupData(null)
            setPendingBackupPreview(null)
            setBackupError(error instanceof Error ? error.message : 'Impossibile leggere il file backup')
        }
    }

    async function confirmRestoreBackup() {
        if (!pendingBackupData || !pendingBackupPreview) return
        if (!window.confirm(`Confermi il ripristino del backup "${pendingBackupPreview.fileName}"? I dati correnti verranno sostituiti.`)) return

        setBackupError(null)
        setIsRestoringBackup(true)

        try {
            await restoreBackupV2(pendingBackupData)
            setPendingBackupData(null)
            setPendingBackupPreview(null)
            notify('Backup ripristinato con successo')
        } catch (error: unknown) {
            setBackupError(error instanceof Error ? error.message : 'Ripristino fallito')
        } finally {
            setIsRestoringBackup(false)
        }
    }

    function cancelRestoreBackup() {
        setPendingBackupData(null)
        setPendingBackupPreview(null)
        setBackupError(null)
    }

    async function clearAllData() {
        if (!window.confirm('ATTENZIONE: eliminare definitivamente tutti i dati locali? Esporta prima un backup se vuoi conservarli.')) return

        await db.transaction('rw', db.commitments, db.commitmentTerms, db.paymentHistory, async () => {
            await db.paymentHistory.clear()
            await db.commitmentTerms.clear()
            await db.commitments.clear()
        })

        notify('Dati locali eliminati')
    }

    return {
        commitmentsCount,
        commitmentTermsCount,
        paymentHistoryCount,
        backupError,
        pendingBackupPreview,
        isRestoringBackup,
        toast,
        exportBackup,
        importBackup,
        confirmRestoreBackup,
        cancelRestoreBackup,
        clearAllData
    }
}
