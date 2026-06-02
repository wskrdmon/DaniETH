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
      <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col shadow-2xl overflow-y-auto"
        style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-primary)' }}>
        
        {/* Header interactivo */}
        <div className="flex items-center justify-between px-8 py-6 sticky top-0 z-10 backdrop-blur-md" 
             style={{ background: 'rgba(10, 14, 23, 0.95)', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 className="text-2xl font-bold font-mono" style={{ color: 'var(--accent-cyan)' }}>{vuln.cveId}</h2>
          </div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-xl hover:bg-white/[0.08]"
            style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div className="flex-1 px-8 py-6 space-y-8">
          
          {/* Header Info */}
          <div>
            <div className="mb-4"><SeverityBadge severity={vuln.severity} /></div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {vuln.description}
            </h2>
            <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {vuln.publishedDate} • CVSS {vuln.cvss} • {vuln.asset}
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              📖 {t('pages.dashboard.drawer.detailedExplanation', 'Detailed Explanation')}
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              A critical vulnerability has been detected in the system at the <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{background: 'var(--bg-tertiary)', color: 'var(--accent-cyan)'}}>/api/auth/login</code> endpoint. 
              This vulnerability allows attackers to bypass authentication by injecting malicious queries.
            </p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--severity-high)' }}>{t('pages.dashboard.drawer.attackVector', 'Attack Vector:')}</strong> The application constructs queries using string 
              concatenation without proper input validation. An attacker can submit input like <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{color: 'var(--severity-critical)'}}>admin' OR '1'='1</code> to manipulate the query logic.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--severity-high)' }}>{t('pages.dashboard.drawer.impact', 'Impact:')}</strong> Successful exploitation grants unauthorized access as any user, enables 
              data exfiltration, and potentially allows execution of arbitrary commands.
            </p>
          </div>

          {/* Technical Details Grid */}
          <div>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              🔬 {t('pages.dashboard.drawer.technicalDetails', 'Technical Details')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{t('pages.dashboard.drawer.cvssScore', 'CVSS Score')}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--severity-critical)' }}>{vuln.cvss} / 10.0</div>
              </div>
              <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{t('pages.dashboard.drawer.attackComplexity', 'Attack Complexity')}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--severity-low)' }}>{t('pages.dashboard.drawer.low', 'Low')}</div>
              </div>
              <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{t('pages.dashboard.drawer.privilegesRequired', 'Privileges Required')}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--severity-critical)' }}>{t('pages.dashboard.drawer.none', 'None')}</div>
              </div>
              <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{t('pages.dashboard.drawer.userInteraction', 'User Interaction')}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--severity-critical)' }}>{t('pages.dashboard.drawer.none', 'None')}</div>
              </div>
            </div>
          </div>

          {/* Remediation Steps */}
          <div className="p-6 rounded-xl border" style={{ background: 'rgba(0, 212, 255, 0.03)', borderColor: 'rgba(0, 212, 255, 0.2)' }}>
            <h3 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--accent-cyan)' }}>
              ✅ {t('pages.dashboard.drawer.remediationSteps', 'Remediation Steps')}
            </h3>
            <div className="space-y-6">
              {[
                { title: 'Implement Parameterized Queries (Immediate)', desc: 'Replace all string concatenation with parameterized queries or prepared statements.' },
                { title: 'Add Input Validation (Within 24h)', desc: 'Implement strict input validation using whitelisting. Validate username format and reject keywords.' },
                { title: 'Deploy WAF Rules (Within 48h)', desc: 'Configure WAF to block common injection patterns as an additional defense layer.' },
                { title: 'Verify Fix (After implementation)', desc: 'Re-run automated security scans and conduct manual penetration testing.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-bold mt-0.5"
                    style={{ background: 'var(--accent-cyan)', color: '#0a0e17' }}>{i + 1}</div>
                  <div>
                    <div className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{step.title}</div>
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 pb-8">
            <button className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'var(--accent-cyan)', color: '#0a0e17' }}
              onClick={() => alert('Generando plan con IA...')}>
              🤖 {t('pages.dashboard.drawer.generatePlan', 'Generate Remediation Plan')}
            </button>
            <button className="w-full py-3.5 rounded-xl text-sm font-bold transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              onClick={() => alert('Abriendo modal de JIRA...')}>
              📋 {t('pages.dashboard.drawer.createTicket', 'Create JIRA Ticket')}
            </button>
            <button className="w-full py-3.5 rounded-xl text-sm font-bold transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              onClick={() => alert('Abriendo selector de equipo...')}>
              👤 {t('pages.dashboard.drawer.assignTeam', 'Assign to Team Member')}
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

 // Datos de prueba (Mock Data) extraídos del diseño original de Max
  const stats: DashboardStats = {
    riskScore: 6.8,
    criticalCount: 14,
    highCount: 33,
    resolvedThisMonth: 142,
  };

  const vulnerabilities: Vulnerability[] = [
    {
      cveId: 'CVE-2024-1234',
      description: 'SQL Injection en autenticación',
      asset: 'api.company.com',
      severity: 'CRITICAL',
      status: 'In Progress',
      cvss: 9.8,
      publishedDate: 'Hace 2 horas'
    },
    {
      cveId: 'CVE-2024-5678',
      description: 'XSS en perfil de usuario',
      asset: 'portal.company.com',
      severity: 'HIGH',
      status: 'Open',
      cvss: 7.2,
      publishedDate: 'Hace 5 horas'
    }
  ];

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