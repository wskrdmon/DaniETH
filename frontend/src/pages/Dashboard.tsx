import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// ─── Types (listos para conectar con el backend) ──────────────────────────────

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type VulnStatus = 'Open' | 'In Progress' | 'Resolved';

export interface Vulnerability {
  cveId: string;
  description: string;
  asset: string;
  severity: Severity;
  status: VulnStatus;
  cvss: number;
  publishedDate: string;
}

export interface DashboardStats {
  riskScore: number | null;
  criticalCount: number;
  highCount: number;
  resolvedThisMonth: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<Severity, { badge: string; color: string }> = {
  CRITICAL: { badge: 'bg-[--severity-critical]/15 text-[--severity-critical] ring-1 ring-[--severity-critical]/30', color: 'var(--severity-critical)' },
  HIGH:     { badge: 'bg-[--severity-high]/15 text-[--severity-high] ring-1 ring-[--severity-high]/30',             color: 'var(--severity-high)' },
  MEDIUM:   { badge: 'bg-[--severity-medium]/15 text-[--severity-medium] ring-1 ring-[--severity-medium]/30',       color: 'var(--severity-medium)' },
  LOW:      { badge: 'bg-[--severity-low]/15 text-[--severity-low] ring-1 ring-[--severity-low]/30',               color: 'var(--severity-low)' },
};

const STATUS_COLORS: Record<VulnStatus, string> = {
  Open:        'text-[--severity-critical]',
  'In Progress': 'text-[--severity-high]',
  Resolved:    'text-[--severity-low]',
};

function riskColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score >= 9) return 'var(--severity-critical)';
  if (score >= 7) return 'var(--severity-high)';
  if (score >= 4) return 'var(--severity-medium)';
  return 'var(--severity-low)';
}

function riskLabel(score: number | null): string {
  if (score === null) return '—';
  if (score >= 9) return 'CRITICAL';
  if (score >= 7) return 'HIGH';
  if (score >= 4) return 'MODERATE';
  return 'LOW';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${SEVERITY_STYLES[severity].badge}`}>
      {severity}
    </span>
  );
}

function StatCard({ value, label, color, icon }: { value: number | null; label: string; color: string; icon: string }) {
  return (
    <div className="rounded-xl p-5 border transition-all duration-200 hover:border-[--border-secondary]"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="text-xl mb-3">{icon}</div>
      <div className="text-3xl font-bold mb-1" style={{ color: value !== null ? color : 'var(--text-muted)' }}>
        {value !== null ? value : '—'}
      </div>
      <div className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function RiskGauge({ score }: { score: number | null }) {
  const color = riskColor(score);
  const pct = score !== null ? (score / 10) * 100 : 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="rounded-xl p-6 border flex flex-col items-center justify-center min-h-[180px] transition-all duration-200 hover:border-[--border-secondary]"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
        Risk Score
      </div>
      <div className="relative w-28 h-28 mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-primary)" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {score !== null ? score : '—'}
          </span>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>/10</span>
        </div>
      </div>
      <div className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
        {score !== null ? riskLabel(score) : '—'}
      </div>
    </div>
  );
}

function VulnDrawer({ vuln, onClose }: { vuln: Vulnerability | null; onClose: () => void }) {
  const { t } = useTranslation();
  if (!vuln) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col shadow-2xl overflow-y-auto"
        style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('pages.dashboard.vulnDetail')}</div>
            <h2 className="text-base font-bold font-mono" style={{ color: 'var(--accent-cyan)' }}>{vuln.cveId}</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.08]"
            style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <SeverityBadge severity={vuln.severity} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>CVSS</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{vuln.cvss}</span>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              {t('pages.dashboard.description2')}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{vuln.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t('pages.dashboard.asset'), value: vuln.asset, mono: true },
              { label: t('pages.dashboard.status'), value: vuln.status, mono: false },
              { label: t('pages.dashboard.published'), value: vuln.publishedDate, mono: false, full: true },
            ].map(({ label, value, mono, full }) => (
              <div key={label} className={`rounded-lg p-3 border ${full ? 'col-span-2' : ''}`}
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className={`text-sm font-medium break-all ${mono ? 'font-mono' : ''}`}
                  style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,212,255,0.2)' }}>
              🔍 {t('pages.dashboard.analyzeWithAI')}
            </button>
            <button className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
              📋 {t('pages.dashboard.viewInHub')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4 opacity-30">📭</div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation();
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

  // TODO: reemplazar con llamada real a la API via Axios
  const stats: DashboardStats = {
    riskScore: null,
    criticalCount: 0,
    highCount: 0,
    resolvedThisMonth: 0,
  };

  // TODO: reemplazar con datos reales del backend
  const vulnerabilities: Vulnerability[] = [];

  const openVulnDrawer = (cveId: string) => {
    setSelectedVuln(vulnerabilities.find((v) => v.cveId === cveId) ?? null);
  };

  return (
    <div className="min-h-full space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          📊 {t('pages.dashboard.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('pages.dashboard.description')}
        </p>
      </div>

      {/* Risk Gauge + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <RiskGauge score={stats.riskScore} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard value={stats.criticalCount || null} label={t('pages.dashboard.criticalIssues')} color="var(--severity-critical)" icon="🔴" />
          <StatCard value={stats.highCount || null} label={t('pages.dashboard.highPriority')} color="var(--severity-high)" icon="🟠" />
          <StatCard value={stats.resolvedThisMonth || null} label={t('pages.dashboard.resolvedThisMonth')} color="var(--severity-low)" icon="✅" />
        </div>
      </div>

      {/* Tabla de vulnerabilidades */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            📋 {t('pages.dashboard.recentVulnerabilities')}
          </h2>
          <button className="text-xs font-medium transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--accent-cyan)', border: '1px solid transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {t('pages.dashboard.viewAll')} →
          </button>
        </div>

        {vulnerabilities.length === 0 ? (
          <EmptyState
            message={t('pages.dashboard.noData')}
            hint={t('pages.dashboard.noDataHint')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left px-5 py-3 font-semibold">{t('pages.dashboard.cveId')}</th>
                  <th className="text-left px-5 py-3 font-semibold">{t('pages.dashboard.description2')}</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">{t('pages.dashboard.asset')}</th>
                  <th className="text-left px-5 py-3 font-semibold">{t('pages.dashboard.severity')}</th>
                  <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">{t('pages.dashboard.status')}</th>
                </tr>
              </thead>
              <tbody>
                {vulnerabilities.map((vuln) => (
                  <tr key={vuln.cveId}
                    className="group cursor-pointer transition-colors"
                    style={{ borderTop: '1px solid var(--border-primary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => openVulnDrawer(vuln.cveId)}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-xs" style={{ color: 'var(--accent-cyan)' }}>{vuln.cveId}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[220px] truncate" style={{ color: 'var(--text-secondary)' }}>{vuln.description}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{vuln.asset}</span>
                    </td>
                    <td className="px-5 py-3.5"><SeverityBadge severity={vuln.severity} /></td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`text-xs font-semibold ${STATUS_COLORS[vuln.status]}`}>{vuln.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VulnDrawer vuln={selectedVuln} onClose={() => setSelectedVuln(null)} />
    </div>
  );
}