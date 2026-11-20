import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconUpload, IconFile, IconAlertTriangle, IconShieldCheck, IconInfoCircle, IconBell } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Badge, Empty, Field, Modal, ReasonDialog, Tabs } from '../components/ui';
import type { ComplianceDoc, Equipment } from '../data/types';
import { daysUntil, docStatusFor, fmtDate, blockingDocs } from '../data/utils';

export function UploadDocModal({ name, equipment, onClose }: { name: string; equipment?: Equipment | null; onClose: () => void }) {
  const { state, update } = useStore();
  const covers = equipment ? equipment.name : 'Business';
  const current = state.docs.find((d) => d.name === name && d.equipmentId === (equipment ? equipment.id : null));
  const [file, setFile] = useState('');
  const [expires, setExpires] = useState('2027-11-20');
  const [err, setErr] = useState('');
  const noExpiry = name.includes('W-9');
  const save = () => {
    if (!file) return setErr('Choose a file to upload.');
    if (!noExpiry && !expires) return setErr('Enter the expiry date shown on the document.');
    if (!noExpiry && daysUntil(expires) < 0) return setErr('This date is in the past. Upload a document that is still valid.');
    update(
      (s) => {
        const d = s.docs.find((x) => x.id === current?.id);
        if (d) {
          d.file = file;
          d.expires = noExpiry ? '' : expires;
          d.status = 'Under review';
          d.rejectReason = undefined;
        } else {
          s.docs.push({ id: `DOC-${s.docs.length + 20}`, name, covers, equipmentId: equipment ? equipment.id : null, file, expires: noExpiry ? '' : expires, status: 'Under review' });
        }
      },
      { history: `Uploaded ${name.toLowerCase()} for ${covers}`, toast: 'Document sent to RigSetGo for review' },
    );
    onClose();
  };
  return (
    <Modal
      title={`${current ? 'Replace' : 'Upload'} ${name.toLowerCase()}`}
      sub={`For ${covers}. Only the RigSetGo team can see this document.`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Upload document
          </button>
        </>
      }
    >
      {file ? (
        <div className="doc-row">
          <div className="row">
            <span className="icon-circle">
              <IconFile size={20} />
            </span>
            <div className="grow">
              <div className="strong">{file}</div>
              <div className="tiny muted">PDF · 1.4 MB · ready to upload</div>
            </div>
            <button className="link" onClick={() => setFile('')}>
              Change
            </button>
          </div>
        </div>
      ) : (
        <button className="dropzone" onClick={() => { setFile(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-2026.pdf`); setErr(''); }}>
          <span className="icon-circle" style={{ background: '#fff' }}>
            <IconUpload size={20} />
          </span>
          <span>
            <span className="muted">Drag your file here or</span> <u style={{ color: 'var(--navy)' }}>browse</u>
          </span>
          <span className="tiny muted">PDF, JPG or PNG · up to 10 MB</span>
        </button>
      )}
      {!noExpiry && (
        <Field label="Expiry date" hint="We will remind you 30, 14 and 7 days before this date.">
          <input className="input" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>
      )}
      {err && <div className="banner danger small">{err}</div>}
    </Modal>
  );
}

type Filter = 'All' | 'Needs action' | 'Under review' | 'Valid';

export default function Compliance() {
  const { state, update } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<Filter>('All');
  const [upload, setUpload] = useState<ComplianceDoc | null>(null);
  const [newDoc, setNewDoc] = useState(false);
  const [reject, setReject] = useState<ComplianceDoc | null>(null);
  const needs = (d: ComplianceDoc) => ['Expired', 'Expiring soon', 'Rejected'].includes(d.status);
  const list = state.docs.filter((d) => (tab === 'All' ? true : tab === 'Needs action' ? needs(d) : tab === 'Under review' ? d.status === 'Under review' : d.status === 'Valid'));
  const paused = state.equipment.filter((e) => blockingDocs(state, e).some((d) => d.equipmentId === e.id));
  const decide = (d: ComplianceDoc, ok: boolean, reason?: string) =>
    update(
      (s) => {
        const x = s.docs.find((y) => y.id === d.id)!;
        x.status = ok ? docStatusFor(x.expires) : 'Rejected';
        x.rejectReason = reason;
      },
      {
        history: `RigSetGo ${ok ? 'accepted' : 'rejected'} ${d.name.toLowerCase()} for ${d.covers}${reason ? `: ${reason}` : ''}`,
        notify: { text: `${d.name} for ${d.covers} was ${ok ? 'accepted' : 'rejected'}`, link: '/compliance' },
        toast: ok ? 'Document accepted. Bookings are open' : 'Document rejected',
        tone: ok ? 'success' : 'warning',
      },
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>Documents and expiry dates</h2>
          <p>Missing or expired documents pause new bookings for the machines they cover.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNewDoc(true)}>
          <IconUpload size={18} /> Upload document
        </button>
      </div>
      <div className="grid g4">
        {[
          ['Valid', state.docs.filter((d) => d.status === 'Valid').length, 'green'],
          ['Expiring soon', state.docs.filter((d) => d.status === 'Expiring soon').length, 'orange'],
          ['Expired or rejected', state.docs.filter((d) => d.status === 'Expired' || d.status === 'Rejected').length, 'red'],
          ['Under review', state.docs.filter((d) => d.status === 'Under review').length, 'navy'],
        ].map(([l, v, t]) => (
          <div key={String(l)} className="kpi">
            <span className="label">
              <span className={`badge b-${t}`} style={{ padding: '2px 8px' }}>●</span> {l}
            </span>
            <span className="value">{v}</span>
          </div>
        ))}
      </div>
      {paused.length > 0 && (
        <div className="banner danger">
          <IconAlertTriangle size={20} />
          <div className="grow">
            <b>Bookings paused for {paused.map((e) => e.name).join(', ')}</b>
            Upload a valid document to open new bookings again. Existing bookings are not affected.
          </div>
        </div>
      )}
      <section className="card">
        <Tabs tabs={['All', 'Needs action', 'Under review', 'Valid'] as Filter[]} value={tab} onChange={setTab} counts={{ 'Needs action': state.docs.filter(needs).length, 'Under review': state.docs.filter((d) => d.status === 'Under review').length }} />
        {list.length === 0 ? (
          <Empty title="Nothing here" text="No documents match this filter." icon={<IconShieldCheck size={28} />} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Covers</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((d) => {
                  const days = d.expires ? daysUntil(d.expires) : null;
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="row">
                          <span className="icon-circle" style={{ width: 36, height: 36 }}>
                            <IconFile size={18} />
                          </span>
                          <div>
                            <div className="strong">{d.name}</div>
                            <div className="tiny muted">{d.file}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {d.equipmentId ? (
                          <button className="link" onClick={() => nav(`/equipment/${d.equipmentId}`)}>
                            {d.covers}
                          </button>
                        ) : (
                          'Whole business'
                        )}
                      </td>
                      <td>
                        <div>{fmtDate(d.expires)}</div>
                        {days !== null && <div className={`tiny ${days < 0 ? '' : 'muted'}`} style={{ color: days < 0 ? 'var(--danger)' : undefined }}>{days < 0 ? `${-days} days ago` : `in ${days} days`}</div>}
                      </td>
                      <td>
                        <Badge>{d.status}</Badge>
                        {d.rejectReason && <div className="tiny" style={{ color: 'var(--danger)', marginTop: 4 }}>{d.rejectReason}</div>}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {d.status === 'Under review' ? (
                          <span className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                            <span className="tiny muted">Demo decision:</span>
                            <button className="btn btn-secondary btn-sm" onClick={() => decide(d, true)}>
                              Accept
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setReject(d)}>
                              Reject
                            </button>
                          </span>
                        ) : (
                          <button className={`btn btn-sm ${needs(d) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUpload(d)}>
                            <IconUpload size={16} /> Upload new
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="banner info small">
        <IconBell size={18} />
        <div className="grow">Reminders are sent by email and in the app 30, 14 and 7 days before a document expires. The RigSetGo team checks each new document before bookings open again.</div>
      </div>
      {upload && <UploadDocModal name={upload.name} equipment={state.equipment.find((e) => e.id === upload.equipmentId) ?? null} onClose={() => setUpload(null)} />}
      {newDoc && <NewDocPicker onClose={() => setNewDoc(false)} />}
      {reject && (
        <ReasonDialog
          title="Reject this document (demo)"
          text="This is the RigSetGo Compliance team’s decision. The supplier will see the reason."
          confirmLabel="Reject document"
          danger
          onConfirm={(r) => decide(reject, false, r)}
          onClose={() => setReject(null)}
        />
      )}
    </>
  );
}

function NewDocPicker({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const [target, setTarget] = useState('business');
  const [name, setName] = useState('Certificate of insurance');
  const [go, setGo] = useState(false);
  const eq = state.equipment.find((e) => e.id === target) ?? null;
  if (go) return <UploadDocModal name={name} equipment={eq} onClose={onClose} />;
  return (
    <Modal
      title="Upload a document"
      sub="Choose what the document is for."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => setGo(true)}>
            Continue
          </button>
        </>
      }
    >
      <Field label="Document is for">
        <select
          className="select"
          value={target}
          onChange={(e) => {
            setTarget(e.target.value);
            setName(e.target.value === 'business' ? 'Certificate of insurance' : 'Annual inspection certificate');
          }}
        >
          <option value="business">The whole business</option>
          {state.equipment.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Document type">
        <select className="select" value={name} onChange={(e) => setName(e.target.value)}>
          {(target === 'business' ? ['Business license', 'Certificate of insurance', 'Tax ID (W-9)'] : ['Annual inspection certificate', 'Lift inspection certificate', 'Operator certificate', 'DOT registration']).map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <div className="banner info small">
        <IconInfoCircle size={18} />
        <div className="grow">The full list of documents for each equipment type will be confirmed by RigSetGo.</div>
      </div>
    </Modal>
  );
}
