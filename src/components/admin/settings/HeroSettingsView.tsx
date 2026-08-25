import { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, Image, Type, Save, Loader2, Upload } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export interface HeroSettings {
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
  image_url: 'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202025-12-20%20at%2010.00.51%20AM.jpeg',
  title: 'SEE BEYOND',
  subtitle: 'AI-powered clarity.',
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
  { label: 'Default',          value: 'inherit' },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Cormorant',        value: "'Cormorant Garamond', serif" },
  { label: 'Montserrat',       value: "'Montserrat', sans-serif" },
  { label: 'Raleway',          value: "'Raleway', sans-serif" },
  { label: 'Dancing Script',   value: "'Dancing Script', cursive" },
  { label: 'Pacifico',         value: "'Pacifico', cursive" },
  { label: 'Great Vibes',      value: "'Great Vibes', cursive" },
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
    alignItems:     h === 'left' ? 'flex-start' : h === 'right'  ? 'flex-end'  : 'center',
  };
}

function positionToTextAlign(pos: string): 'left' | 'center' | 'right' {
  if (pos.endsWith('left'))  return 'left';
  if (pos.endsWith('right')) return 'right';
  return 'center';
}

/**
 * Compress an image in the browser using Canvas API.
 * Scales down to maxWidth if larger, exports as JPEG at given quality.
 * Typical result: 5 MB photo → 150–400 KB.
 */
function compressImage(file: File, maxWidth = 1920, quality = 0.72): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Compression produced no output'))),
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
    img.src = objectUrl;
  });
}

export default function HeroSettingsView() {
  const [settings, setSettings]     = useState<HeroSettings>(DEFAULT_HERO);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [saved, setSaved]           = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load Google Fonts once into document head
  useEffect(() => {
    if (document.getElementById('hero-gfonts')) return;
    const link = document.createElement('link');
    link.id   = 'hero-gfonts';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }, []);

  // Fetch saved hero settings
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'hero_settings')
        .single();
      if (data?.value) setSettings(prev => ({ ...prev, ...data.value }));
      setLoading(false);
    })();
  }, []);

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
      const path = `hero-${Date.now()}.jpg`;
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
      .from('app_settings')
      .upsert({ key: 'hero_settings', value: settings });
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Save failed: ' + error.message);
    }
    setSaving(false);
  };

  const flexStyle = positionToFlex(settings.position);
  const textAlign = positionToTextAlign(settings.position);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-12">
        <Loader2 size={16} className="animate-spin" />
        Loading hero settings...
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate size={24} className="text-[#0d2818]" />
          <h2 className="text-xl font-light text-[#0d2818]">Hero Banner</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0d2818] text-white px-5 py-2.5 text-xs tracking-widest uppercase flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? '✓ Published' : 'Publish'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

        {/* ─── Controls ─────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Image */}
          <div className="bg-white border rounded-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Image size={15} className="text-[#0d2818]" />
              <span className="text-xs uppercase tracking-widest text-gray-500">Banner Image</span>
            </div>
            <input
              type="text"
              placeholder="Or paste image URL directly..."
              value={settings.image_url}
              onChange={e => update('image_url', e.target.value)}
              className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none font-mono"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 border border-[#0d2818] text-[#0d2818] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#0d2818] hover:text-white transition-colors disabled:opacity-60"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploading ? 'Working...' : 'Upload & Compress'}
              </button>
              {uploadInfo
                ? <span className="text-[11px] text-[#0d2818] font-medium">{uploadInfo}</span>
                : <span className="text-[11px] text-gray-400">Auto-compressed to JPEG before upload</span>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>

          {/* Text Content */}
          <div className="bg-white border rounded-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Type size={15} className="text-[#0d2818]" />
              <span className="text-xs uppercase tracking-widest text-gray-500">Text Content</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Main Title</label>
              <input
                type="text"
                value={settings.title}
                onChange={e => update('title', e.target.value)}
                className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                placeholder="e.g. SEE BEYOND"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Subtitle / Tagline</label>
              <input
                type="text"
                value={settings.subtitle}
                onChange={e => update('subtitle', e.target.value)}
                className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                placeholder="e.g. AI-powered clarity."
              />
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white border rounded-sm p-5 space-y-4">
            <span className="text-xs uppercase tracking-widest text-gray-500">Typography</span>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                {FONTS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => update('font_family', f.value)}
                    className={`border px-3 py-2.5 text-sm text-left transition-colors ${
                      settings.font_family === f.value
                        ? 'border-[#0d2818] bg-[#0d2818] text-white'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">Title Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.title_color}
                    onChange={e => update('title_color', e.target.value)}
                    className="w-10 h-9 border rounded cursor-pointer p-0.5" />
                  <span className="text-xs text-gray-400 font-mono">{settings.title_color}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">Subtitle Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.subtitle_color}
                    onChange={e => update('subtitle_color', e.target.value)}
                    className="w-10 h-9 border rounded cursor-pointer p-0.5" />
                  <span className="text-xs text-gray-400 font-mono">{settings.subtitle_color}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                  Title Size — {settings.title_size}px
                </label>
                <input type="range" min={16} max={80} step={2}
                  value={settings.title_size}
                  onChange={e => update('title_size', Number(e.target.value))}
                  className="w-full accent-[#0d2818]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                  Subtitle Size — {settings.subtitle_size}px
                </label>
                <input type="range" min={10} max={32} step={1}
                  value={settings.subtitle_size}
                  onChange={e => update('subtitle_size', Number(e.target.value))}
                  className="w-full accent-[#0d2818]" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                Letter Spacing — {(settings.letter_spacing * 0.1).toFixed(1)}em
              </label>
              <input type="range" min={0} max={20} step={1}
                value={settings.letter_spacing}
                onChange={e => update('letter_spacing', Number(e.target.value))}
                className="w-full accent-[#0d2818]" />
            </div>
          </div>

          {/* Layout & Overlay */}
          <div className="bg-white border rounded-sm p-5 space-y-4">
            <span className="text-xs uppercase tracking-widest text-gray-500">Layout & Overlay</span>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                Text Position — <span className="font-mono">{settings.position}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 w-32">
                {POSITION_GRID.flat().map(pos => (
                  <button
                    key={pos}
                    onClick={() => update('position', pos)}
                    title={pos}
                    className={`h-8 rounded-sm border transition-all ${
                      settings.position === pos
                        ? 'bg-[#0d2818] border-[#0d2818]'
                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
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
                    className="w-10 h-9 border rounded cursor-pointer p-0.5" />
                  <span className="text-xs text-gray-400 font-mono">{settings.overlay_color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Live Preview ──────────────────────────────────── */}
        <div className="xl:sticky xl:top-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Live Preview</p>
          <div className="border rounded-sm overflow-hidden bg-gray-100">
            <div className="relative w-full" style={{ paddingBottom: '42%' }}>
              {settings.image_url ? (
                <img
                  src={settings.image_url}
                  alt="Hero preview"
                  className="absolute inset-0 w-full h-full object-contain bg-gray-100"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                  No image set
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: settings.overlay_color, opacity: settings.overlay_opacity / 100 }}
              />
              <div className="absolute inset-0 flex flex-col p-4" style={flexStyle}>
                {settings.title && (
                  <p style={{
                    fontFamily:    settings.font_family,
                    fontSize:      `${Math.round(settings.title_size * 0.4)}px`,
                    color:         settings.title_color,
                    letterSpacing: `${(settings.letter_spacing * 0.1).toFixed(2)}em`,
                    textAlign,
                    fontWeight: 300,
                    margin: 0,
                    lineHeight: 1.2,
                  }}>
                    {settings.title}
                  </p>
                )}
                {settings.subtitle && (
                  <p style={{
                    fontFamily: settings.font_family,
                    fontSize:   `${Math.round(settings.subtitle_size * 0.4)}px`,
                    color:      settings.subtitle_color,
                    textAlign,
                    margin:     '4px 0 0 0',
                    lineHeight: 1.4,
                  }}>
                    {settings.subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="py-2 text-center text-[10px] text-gray-400 tracking-widest uppercase bg-white border-t">
              Preview — changes apply live on publish
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}