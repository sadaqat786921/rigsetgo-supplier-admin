import { useState } from 'react';
import { IconUserPlus, IconLock, IconPlus, IconCopy, IconEdit, IconTrash, IconInfoCircle } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Avatar, Badge, ConfirmDialog, Field, Modal, ReasonDialog, Tabs, Toggle } from '../components/ui';
import type { Member, Role } from '../data/types';
import { SECTIONS } from '../data/seed';

export default function Team() {
  const { state, update, toast } = useStore();
  const [tab, setTab] = useState<'Members' | 'Roles'>('Members');
  const [invite, setInvite] = useState(false);
  const [roleEdit, setRoleEdit] = useState<Role | 'new' | null>(null);
  const [changeRole, setChangeRole] = useState<Member | null>(null);
  const [suspend, setSuspend] = useState<Member | null>(null);
  const [remove, setRemove] = useState<Member | null>(null);
  const [delRole, setDelRole] = useState<Role | null>(null);
  const roleName = (id: string) => state.roles.find((r) => r.id === id)?.name ?? 'Unknown';

  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>People and access</h2>
          <p>Ready-made roles are locked. For anything else, create a custom role and switch sidebar sections on or off.</p>
        </div>
        <div className="row">
          <button className="btn btn-secondary" onClick={() => setRoleEdit('new')}>
            <IconPlus size={18} /> Create custom role
          </button>
          <button className="btn btn-primary" onClick={() => setInvite(true)}>
            <IconUserPlus size={18} /> Invite user
          </button>
        </div>
      </div>
      <section className="card">
        <Tabs tabs={['Members', 'Roles'] as const} value={tab} onChange={setTab} counts={{ Members: state.members.length, Roles: state.roles.length }} />
        {tab === 'Members' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.members.map((m) => {
                const me = m.id === 'M-1';
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="row">
                        <Avatar name={m.name} size="sm" />
                        <div>
                          <div className="strong">
                            {m.name} {me && <span className="tiny muted">(you)</span>}
                          </div>
                          <div className="tiny muted">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="row gap-8">
                        {roleName(m.roleId)}
                        {state.roles.find((r) => r.id === m.roleId)?.locked ? <IconLock size={14} color="var(--muted)" aria-label="Locked role" /> : <Badge tone="navy">Custom</Badge>}
                      </div>
                    </td>
                    <td>
                      <Badge>{m.status}</Badge>
                    </td>
                    <td className="small muted">{m.lastActive}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {me ? (
                        <span className="tiny muted">Account owner</span>
                      ) : (
                        <>
                          {m.status === 'Invited' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => toast(`Invite sent again to ${m.email}`, 'info')}>
                              Resend invite
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => setChangeRole(m)}>
                            Change role
                          </button>
                          {m.status === 'Suspended' ? (
                            <button className="btn btn-ghost btn-sm" onClick={() => update((s) => (s.members.find((x) => x.id === m.id)!.status = 'Active'), { history: `Reactivated ${m.name}`, toast: `${m.name} can sign in again` })}>
                              Reactivate
                            </button>
                          ) : (
                            m.status === 'Active' && (
                              <button className="btn btn-ghost btn-sm" onClick={() => setSuspend(m)}>
                                Switch off
                              </button>
                            )
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => setRemove(m)} aria-label={`Remove ${m.name}`}>
                            <IconTrash size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="grid g2">
            {state.roles.map((r) => {
              const users = state.members.filter((m) => m.roleId === r.id).length;
              return (
                <div key={r.id} className="card" style={{ gap: 12 }}>
                  <div className="row between top">
                    <div>
                      <div className="row gap-8">
                        <b style={{ fontSize: 17 }}>{r.name}</b>
                        {r.locked ? (
                          <Badge tone="grey">
                            <IconLock size={12} /> Ready-made · locked
                          </Badge>
                        ) : (
                          <Badge tone="navy">Custom</Badge>
                        )}
                      </div>
                      <div className="muted small">{r.description}</div>
                    </div>
                    <span className="tiny muted">{users} {users === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="col gap-4">
                    {SECTIONS.map((s) => (
                      <div key={s} className="row between small" style={{ opacity: r.sections.includes(s) ? 1 : 0.5 }}>
                        <span>{s}</span>
                        <Toggle label={s} checked={r.sections.includes(s)} disabled onChange={() => undefined} />
                      </div>
                    ))}
                    <div className="row between small" style={{ opacity: r.id === 'admin' ? 1 : 0.5 }}>
                      <span>Team & Roles, Business Settings, bank details</span>
                      <span className="tiny muted">{r.id === 'admin' ? 'Admin only' : 'Never available'}</span>
                    </div>
                  </div>
                  <div className="row">
                    {r.id !== 'admin' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setRoleEdit({ ...r, id: 'new-copy', name: `${r.name} (copy)`, locked: false, description: `Based on ${r.name}.` })}
                      >
                        <IconCopy size={16} /> Duplicate
                      </button>
                    )}
                    {!r.locked && (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => setRoleEdit(r)}>
                          <IconEdit size={16} /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDelRole(r)}>
                          <IconTrash size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {invite && <InviteModal onClose={() => setInvite(false)} onCustom={() => { setInvite(false); setRoleEdit('new'); }} />}
      {roleEdit && <RoleModal role={roleEdit === 'new' ? null : roleEdit} onClose={() => setRoleEdit(null)} />}
      {changeRole && (
        <ChangeRoleModal member={changeRole} onClose={() => setChangeRole(null)} />
      )}
      {suspend && (
        <ReasonDialog
          title={`Switch off ${suspend.name}?`}
          text="They are signed out straight away and cannot sign in until you switch them on again."
          confirmLabel="Switch off access"
          danger
          onConfirm={(r) => update((s) => (s.members.find((x) => x.id === suspend.id)!.status = 'Suspended'), { history: `Switched off ${suspend.name}: ${r}`, toast: `${suspend.name} was switched off`, tone: 'warning' })}
          onClose={() => setSuspend(null)}
        />
      )}
      {remove && (
        <ConfirmDialog
          title={`Remove ${remove.name}?`}
          text="They lose access to your supplier account. Their past work stays in history."
          confirmLabel="Remove from team"
          danger
          onConfirm={() =>
            update(
              (s) => {
                s.members = s.members.filter((x) => x.id !== remove.id);
                s.jobs.forEach((j) => {
                  if (j.driverId === remove.id && j.status !== 'Done') {
                    j.driverId = null;
                    j.status = 'Needs driver';
                  }
                });
              },
              { history: `Removed ${remove.name} from the team`, toast: `${remove.name} removed` },
            )
          }
          onClose={() => setRemove(null)}
        />
      )}
      {delRole && (
        <ConfirmDialog
          title={`Delete the ${delRole.name} role?`}
          text={state.members.some((m) => m.roleId === delRole.id) ? 'People still have this role. Give them another role first.' : 'This custom role will be deleted.'}
          confirmLabel="Delete role"
          danger
          onConfirm={() => {
            if (state.members.some((m) => m.roleId === delRole.id)) return toast('Give these people another role first', 'warning');
            update((s) => (s.roles = s.roles.filter((r) => r.id !== delRole.id)), { history: `Deleted custom role ${delRole.name}`, toast: 'Role deleted' });
          }}
          onClose={() => setDelRole(null)}
        />
      )}
    </>
  );
}

function InviteModal({ onClose, onCustom }: { onClose: () => void; onCustom: () => void }) {
  const { state, update } = useStore();
  const roles = state.roles.filter((r) => r.id !== 'admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(roles[0].id);
  const [err, setErr] = useState('');
  const role = state.roles.find((r) => r.id === roleId)!;
  return (
    <Modal
      title="Invite a person"
      sub="They get an email to set their own password and security code."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (name.trim().length < 2) return setErr('Enter their name.');
              if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email.');
              if (state.members.some((m) => m.email.toLowerCase() === email.toLowerCase())) return setErr('This person is already on your team.');
              update((s) => s.members.push({ id: `M-${s.members.length + 10}`, name, email, roleId, status: 'Invited', lastActive: '—' }), { history: `Invited ${name} as ${role.name}`, toast: `Invite sent to ${email}` });
              onClose();
            }}
          >
            Send invite
          </button>
        </>
      }
    >
      <div className="grid g2" style={{ gap: 16 }}>
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Work email">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Field label="Role">
        <select className="select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          <optgroup label="Ready-made (locked)">
            {roles.filter((r) => r.locked).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Custom">
            {roles.filter((r) => !r.locked).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      <div className="banner info small">
        <IconInfoCircle size={18} />
        <div className="grow">
          <b>{role.name} can see:</b>
          {role.sections.join(', ')}.
        </div>
      </div>
      <button className="link" style={{ alignSelf: 'flex-start' }} onClick={onCustom}>
        None of these fit? Create a custom role
      </button>
      {err && <div className="banner danger small">{err}</div>}
    </Modal>
  );
}

function ChangeRoleModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const { state, update } = useStore();
  const [roleId, setRoleId] = useState(member.roleId);
  return (
    <Modal
      title={`Change role for ${member.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const r = state.roles.find((x) => x.id === roleId)!;
              update((s) => (s.members.find((x) => x.id === member.id)!.roleId = roleId), { history: `Changed ${member.name}'s role to ${r.name}`, toast: `${member.name} is now ${r.name}` });
              onClose();
            }}
          >
            Save role
          </button>
        </>
      }
    >
      {state.roles
        .filter((r) => r.id !== 'admin')
        .map((r) => (
          <label key={r.id} className={`option ${roleId === r.id ? 'selected' : ''}`}>
            <input type="radio" checked={roleId === r.id} onChange={() => setRoleId(r.id)} />
            <span className="grow">
              <div className="strong">
                {r.name} {r.locked ? '· locked' : '· custom'}
              </div>
              <div className="tiny muted">{r.sections.join(', ')}</div>
            </span>
          </label>
        ))}
    </Modal>
  );
}

function RoleModal({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const { state, update } = useStore();
  const editing = role && role.id !== 'new-copy' ? role : null;
  const [name, setName] = useState(role?.name ?? '');
  const [desc, setDesc] = useState(role?.description ?? '');
  const [sections, setSections] = useState<string[]>(role?.sections ?? ['Dashboard']);
  const [err, setErr] = useState('');
  return (
    <Modal
      title={editing ? `Edit ${editing.name}` : 'Create a custom role'}
      sub="Switch on the sidebar sections this role can open. Switched-off sections are hidden from their sidebar."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (name.trim().length < 3) return setErr('Give the role a name.');
              if (state.roles.some((r) => r.name.toLowerCase() === name.trim().toLowerCase() && r.id !== editing?.id)) return setErr('A role with this name already exists.');
              update(
                (s) => {
                  if (editing) Object.assign(s.roles.find((r) => r.id === editing.id)!, { name, description: desc, sections });
                  else s.roles.push({ id: `custom-${Date.now()}`, name, description: desc || 'Custom role made by Mark Rivera.', sections, locked: false });
                },
                { history: `${editing ? 'Updated' : 'Created'} custom role ${name}: ${sections.join(', ')}`, toast: editing ? 'Role updated' : `Role “${name}” created` },
              );
              onClose();
            }}
          >
            Save role
          </button>
        </>
      }
    >
      <Field label="Role name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Site Supervisor" />
      </Field>
      <Field label="Short description (optional)">
        <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Field>
      <div className="col gap-8" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
        {SECTIONS.map((s) => (
          <div key={s} className="row between">
            <span>{s}</span>
            <Toggle
              label={s}
              checked={sections.includes(s)}
              disabled={s === 'Dashboard'}
              onChange={(v) => setSections(v ? [...sections, s] : sections.filter((x) => x !== s))}
            />
          </div>
        ))}
      </div>
      <div className="banner info small">
        <IconLock size={18} />
        <div className="grow">Team & Roles, Business Settings and bank details are never part of a custom role. Only the Supplier Admin can use them.</div>
      </div>
      {err && <div className="banner danger small">{err}</div>}
    </Modal>
  );
}
