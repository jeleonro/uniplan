import { useEffect, useState } from 'react'
import { FlaskConical, Link2, RefreshCw, Upload, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  connectDemo,
  connectWithIcsUrl,
  disconnect,
  getConnection,
  importIcsFile,
  syncNow,
} from '../services/blackboardSyncService'

const MODE_LABEL = { ics: 'Enlace .ics', file: 'Archivo .ics', demo: 'Datos de demo' }

const secondaryBtn =
  'flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 disabled:opacity-60'

export default function BlackboardCard({ onChanged }) {
  const { user } = useAuth()
  const [connection, setConnection] = useState(null)
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getConnection()
      .then(setConnection)
      .catch(() => {})
  }, [])

  const lastSync = connection?.last_synced_at
    ? new Date(connection.last_synced_at).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  async function run(action, { refresh = true } = {}) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await action()
      if (refresh) {
        setConnection(await getConnection())
        setMessage(
          `Sincronizado: ${result.courses} cursos, ${result.tasks} entregas, ${result.sessions} clases.`
        )
        setUrl('')
      }
      onChanged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) run(() => importIcsFile(user.id, file))
  }

  async function handleDisconnect(removeData) {
    await run(() => disconnect(user.id, { removeData }), { refresh: false })
    setConnection(null)
    setMessage(removeData ? 'Desconectado. Se quitaron los datos de Blackboard.' : 'Desconectado.')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <RefreshCw size={18} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Blackboard UCV</p>
          <p className="text-sm text-slate-500">
            {connection
              ? `Conectado${lastSync ? ` · ${lastSync}` : ''}`
              : 'Conecta tu calendario (opcional)'}
          </p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 pb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Conectar Blackboard UCV</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-slate-400">
                <X size={22} />
              </button>
            </div>

            {connection ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-indigo-50 p-4 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-indigo-600">Conectado</span> ·{' '}
                    {MODE_LABEL[connection.mode]}
                  </p>
                  {lastSync && <p className="mt-1">Última sincronización: {lastSync}</p>}
                </div>

                {connection.mode === 'file' ? (
                  <label className={`${secondaryBtn} cursor-pointer`}>
                    <Upload size={16} />
                    Importar .ics actualizado
                    <input type="file" accept=".ics,text/calendar" className="hidden" onChange={handleFile} disabled={busy} />
                  </label>
                ) : (
                  <button
                    onClick={() => run(() => syncNow(user.id, connection))}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    <RefreshCw size={18} className={busy ? 'animate-spin' : ''} />
                    {busy ? 'Sincronizando...' : 'Sincronizar ahora'}
                  </button>
                )}

                <button onClick={() => handleDisconnect(false)} disabled={busy} className={secondaryBtn}>
                  Desconectar y conservar los datos
                </button>
                <button
                  onClick={() => handleDisconnect(true)}
                  disabled={busy}
                  className="w-full rounded-xl py-3 text-sm font-medium text-red-600 disabled:opacity-60"
                >
                  Desconectar y borrar los datos de Blackboard
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <p className="text-sm leading-relaxed text-slate-500">
                  En Blackboard abre <strong>Calendario</strong>, entra a la configuración del
                  calendario, elige <strong>Compartir calendario</strong> y copia el enlace que
                  termina en <strong>.ics</strong>. Es un enlace privado: no lo compartas con nadie.
                  La app nunca te pide tu contraseña de Blackboard.
                </p>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Enlace del calendario (.ics)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ucv.blackboard.com/..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => run(() => connectWithIcsUrl(user.id, url))}
                  disabled={busy || !url.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-60"
                >
                  <Link2 size={18} />
                  {busy ? 'Conectando...' : 'Conectar y sincronizar'}
                </button>

                <label className={`${secondaryBtn} cursor-pointer`}>
                  <Upload size={16} />
                  Subir archivo .ics
                  <input type="file" accept=".ics,text/calendar" className="hidden" onChange={handleFile} disabled={busy} />
                </label>

                <button onClick={() => run(() => connectDemo(user.id))} disabled={busy} className={secondaryBtn}>
                  <FlaskConical size={16} />
                  Probar con datos de Blackboard UCV (demo)
                </button>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {message && <p className="mt-4 text-sm text-indigo-600">{message}</p>}
          </div>
        </div>
      )}
    </>
  )
}