import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconDownload, IconAlertTriangle, IconInfoCircle, IconRefresh } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Badge, ConfirmDialog, Modal, Tabs } from '../components/ui';
import { LineChart } from '../components/charts';
import type { Payout } from '../data/types';
import { FEE_RATE } from '../data/seed';
import { addDays, fmtDate, money, monthEarnings, platformFee, shortDate, supplierShare } from '../data/utils';
import { TODAY } from '../data/seed';

export default function Earnings() {
  const { state, update, toast } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<'Payouts' | 'By booking'>('Payouts');
  const [retry, setRetry] = useState<Payout | null>(null);
  const [view, setView] = useState<Payout | null>(null);
  const month = monthEarnings(state);
  const next = state.payouts.filter((p) => p.status === 'Scheduled').sort((a, b) => a.date.localeCompare(b.date))[0];
  const earned = state.bookings.filter((b) => b.status !== 'Cancelled' && b.payment !== 'Pending');
  const pending = earned.filter((b) => b.status !== 'Completed').reduce((s, b) => s + supplierShare(b), 0);
  const deductions = state.payouts.filter((p) => p.deduction && p.date.startsWith('2026-11')).reduce((s, p) => s + (p.deduction?.amount ?? 0), 0);
  const failed = state.payouts.filter((p) => p.status === 'Failed');

  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>Money in and payouts</h2>
          <p>
            RigSetGo keeps a {Math.round(FEE_RATE * 100)}% fee. The rest is yours and is paid to {state.payoutAccount.bank} •••• {state.payoutAccount.last4} through {state.payoutAccount.provider}.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => toast('November statement downloaded (PDF)', 'info')}>
          <IconDownload size={18} /> November statement
        </button>
      </div>
      {failed.length > 0 && (
        <div className="banner danger">
          <IconAlertTriangle size={20} />
          <div className="grow">
            <b>A payout of {money(failed[0].amount)} failed</b>The bank did not accept it. Check your bank details in Business Settings, then send it again.
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => nav('/settings?tab=Payout account')}>
            Check bank details
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setRetry(failed[0])}>
            Send again
          </button>
        </div>
      )}
      <div className="grid g4">
        <div className="kpi" style={{ background: 'var(--navy)', color: '#fff', border: 'none' }}>
          <span className="label" style={{ color: 'var(--on-navy-muted)' }}>Earnings this month</span>
          <span className="value">{money(month)}</span>
          <span className="tiny" style={{ color: 'var(--on-navy-muted)' }}>Your share after fees</span>
        </div>
        <div className="kpi">
          <span className="label">Next payout</span>
          <span className="value">{next ? money(next.amount) : '—'}</span>
          <span className="tiny muted">{next ? fmtDate(next.date) : 'Nothing scheduled'}</span>
        </div>
        <div className="kpi">
          <span className="label">In progress</span>
          <span className="value">{money(pending)}</span>
          <span className="tiny muted">From rentals not finished yet</span>
        </div>
        <div className="kpi">
          <span className="label">Deductions this month</span>
          <span className="value">{money(deductions)}</span>
          <span className="tiny muted">Refunds made after a payout</span>
        </div>
      </div>
      <section className="card">
        <div className="card-head">
          <h2>Your share by month</h2>
          <span className="muted small">After RigSetGo fees</span>
        </div>
        <LineChart values={[31200, 35800, 33900, 41200, monthEarnings(state, '2026-10'), month]} labels={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']} money max={Math.max(60000, Math.ceil(month / 10000) * 10000)} />
      </section>
      <section className="card">
        <Tabs tabs={['Payouts', 'By booking'] as const} value={tab} onChange={setTab} />
        {tab === 'Payouts' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Payout</th>
                <th>Date</th>
                <th>Bookings</th>
                <th>Deduction</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.payouts.map((p) => (
                <tr key={p.id}>
                  <td className="strong">{p.id}</td>
                  <td>{fmtDate(p.date)}</td>
                  <td className="small">{p.bookings.join(', ')}</td>
                  <td>{p.deduction ? <span style={{ color: 'var(--danger)' }}>− {money(p.deduction.amount)}</span> : '—'}</td>
                  <td className="strong">{money(p.amount)}</td>
                  <td>
                    <Badge>{p.status}</Badge>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setView(p)}>
                      Details
                    </button>
                    {p.status === 'Failed' ? (
                      <button className="btn btn-danger btn-sm" onClick={() => setRetry(p)}>
                        Send again
                      </button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => toast(`Statement for ${p.id} downloaded`, 'info')}>
                        <IconDownload size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Contractor</th>
                <th>Contractor paid</th>
                <th>RigSetGo fee</th>
                <th>Your share</th>
                <th>Deposit (held)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {earned.map((b) => (
                <tr key={b.id} className="click" onClick={() => nav(`/bookings/${b.id}`)}>
                  <td className="strong">{b.id}</td>
                  <td>{b.contractor}</td>
                  <td>{money(supplierShare(b) + platformFee(b))}</td>
                  <td>− {money(platformFee(b))}</td>
                  <td className="strong" style={{ color: 'var(--navy)' }}>{money(supplierShare(b))}</td>
                  <td className="muted">{money(b.deposit)}</td>
                  <td>{b.status === 'Completed' ? <Badge tone="green">Ready for payout</Badge> : <Badge tone="navy">In progress</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="banner info small">
          <IconInfoCircle size={18} />
          <div className="grow">Payouts follow the agreed payout rule. Deposits are kept separate and are never counted as your earnings. Tax is collected and shown separately.</div>
        </div>
      </section>
      {retry && (
        <ConfirmDialog
          title={`Send ${money(retry.amount)} again?`}
          text={`It will go to ${state.payoutAccount.bank} •••• ${state.payoutAccount.last4} through ${state.payoutAccount.provider}. Make sure these bank details are right.`}
          confirmLabel="Send payout again"
          onConfirm={() =>
            update(
              (s) => {
                const p = s.payouts.find((x) => x.id === retry.id)!;
                p.status = 'Scheduled';
                p.date = addDays(TODAY, 2);
              },
              { history: `Payout ${retry.id} sent again`, toast: `Payout scheduled for ${shortDate(addDays(TODAY, 2))}` },
            )
          }
          onClose={() => setRetry(null)}
        />
      )}
      {view && (
        <Modal title={`Payout ${view.id}`} sub={`${fmtDate(view.date)} · ${view.status}`} onClose={() => setView(null)}>
          {view.bookings.map((id) => {
            const b = state.bookings.find((x) => x.id === id);
            return (
              <div key={id} className="row between small">
                <span>
                  {id} {b ? `· ${b.contractor}` : '· earlier booking'}
                </span>
                <b>{b ? money(supplierShare(b)) : '—'}</b>
              </div>
            );
          })}
          {view.deduction && (
            <div className="banner warning small">
              <IconRefresh size={18} />
              <div className="grow">
                <b>Deduction − {money(view.deduction.amount)}</b>
                {view.deduction.reason}
              </div>
            </div>
          )}
          <div className="divider" />
          <div className="row between">
            <b>Paid to your bank</b>
            <b style={{ fontSize: 20 }}>{money(view.amount)}</b>
          </div>
        </Modal>
      )}
    </>
  );
}
