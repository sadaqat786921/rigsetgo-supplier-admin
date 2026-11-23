import { useRef, useState } from 'react';
import { IconPhotoPlus, IconStar, IconStarFilled, IconTrash, IconUpload, IconAlertTriangle } from '@tabler/icons-react';
import { img } from '../data/images';
import { PHOTOS } from '../data/seed';

export const MAX_PHOTOS = 10;
const MAX_MB = 10;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Shrinks a photo so the demo can keep it in the browser (max 1200 px wide). */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('image'));
      image.onload = () => {
        const scale = Math.min(1, 1200 / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload, remove and order equipment photos. The first photo is the main photo
 * contractors see first in search results and on the listing.
 */
export function PhotoManager({ photos, onChange, error }: { photos: string[]; onChange: (next: string[]) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  const add = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const issues: string[] = [];
    const room = MAX_PHOTOS - photos.length;
    const ok: File[] = [];
    list.forEach((f) => {
      if (!TYPES.includes(f.type)) issues.push(`${f.name} is not a JPG, PNG or WebP photo.`);
      else if (f.size > MAX_MB * 1024 * 1024) issues.push(`${f.name} is larger than ${MAX_MB} MB.`);
      else ok.push(f);
    });
    if (ok.length > room) {
      issues.push(room <= 0 ? `You already have ${MAX_PHOTOS} photos. Remove one to add another.` : `Only ${room} more photo${room === 1 ? '' : 's'} can be added (${MAX_PHOTOS} at most).`);
      ok.splice(Math.max(room, 0));
    }
    setProblems(issues);
    if (!ok.length) return;
    setBusy(ok.length);
    const done: string[] = [];
    for (const f of ok) {
      try {
        done.push(await shrink(f));
      } catch {
        issues.push(`${f.name} could not be read. Try another photo.`);
      }
    }
    setBusy(0);
    setProblems([...issues]);
    if (done.length) onChange([...photos, ...done]);
  };

  const remove = (i: number) => onChange(photos.filter((_, k) => k !== i));
  const makeMain = (i: number) => onChange([photos[i], ...photos.filter((_, k) => k !== i)]);

  return (
    <div className="col gap-16">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        data-testid="photo-input"
        onChange={(x) => {
          if (x.target.files) add(x.target.files);
          x.target.value = '';
        }}
      />
      <div
        className={`dropzone photo-drop${drag ? ' over' : ''}${error ? ' bad' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(x) => (x.key === 'Enter' || x.key === ' ') && input.current?.click()}
        onDragOver={(x) => {
          x.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(x) => {
          x.preventDefault();
          setDrag(false);
          add(x.dataTransfer.files);
        }}
      >
        <div className="icon-circle">
          <IconPhotoPlus size={26} />
        </div>
        <b>Drag your photos here</b>
        <span className="muted">or</span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={(x) => {
            x.stopPropagation();
            input.current?.click();
          }}
          disabled={photos.length >= MAX_PHOTOS || busy > 0}
        >
          <IconUpload size={18} /> Upload photos
        </button>
        <span className="hint">
          JPG, PNG or WebP · up to {MAX_MB} MB each · up to {MAX_PHOTOS} photos ({photos.length} of {MAX_PHOTOS} added)
        </span>
      </div>

      {busy > 0 && (
        <div className="banner info small" role="status">
          <span className="spinner" /> Uploading {busy} photo{busy === 1 ? '' : 's'}…
        </div>
      )}
      {(problems.length > 0 || error) && (
        <div className="banner danger small" role="alert">
          <IconAlertTriangle size={18} />
          <div>
            {error && <div>{error}</div>}
            {problems.map((p) => (
              <div key={p}>{p}</div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((ph, i) => (
            <div key={`${i}-${ph.slice(-24)}`} className={`photo-tile${i === 0 ? ' main' : ''}`}>
              <img src={img(ph)} alt={i === 0 ? 'Main photo' : `Photo ${i + 1}`} />
              {i === 0 && (
                <span className="photo-main">
                  <IconStarFilled size={13} /> Main photo
                </span>
              )}
              <div className="photo-actions">
                {i > 0 && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => makeMain(i)} title="Make this the main photo">
                    <IconStar size={15} /> Make main
                  </button>
                )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => remove(i)} aria-label={`Remove photo ${i + 1}`} title="Remove photo">
                  <IconTrash size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <button type="button" className="link" onClick={() => setShowSamples(!showSamples)}>
          {showSamples ? 'Hide sample photos' : 'No photos at hand? Use a sample photo for the demo'}
        </button>
        {showSamples && (
          <div className="photo-pick" style={{ marginTop: 10 }}>
            {PHOTOS.map((ph) => (
              <button
                type="button"
                key={ph}
                className={photos.includes(ph) ? 'on' : ''}
                disabled={!photos.includes(ph) && photos.length >= MAX_PHOTOS}
                onClick={() => onChange(photos.includes(ph) ? photos.filter((x) => x !== ph) : [...photos, ph])}
                aria-label="Add sample photo"
              >
                <img src={img(ph)} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
