/**
 * Embedded map preview (OpenStreetMap) — no API key; requires parsed lat/lng from the maps URL.
 */

import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

type NexusVoiceMapEmbedProps = {
  lat: number;
  lng: number;
  openMapsUrl: string;
  className?: string;
};

export function NexusVoiceMapEmbed({ lat, lng, openMapsUrl, className }: NexusVoiceMapEmbedProps) {
  const pad = 0.012;
  const minLon = lng - pad;
  const minLat = lat - pad;
  const maxLon = lng + pad;
  const maxLat = lat + pad;
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`;

  return (
    <div className={cn('overflow-hidden rounded-xl ring-1 ring-cyan-400/20', className)}>
      <iframe
        title="Map preview"
        src={src}
        className="pointer-events-auto h-[min(42vw,200px)] w-full max-h-[200px] border-0 bg-[#0c1210]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/30 px-2 py-1">
        <span className="text-[9px] text-white/40">© OpenStreetMap</span>
        <a
          href={openMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-cyan-200/95 hover:text-white"
        >
          Open in Maps
          <ExternalLink className="h-2.5 w-2.5 opacity-80" aria-hidden />
        </a>
      </div>
    </div>
  );
}
