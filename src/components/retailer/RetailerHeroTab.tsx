import { useState, useEffect, useRef } from 'react';
import { Image, Type, Save, Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HeroSettings {
  image_url: string;
  title: string;
  subtitle: string;
  font_family: string;
  title_color: string;
  subtitle_color: string;
  title_size: number;
  subtitle_size: number;
  position: string;
  letter_spacing: number;
  overlay_opacity: number;
  overlay_color: string;
}

const DEFAULT_HERO: HeroSettings = {
  image_url: '',
  title: '',
  subtitle: '',
  font_family: 'inherit',
  title_color: '#ffffff',
  subtitle_color: '#ffffff',
  title_size: 36,
  subtitle_size: 14,
  position: 'center',
  letter_spacing: 3,
  overlay_opacity: 20,
  overlay_color: '#000000',
};

const FONTS = [
  { label: 'Default',        value: 'inherit' },
  { label: 'Playfair',       value: "'Playfair Display', serif" },
  { label: 'Cormorant',      value: "'Cormorant Garamond', serif" },
  { label: 'Montserrat',     value: "'Montserrat', sans-serif" },
  { label: 'Raleway',        value: "'Raleway', sans-serif" },
  { label: 'Dancing Script', value: "'Dancing Script', cursive" },
  { label: 'Pacifico',       value: "'Pacifico', cursive" },
  { label: 'Great Vibes',    value: "'Great Vibes', cursive" },
];

const POSITION_GRID = [
  ['top-left',    'top-center',    'top-right'],
  ['center-left', 'center',        'center-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
];

function positionToFlex(pos: string): React.CSSProperties {
  const [v, h] = pos === 'center' ? ['center', 'center'] : pos.split('-');
  return {
    justifyContent: v === 'top' ? 'flex-start' : v === 'bottom' ? 'flex-end' : 'center',
    alignItems:     h === 'left' ? 'flex-start' : h === 'right' ? 'flex-end' : 'center',
  };
}

function positionToTextAlign(pos: string): 'left' | 'center' | 'right' {
  if (pos.endsWith('left'))  return 'left';
  if (pos.endsWith('right')) return 'right';
  return 'center';
}

function compressImage(file: File, maxWidth = 1920, quality = 0.72): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Load failed')); };
    img.src = objectUrl;
  });
}

export default function RetailerHeroTab({ profile }: { profile: any }) {
  const [settings, setSettings]     = useState<HeroSettings>(DEFAULT_HERO);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [saved, setSaved]           = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load Google Fonts
  useEffect(() => {
    if (document.getElementById('hero-gfonts')) return;
    const link = document.createElement('link');
    link.id   = 'hero-gfonts';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }, []);

  // Fetch saved hero settings from profiles
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('hero_settings')
        .eq('id', profile.id)
        .single();
      if (data?.hero_settings) setSettings(prev => ({ ...prev, ...data.hero_settings }));
      setLoading(false);
    })();
  }, [profile?.id]);

  const update = (key: keyof HeroSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadInfo('Compressing...');
    try {
      const originalKB   = Math.round(file.size / 1024);
      const compressed   = await compressImage(file);
      const compressedKB = Math.round(compressed.size / 1024);
      setUploadInfo(`Uploading... (${originalKB} KB → ${compressedKB} KB)`);
      const path = `retailer-${profile.id}-hero-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('hero-images')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg', cacheControl: '31536000' });
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('hero-images').getPublicUrl(data.path);
        update('image_url', publicUrl);
        setUploadInfo(`✓ Done — ${originalKB} KB → ${compressedKB} KB`);
        setTimeout(() => setUploadInfo(null), 4000);
      } else {
        alert('Upload failed: ' + error?.message);
        setUploadInfo(null);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      setUploadInfo(null);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ hero_settings: settings })
      .eq('id', profile.id);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Save failed: ' + error.message);
    }
    setSaving(false);
  };

  const flexStyle   = positionToFlex(settings.position);
  const textAlign   = positionToTextAlign(settings.position);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
        <Loader2 size={18} className="animate-spin" />
        Loading your hero settings...
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#0d2818]">Store Banner</h2>
          <p className="text-xs text-gray-400 mt-0.5">Customise your store's hero image and text</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview toggle (mobile) */}
          <button
            onClick={() => setShowPreview(v => !v)}
            className="md:hidden flex items-center gap-1.5 border border-gray-300 text-gray-500 px-3 py-2 rounded-lg text-xs"
          >
            {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0d2818] text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? '✓ Saved' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── Mobile Preview (shown when toggled) ── */}
      {showPreview && (
        <div className="md:hidden rounded-xl overflow-hidden border bg-white">
          <div className="relative w-full bg-white" style={{ paddingBottom: '50%' }}>
            {settings.image_url ? (
              <img src={settings.image_url} alt="Preview"
                className="absolute inset-0 w-full h-full object-contain bg-white" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                No image set
              </div>
            )}
            <div className="absolute inset-0"
              style={{ backgroundColor: settings.overlay_color, opacity: settings.overlay_opacity / 100 }} />
            <div className="absolute inset-0 flex flex-col p-3" style={flexStyle}>
              {settings.title && (
                <p style={{
                  fontFamily: settings.font_family,
                  fontSize: `${Math.round(settings.title_size * 0.38)}px`,
                  color: settings.title_color,
                  letterSpacing: `${(settings.letter_spacing * 0.1).toFixed(2)}em`,
                  textAlign, fontWeight: 300, margin: 0, lineHeight: 1.2,
                }}>{settings.title}</p>
              )}
              {settings.subtitle && (
                <p style={{
                  fontFamily: settings.font_family,
                  fontSize: `${Math.round(settings.subtitle_size * 0.38)}px`,
                  color: settings.subtitle_color,
                  textAlign, margin: '4px 0 0 0', lineHeight: 1.4,
                }}>{settings.subtitle}</p>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 py-2 border-t uppercase tracking-widest">Preview</p>
        </div>
      )}

      {/* ── Main grid: controls left, preview right (desktop) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Controls */}
        <div className="space-y-4">

          {/* Image upload */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Image size={15} className="text-[#0d2818]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Banner Image</span>
            </div>
            <input
              type="text"
              placeholder="Or paste image URL..."
              value={settings.image_url}
              onChange={e => update('image_url', e.target.value)}
              className="w-full border rounded-lg p-3 text-sm focus:border-[#0d2818] outline-none"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#0d2818] text-gray-500 hover:text-[#0d2818] rounded-lg py-3 text-sm transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Working...' : 'Tap to upload & compress'}
            </button>
            {uploadInfo && (
              <p className="text-xs text-[#0d2818] font-medium text-center">{uploadInfo}</p>
            )}
            <p className="text-[11px] text-gray-400 text-center">Auto-compressed to JPEG before upload</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>

          {/* Text */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Type size={15} className="text-[#0d2818]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Text Content</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Main Title</label>
              <input type="text" value={settings.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. WELCOME TO MY STORE"
                className="w-full border rounded-lg p-3 text-sm focus:border-[#0d2818] outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Subtitle</label>
              <input type="text" value={settings.subtitle}
                onChange={e => update('subtitle', e.target.value)}
                placeholder="e.g. Premium quality, best prices."
                className="w-full border rounded-lg p-3 text-sm focus:border-[#0d2818] outline-none" />
            </div>
          </div>

          {/* Font */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Font Style</span>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button key={f.value} onClick={() => update('font_family', f.value)}
                  className={`border rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${
                    settings.font_family === f.value
                      ? 'border-[#0d2818] bg-[#0d2818] text-white'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: f.value }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Colors</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">Title</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.title_color}
                    onChange={e => update('title_color', e.target.value)}
                    className="w-10 h-10 border rounded-lg cursor-pointer p-0.5" />
                  <span className="text-xs text-gray-400 font-mono">{settings.title_color}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">Subtitle</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.subtitle_color}
                    onChange={e => update('subtitle_color', e.target.value)}
                    className="w-10 h-10 border rounded-lg cursor-pointer p-0.5" />
                  <span className="text-xs text-gray-400 font-mono">{settings.subtitle_color}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sizes & Spacing */}
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Size & Spacing</span>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                Title Size — {settings.title_size}px
              </label>
              <input type="range" min={16} max={80} step={2}
                value={settings.title_size}
                onChange={e => update('title_size', Number(e.target.value))}
                className="w-full accent-[#0d2818]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                Subtitle Size — {settings.subtitle_size}px
              </label>
              <input type="range" min={10} max={32} step={1}
                value={settings.subtitle_size}
                onChange={e => update('subtitle_size', Number(e.target.value))}
                className="w-full accent-[#0d2818]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                Letter Spacing — {(settings.letter_spacing * 0.1).toFixed(1)}em
              </label>
              <input type="range" min={0} max={20} step={1}
                value={settings.letter_spacing}
                onChange={e => update('letter_spacing', Number(e.target.value))}
                className="w-full accent-[#0d2818]" />
            </div>
          </div>

          {/* Position & Overlay */}
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Position & Overlay</span>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                Text Position — <span className="font-mono">{settings.position}</span>
              </label>
              <div className="grid grid-cols-3 gap-2 w-36">
                {POSITION_GRID.flat().map(pos => (
                  <button key={pos} onClick={() => update('position', pos)} title={pos}
                    className={`h-9 rounded-lg border transition-all ${
                      settings.position === pos
                        ? 'bg-[#0d2818] border-[#0d2818]'
                        : 'bg-gray-100 border-gray-200 active:bg-gray-300'
                    }`} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                Overlay Opacity — {settings.overlay_opacity}%
              </label>
              <input type="range" min={0} max={80} step={5}
                value={settings.overlay_opacity}
                onChange={e => update('overlay_opacity', Number(e.target.value))}
                className="w-full accent-[#0d2818]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">Overlay Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.overlay_color}
                  onChange={e => update('overlay_color', e.target.value)}
                  className="w-10 h-10 border rounded-lg cursor-pointer p-0.5" />
                <span className="text-xs text-gray-400 font-mono">{settings.overlay_color}</span>
              </div>
            </div>
          </div>

          {/* Save button (bottom, full width — mobile convenience) */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#0d2818] text-white py-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? '✓ Published' : 'Publish Changes'}
          </button>
        </div>

        {/* Desktop Live Preview */}
        <div className="hidden md:block sticky top-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Live Preview</p>
          <div className="rounded-xl overflow-hidden border bg-white">
            <div className="relative w-full" style={{ paddingBottom: '50%' }}>
              {settings.image_url ? (
                <img src={settings.image_url} alt="Preview"
                  className="absolute inset-0 w-full h-full object-contain bg-white" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs bg-gray-50">
                  No image set
                </div>
              )}
              <div className="absolute inset-0"
                style={{ backgroundColor: settings.overlay_color, opacity: settings.overlay_opacity / 100 }} />
              <div className="absolute inset-0 flex flex-col p-4" style={flexStyle}>
                {settings.title && (
                  <p style={{
                    fontFamily: settings.font_family,
                    fontSize: `${Math.round(settings.title_size * 0.4)}px`,
                    color: settings.title_color,
                    letterSpacing: `${(settings.letter_spacing * 0.1).toFixed(2)}em`,
                    textAlign, fontWeight: 300, margin: 0, lineHeight: 1.2,
                  }}>{settings.title}</p>
                )}
                {settings.subtitle && (
                  <p style={{
                    fontFamily: settings.font_family,
                    fontSize: `${Math.round(settings.subtitle_size * 0.4)}px`,
                    color: settings.subtitle_color,
                    textAlign, margin: '4px 0 0 0', lineHeight: 1.4,
                  }}>{settings.subtitle}</p>
                )}
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 py-2 border-t uppercase tracking-widest bg-white">
              Live Preview
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}