import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconBuildingBank, IconLock, IconSearch, IconShieldLock, IconInfoCircle, IconHistory, IconBell } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Badge, ConfirmDialog, Field, Modal, SecurityCodeDialog, Tabs, Toggle } from '../components/ui';
import { fmtDate, fmtStamp } from '../data/utils';

type T = 'Business profile' | 'Payout account' | 'Notifications' | 'Security' | 'History';
const TABS: T[] = ['Business profile', 'Payout account', 'Notifications', 'Security', 'History'];

export default function Settings() {
  const { state, update, toast, setAuth } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as T) ? params.get('tab') : 'Business profile') as T;
  const setTab = (t: T) => setParams({ tab: t });
  const [code, setCode] = useState(false);
  const [bank, setBank] = useState(false);
  const [prefs, setPrefs] = useState(state.prefs);
  const [q, setQ] = useState('');
  const [pw, setPw] = useState({ cur: '', next: '', again: '' });
  const [pwErr, setPwErr] = useState('');
  const [signOutAll, setSignOutAll] = useState(false);
  const [provider, setProvider] = useState(state.payoutAccount.provider);
  const [bankName, setBankName] = useState(state.payoutAccount.bank);
  const [acct, setAcct] = useState('');
  const [bankErr, setBankErr] = useState('');
  const b = state.business;
  const failed = state.payouts.filter((p) => p.status === 'Failed');
  const history = state.history.filter((h) => (h.text + h.who).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <section className="card">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'Business profile' && (
          <div className="grid g2">
            <div className="col gap-16">
              {[
                ['Legal business name', b.legalName],
                ['Main contact', b.contactName],
                ['Business address', b.address],
                ['Phone', b.phone],
                ['Email', b.email],
                ['Verified', `Yes, on ${fmtDate(b.verifiedOn)}`],
              ].map(([l, v]) => (
                <div key={l} className="row between" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <span className="muted">{l}</span>
                  <b style={{ textAlign: 'right' }}>{v}</b>
                </div>
              ))}
            </div>
            <div className="col gap-16">
              <div className="banner info small">
                <IconInfoCircle size={18} />
                <div className="grow">
                  <b>Your public details are edited on the Storefront page</b>Changes to the business name, phone or email are checked by RigSetGo before they go live.
                </div>
              </div>
              <div>
                <button className="btn btn-primary" onClick={() => nav('/storefront')}>
                  Edit on Storefront
                </button>
              </div>
              <div className="doc-row">
                <div className="strong">Verification documents</div>
                <div className="muted small">Business license, insurance and tax ID are managed on the Compliance page.</div>
                <div>
                  <button className="btn btn-secondary btn-sm" onClick={() => nav('/compliance')}>
                    Open Compliance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Payout account' && (
          <div className="col gap-16" style={{ maxWidth: 720 }}>
            {failed.length > 0 && (
              <div className="banner danger small">
                <IconInfoCircle size={18} />
                <div className="grow">A payout failed on {fmtDate(failed[0].date)}. If your bank details changed, update them below, then send the payout again from Earnings.</div>
              </div>
            )}
            <div className="row between" style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 20 }}>
              <div className="row">
                <span className="icon-circle" style={{ width: 52, height: 52 }}>
                  <IconBuildingBank size={24} />
                </span>
                <div>
                  <div className="strong" style={{ fontSize: 17 }}>
                    {state.payoutAccount.bank} •••• {state.payoutAccount.last4}
                  </div>
                  <div className="muted small">Paid through {state.payoutAccount.provider}</div>
                </div>
              </div>
              <Badge>{state.payoutAccount.status}</Badge>
            </div>
            <div className="banner warning small">
              <IconShieldLock size={18} />
              <div className="grow">
                <b>Only the Supplier Admin can change bank details</b>For your safety we ask for your security code first, and every change is saved in history.
              </div>
            </div>
            <div>
              <button className="btn btn-primary" onClick={() => setCode(true)}>
                <IconLock size={18} /> Change bank details
              </button>
            </div>
            <div className="muted small">RigSetGo never stores your full bank or card numbers. They are kept by the payment provider.</div>
          </div>
        )}

        {tab === 'Notifications' && (
          <div className="grid g2">
            <div className="col gap-16">
              <h3>How we reach you</h3>
              {(
                [
                  ['email', 'Email', 'mark@atlantaheavyrentals.com'],
                  ['sms', 'Text messages (SMS)', 'Only with your consent. (404) 555-0142'],
                  ['inApp', 'In the app', 'The bell at the top of every page'],
                  ['quietHours', 'Quiet hours', 'No non-urgent messages from 8 PM to 7 AM'],
                ] as const
              ).map(([k, l, d]) => (
                <div key={k} className="row between" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
                  <div>
                    <div className="strong">{l}</div>
                    <div className="tiny muted">{d}</div>
                  </div>
                  <Toggle label={l} checked={prefs[k]} onChange={(v) => setPrefs({ ...prefs, [k]: v })} />
                </div>
              ))}
            </div>
            <div className="col gap-16">
              <h3>What we tell you about</h3>
              {Object.entries(prefs.topics).map(([k, v]) => (
                <div key={k} className="row between" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <span>{k}</span>
                  <Toggle label={k} checked={v} disabled={k === 'Document expiry reminders'} onChange={(x) => setPrefs({ ...prefs, topics: { ...prefs.topics, [k]: x } })} />
                </div>
              ))}
              <div className="tiny muted">Document expiry reminders cannot be switched off, because expired documents pause your bookings.</div>
              <div>
                <button className="btn btn-primary" onClick={() => update((s) => (s.prefs = prefs), { history: 'Updated notification settings', toast: 'Notification settings saved' })}>
                  <IconBell size={18} /> Save notification settings
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'Security' && (
          <div className="grid g2">
            <div className="col gap-16">
              <h3>Change password</h3>
              <Field label="Current password">
                <input className="input" type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} />
              </Field>
              <Field label="New password" hint="8 or more characters with a capital letter and a number.">
                <input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </Field>
              <Field label="New password again">
                <input className="input" type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
              </Field>
              {pwErr && <div className="banner danger small">{pwErr}</div>}
              <div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (!pw.cur) return setPwErr('Enter your current password.');
                    if (pw.next.length < 8 || !/[A-Z]/.test(pw.next) || !/\d/.test(pw.next)) return setPwErr('The new password is too weak.');
                    if (pw.next !== pw.again) return setPwErr('The two new passwords do not match.');
                    setPwErr('');
                    setPw({ cur: '', next: '', again: '' });
                    update(() => undefined, { history: 'Changed account password', toast: 'Password changed' });
                  }}
                >
                  Save new password
                </button>
              </div>
            </div>
            <div className="col gap-16">
              <h3>Sign-in protection</h3>
              <div className="row between" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
                <div>
                  <div className="strong">Security code by text message</div>
                  <div className="tiny muted">Sent to the phone ending in 0142 at every sign-in</div>
                </div>
                <Badge tone="green">On</Badge>
              </div>
              <div className="row between" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
                <div>
                  <div className="strong">Signed in on 2 devices</div>
                  <div className="tiny muted">This computer · iPhone (Atlanta)</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSignOutAll(true)}>
                  Sign out other devices
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'History' && (
          <>
            <div className="row between">
              <span className="muted small">Every change in your supplier account: who did it and when.</span>
              <div className="search" style={{ width: 280 }}>
                <IconSearch size={18} color="var(--muted)" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search history" aria-label="Search history" />
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What changed</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{fmtStamp(h.time)}</td>
                    <td className="small strong">{h.who}</td>
                    <td className="small">{h.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <div className="empty">
                <IconHistory size={28} />
                No history matches “{q}”.
              </div>
            )}
          </>
        )}
      </section>

      {code && <SecurityCodeDialog text="Changing where your money is paid needs your security code." onSuccess={() => setBank(true)} onClose={() => setCode(false)} />}
      {bank && (
        <Modal
          title="New bank details"
          sub="You are on the payment provider’s secure page (demo)."
          onClose={() => setBank(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setBank(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (acct.replace(/\D/g, '').length < 6) return setBankErr('Enter the full account number.');
                  const last4 = acct.replace(/\D/g, '').slice(-4);
                  update(
                    (s) => {
                      s.payoutAccount = { provider, bank: bankName, last4, status: 'Connected' };
                    },
                    { history: `Changed payout bank account to ${bankName} •••• ${last4} (${provider})`, notify: { text: `Your payout bank account was changed to ${bankName} •••• ${last4}`, link: '/settings?tab=Payout account' }, toast: 'Bank details updated' },
                  );
                  setBank(false);
                  setAcct('');
                }}
              >
                Save bank details
              </button>
            </>
          }
        >
          <Field label="Payment provider">
            <select className="select" value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}>
              <option>Stripe</option>
              <option>PayPal</option>
              <option>Square</option>
            </select>
          </Field>
          <Field label="Bank name">
            <input className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </Field>
          <div className="grid g2" style={{ gap: 16 }}>
            <Field label="Routing number">
              <input className="input" defaultValue="061000104" />
            </Field>
            <Field label="Account number" error={bankErr}>
              <input className={`input ${bankErr ? 'invalid' : ''}`} value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="e.g. 000123456789" />
            </Field>
          </div>
        </Modal>
      )}
      {signOutAll && (
        <ConfirmDialog
          title="Sign out other devices?"
          text="Your iPhone will be signed out. You stay signed in here."
          confirmLabel="Sign out other devices"
          onConfirm={() => {
            toast('Other devices were signed out');
            setAuth({});
          }}
          onClose={() => setSignOutAll(false)}
        />
      )}
    </>
  );
}
