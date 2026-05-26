'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { findConflicts, type Assignment, type ResourceType } from '@/lib/fleet/availability';
import type { Vehicle, Driver, Guide } from '@/types';
import { toast } from '@/lib/toast';
import { Car, UserCheck, Compass, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface Props {
  reservationId: string;
  arrivalDate: string;
  departureDate: string;
}

interface Option { id: string; label: string }

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  catch { return d; }
};

export default function AssignmentsSection({ reservationId, arrivalDate, departureDate }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicles,    setVehicles]    = useState<Vehicle[]>([]);
  const [drivers,     setDrivers]     = useState<Driver[]>([]);
  const [guides,      setGuides]      = useState<Guide[]>([]);
  const [refByRes,    setRefByRes]    = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(true);

  const refetch = useCallback(async () => {
    try {
      const [asg, fleet, g, res] = await Promise.all([
        fetch('/api/fleet/assignments').then(r => r.json()),
        fetch('/api/fleet').then(r => r.json()),
        fetch('/api/guides').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/reservations').then(r => r.json()).catch(() => ({ success: false })),
      ]);
      if (asg.success)   setAssignments(asg.assignments ?? []);
      if (fleet.success) { setVehicles(fleet.vehicles ?? []); setDrivers(fleet.drivers ?? []); }
      if (g.success)     setGuides(g.guides ?? []);
      if (res.success) {
        const map: Record<string, string> = {};
        for (const r of (res.reservations ?? []) as { id: string; reference: string }[]) map[r.id] = r.reference;
        setRefByRes(map);
      }
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  // This reservation's assignments vs everyone else's (for conflict checks).
  const mine   = useMemo(() => assignments.filter(a => a.reservation_id === reservationId), [assignments, reservationId]);
  const others = useMemo(() => assignments.filter(a => a.reservation_id !== reservationId), [assignments, reservationId]);

  const labelFor = useCallback((a: Assignment): string => {
    if (a.resource_type === 'vehicle') {
      const v = vehicles.find(x => x.id === a.resource_id);
      return v ? `${v.registration}${v.make ? ` · ${v.make}` : ''}` : 'Vehicle';
    }
    if (a.resource_type === 'driver') return drivers.find(x => x.id === a.resource_id)?.full_name ?? 'Driver';
    return guides.find(x => x.id === a.resource_id)?.full_name ?? 'Guide';
  }, [vehicles, drivers, guides]);

  async function handleAssign(type: ResourceType, resourceId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/fleet/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservationId, resource_type: type, resource_id: resourceId,
          start_date: arrivalDate, end_date: departureDate,
        }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error ?? 'Assignment failed');
      toast.success('Assigned');
      await refetch();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assignment failed');
      return false;
    }
  }

  async function handleRemove(id: string) {
    try {
      const res = await fetch(`/api/fleet/assignments?id=${id}`, { method: 'DELETE' });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error ?? 'Remove failed');
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Remove failed');
    }
  }

  const datesReady = !!arrivalDate && !!departureDate && departureDate >= arrivalDate;

  const ROWS: { type: ResourceType; label: string; icon: React.ReactNode; options: Option[] }[] = [
    { type: 'vehicle', label: 'Vehicle', icon: <Car size={13} strokeWidth={1.9} />,
      options: vehicles.map(v => ({ id: v.id, label: `${v.registration} · ${v.make ?? ''} ${v.model ?? ''}`.trim() })) },
    { type: 'driver',  label: 'Chauffeur / Driver', icon: <UserCheck size={13} strokeWidth={1.9} />,
      options: drivers.map(d => ({ id: d.id, label: d.full_name })) },
    { type: 'guide',   label: 'Guide / Representative', icon: <Compass size={13} strokeWidth={1.9} />,
      options: guides.map(g => ({ id: g.id, label: g.full_name })) },
  ];

  return (
    <div style={{ background: '#fff', border: '1px solid #D4D4D4', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ background: '#F0F0F0', borderBottom: '1px solid #D8D8D8', padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Resource Assignments</span>
        <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>
          {datesReady ? `${fmtDate(arrivalDate)} – ${fmtDate(departureDate)}` : 'Set trip dates first'}
        </span>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ fontSize: 12, color: '#999' }}>Loading…</div>}

        {!loading && ROWS.map(row => (
          <AssignRow
            key={row.type}
            type={row.type}
            label={row.label}
            icon={row.icon}
            options={row.options}
            others={others}
            mine={mine.filter(a => a.resource_type === row.type)}
            arrivalDate={arrivalDate}
            departureDate={departureDate}
            datesReady={datesReady}
            refByRes={refByRes}
            labelFor={labelFor}
            onAssign={handleAssign}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}

// ── One assignable resource row, with inline conflict detection ──────────────────
function AssignRow({
  type, label, icon, options, others, mine, arrivalDate, departureDate, datesReady,
  refByRes, labelFor, onAssign, onRemove,
}: {
  type: ResourceType; label: string; icon: React.ReactNode; options: Option[];
  others: Assignment[]; mine: Assignment[];
  arrivalDate: string; departureDate: string; datesReady: boolean;
  refByRes: Record<string, string>;
  labelFor: (a: Assignment) => string;
  onAssign: (type: ResourceType, id: string) => Promise<boolean>;
  onRemove: (id: string) => void;
  }) {
  const [selected, setSelected] = useState('');
  const [saving,   setSaving]   = useState(false);

  // Conflicts for the currently-selected candidate over this reservation's dates.
  const conflicts = useMemo(
    () => (selected && datesReady ? findConflicts(others, type, selected, arrivalDate, departureDate) : []),
    [selected, datesReady, others, type, arrivalDate, departureDate],
  );
  const hasConflict = conflicts.length > 0;

  // Which options are already booked across the reservation's window (to flag in the list).
  const bookedIds = useMemo(() => {
    if (!datesReady) return new Set<string>();
    const s = new Set<string>();
    for (const o of options) {
      if (findConflicts(others, type, o.id, arrivalDate, departureDate).length > 0) s.add(o.id);
    }
    return s;
  }, [options, others, type, arrivalDate, departureDate, datesReady]);

  async function assign() {
    if (!selected || hasConflict || saving) return;
    setSaving(true);
    const ok = await onAssign(type, selected);
    setSaving(false);
    if (ok) setSelected('');
  }

  const conflictText = hasConflict
    ? `Already assigned to ${refByRes[conflicts[0].reservation_id ?? ''] ?? 'another trip'} (${fmtDate(conflicts[0].start_date)} – ${fmtDate(conflicts[0].end_date)})`
    : '';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ color: '#1A6FC4', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#444' }}>{label}</span>
      </div>

      {/* Currently assigned chips */}
      {mine.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {mine.map(a => (
            <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: '#065F46', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 3, padding: '2px 4px 2px 8px' }}>
              <CheckCircle2 size={11} /> {labelFor(a)}
              <button onClick={() => onRemove(a.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', display: 'flex', padding: 1 }}>
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* One resource of each type per booking: show the picker only when none
          is assigned yet; otherwise prompt to remove the current one first. */}
      {mine.length === 0 ? (
        <>
          <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
            <select
              value={selected}
              disabled={!datesReady}
              onChange={e => setSelected(e.target.value)}
              style={{
                flex: 1, fontSize: 12, padding: '5px 8px', borderRadius: 3, fontFamily: 'inherit',
                color: '#222', background: !datesReady ? '#F5F5F5' : '#fff',
                border: `1px solid ${hasConflict ? '#DC2626' : '#C8C8C8'}`,
                outline: 'none',
                boxShadow: hasConflict ? '0 0 0 2px rgba(220,38,38,0.12)' : 'none',
              }}
            >
              <option value="">{options.length ? `Select a ${label.toLowerCase()}…` : `No ${label.toLowerCase()}s available`}</option>
              {options.map(o => (
                <option key={o.id} value={o.id}>
                  {o.label}{bookedIds.has(o.id) ? '  — booked this period' : ''}
                </option>
              ))}
            </select>
            {(() => {
              const disabled = !selected || hasConflict || saving || !datesReady;
              return (
                <button
                  onClick={assign}
                  disabled={disabled}
                  style={{
                    padding: '5px 16px', borderRadius: 3, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    background: disabled ? '#EEF1F5' : '#1A6FC4',
                    color:      disabled ? '#8A98A8' : '#ffffff',
                    border:     `1px solid ${disabled ? '#D4DAE2' : '#1A6FC4'}`,
                    cursor:     disabled ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {saving ? 'Assigning…' : 'Assign'}
                </button>
              );
            })()}
          </div>

          {/* Inline conflict warning — appears right under the field it concerns */}
          {hasConflict && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 5, padding: '5px 8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 3 }}>
              <AlertTriangle size={12} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#B91C1C', lineHeight: 1.45 }}>
                <strong>Scheduling conflict.</strong> {conflictText}. Pick a different {label.toLowerCase()} or adjust the dates.
              </span>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: 10.5, color: '#9AA3AE', margin: '1px 0 0' }}>
          One {label.toLowerCase()} per booking — remove the current one to reassign.
        </p>
      )}
    </div>
  );
}
