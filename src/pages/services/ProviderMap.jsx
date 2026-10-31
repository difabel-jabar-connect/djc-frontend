import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CrosshairIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  StarFilledIcon,
  XIcon,
} from '@/components/ui/icons';
import { JABAR_BOUNDS, JABAR_MAX_BOUNDS, JABAR_RING, WORLD_RING } from '@/features/map/jabarGeo';
import { getCategory } from '@/features/search/catalog';
import { formatRating, formatRupiah } from '@/lib/format';
import { buildBookingPath, buildProviderPath } from '@/routes/paths';
import './providerMap.css';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const shortPrice = (value) => formatRupiah(value);

/** Pin harga: lebar diperkirakan dari panjang teks agar titik jangkar tepat di tengah. */
const pinIcon = (label) => {
  const width = Math.round(label.length * 7.8 + 24);
  return L.divIcon({
    className: 'pm-marker',
    html: `<span class="pm-pin">${label}</span>`,
    iconSize: [width, 30],
    iconAnchor: [width / 2, 15],
  });
};

function ExpandIcon({ expanded }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {expanded ? (
        <>
          <path d="M8 3v3a2 2 0 0 1-2 2H3" />
          <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" />
          <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </>
      ) : (
        <>
          <path d="M15 3h6v6" />
          <path d="M9 21H3v-6" />
          <path d="m21 3-7 7" />
          <path d="m3 21 7-7" />
        </>
      )}
    </svg>
  );
}

/** Gelembung kelompok untuk pin yang saling bertumpuk. */
const clusterIcon = (count) => {
  const label = `${count} penyedia`;
  const width = Math.round(label.length * 7.4 + 30);
  return L.divIcon({
    className: 'pm-marker pm-marker--cluster',
    html: `<span class="pm-pin pm-pin--cluster">${label}</span>`,
    iconSize: [width, 32],
    iconAnchor: [width / 2, 16],
  });
};

const describe = (provider) =>
  `${provider.name}, ${getCategory(provider.categorySlug)?.label ?? provider.category}, mulai ${formatRupiah(provider.priceFrom)}, ${provider.city}`;

/** Kartu penyedia yang muncul di atas pin (gaya kartu peta Airbnb). */
function MapCard({ provider, onClose, style, below }) {
  const category = getCategory(provider.categorySlug);
  return (
    <div
      className={`pm-card${below ? ' is-below' : ''}`}
      style={style}
      role="dialog"
      aria-label={`Penyedia ${provider.name}`}
    >
      <div className="pm-card__banner" style={{ '--pm-accent': provider.avatarColor }}>
        <span className="pm-card__avatar" aria-hidden="true">
          {provider.initials}
        </span>
        {category && (
          <span className="pm-card__cat">
            <img src={category.icon} alt="" width="14" height="14" />
            {category.label}
          </span>
        )}
        <button type="button" className="pm-card__close" aria-label="Tutup kartu" onClick={onClose}>
          <XIcon size={16} strokeWidth={2.5} />
        </button>
      </div>
      <div className="pm-card__body">
        <div className="pm-card__title">
          <strong>{provider.name}</strong>
          <span className="pm-card__rating">
            <StarFilledIcon size={14} aria-hidden="true" />
            {formatRating(provider.rating)} <span>({provider.reviewCount})</span>
          </span>
        </div>
        <p className="pm-card__address">
          <MapPinIcon size={14} aria-hidden="true" />
          {provider.address}
        </p>
        <p className="pm-card__price">
          Mulai <strong>{formatRupiah(provider.priceFrom)}</strong>
          {provider.priceUnit && <span> / {provider.priceUnit}</span>}
        </p>
        <div className="pm-card__actions">
          <Link to={buildProviderPath(provider.id)} className="btn btn--outline pm-card__btn">
            Lihat Profil
          </Link>
          <Link to={buildBookingPath(provider.id)} className="btn btn--primary pm-card__btn">
            Pesan
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Peta SIG Cari Layanan (Leaflet + OpenStreetMap), dibatasi ke Jawa Barat.
 * Pin harga per penyedia sesuai koordinat alamatnya; pin/kartu daftar saling sorot.
 * `onAreaSearch(area | null)` dipanggil saat pengguna memilih "Cari di area ini".
 */
export default function ProviderMap({
  providers,
  hoveredId,
  onHover,
  selectedId,
  onSelect,
  areaActive,
  onAreaSearch,
  expanded,
  onToggleExpand,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const programmaticRef = useRef(false);
  const handlersRef = useRef({ onHover, onSelect });
  handlersRef.current = { onHover, onSelect };
  const [moved, setMoved] = useState(false);
  const [autoSearch, setAutoSearch] = useState(false);
  const [, setTick] = useState(0);
  const autoRef = useRef(autoSearch);
  autoRef.current = autoSearch;
  const areaHandlerRef = useRef(onAreaSearch);
  areaHandlerRef.current = onAreaSearch;

  const currentArea = () => {
    const b = mapRef.current.getBounds();
    return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
  };

  // Inisialisasi peta sekali.
  useEffect(() => {
    const markers = markersRef.current;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      minZoom: 7,
      maxZoom: 18,
      maxBounds: JABAR_MAX_BOUNDS,
      maxBoundsViscosity: 0.85,
      zoomSnap: 0.5,
      attributionControl: true,
    });
    mapRef.current = map;
    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');

    L.polygon([WORLD_RING, JABAR_RING], {
      stroke: false,
      fillColor: '#0b3c6e',
      fillOpacity: 0.1,
      interactive: false,
    }).addTo(map);
    L.polygon(JABAR_RING, {
      color: '#0b3c6e',
      weight: 2,
      opacity: 0.55,
      dashArray: '6 6',
      fill: false,
      interactive: false,
    }).addTo(map);

    programmaticRef.current = true;
    map.fitBounds(JABAR_BOUNDS, { padding: [12, 12] });
    programmaticRef.current = false;

    const rerender = () => setTick((t) => t + 1);
    map.on('move zoom', rerender);
    map.on('zoomend', () => reclusterRef.current());
    map.on('click', () => handlersRef.current.onSelect(null));
    map.on('moveend', () => {
      if (programmaticRef.current) {
        programmaticRef.current = false;
        return;
      }
      if (autoRef.current) areaHandlerRef.current(currentArea());
      else setMoved(true);
    });

    // Ukuran wadah berubah (perluas peta / tata letak responsif) → hitung ulang.
    // Peta yang dibuat saat tersembunyi (mobile) berukuran 0, jadi saat pertama terlihat
    // tampilannya dipaskan ulang ke seluruh Jawa Barat.
    const el = containerRef.current;
    let hidden = !el.clientWidth || !el.clientHeight;
    const handleResize = () => {
      if (!el.clientWidth || !el.clientHeight) {
        hidden = true;
        return;
      }
      programmaticRef.current = true;
      map.invalidateSize({ pan: false });
      if (hidden) {
        hidden = false;
        programmaticRef.current = true;
        map.fitBounds(JABAR_BOUNDS, { padding: [12, 12], animate: false });
        reclusterRef.current();
      }
      programmaticRef.current = false;
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(handleResize) : null;
    observer?.observe(el);

    return () => {
      observer?.disconnect();
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  const providersRef = useRef(providers);
  providersRef.current = providers;
  const highlightRef = useRef({ hoveredId, selectedId });
  highlightRef.current = { hoveredId, selectedId };
  const clustersRef = useRef([]);

  /** Sorot pin/kelompok yang sedang di-hover atau dipilih. */
  const highlight = () => {
    const { hoveredId: hovered, selectedId: selected } = highlightRef.current;
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (!el) return;
      const active = id === selected;
      el.classList.toggle('is-active', active);
      el.classList.toggle('is-hover', id === hovered && !active);
      el.setAttribute('aria-pressed', String(active));
      marker.setZIndexOffset(active ? 2000 : id === hovered ? 1000 : 0);
    });
    clustersRef.current.forEach((cluster) => {
      const el = cluster.getElement();
      const hit = cluster.memberIds.includes(hovered);
      el?.classList.toggle('is-hover', hit);
      cluster.setZIndexOffset(hit ? 1000 : 0);
    });
  };

  /**
   * Kelompokkan pin yang bertumpuk di layar (dihitung ulang tiap zoom). Pin terpilih
   * selalu tampil sendiri agar kartunya menempel di titik yang benar.
   */
  const recluster = () => {
    const map = mapRef.current;
    if (!map) return;
    clustersRef.current.forEach((cluster) => cluster.remove());
    clustersRef.current = [];
    const groups = [];
    providersRef.current
      .filter((p) => p.lat != null)
      .forEach((provider) => {
        const point = map.latLngToLayerPoint([provider.lat, provider.lng]);
        if (provider.id === highlightRef.current.selectedId) {
          groups.push({ members: [provider], point, solo: true });
          return;
        }
        const near = groups.find(
          (g) =>
            !g.solo && Math.abs(g.point.x - point.x) < 74 && Math.abs(g.point.y - point.y) < 34,
        );
        if (near) near.members.push(provider);
        else groups.push({ members: [provider], point });
      });

    groups.forEach(({ members }) => {
      if (members.length === 1) {
        const [provider] = members;
        const marker = markersRef.current.get(provider.id);
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
          const el = marker.getElement();
          el?.setAttribute('role', 'button');
          el?.setAttribute('aria-label', describe(provider));
        }
        return;
      }
      members.forEach((p) => markersRef.current.get(p.id).remove());
      const bounds = L.latLngBounds(members.map((p) => [p.lat, p.lng]));
      const cluster = L.marker(bounds.getCenter(), {
        icon: clusterIcon(members.length),
        keyboard: true,
      })
        .on('click', (event) => {
          L.DomEvent.stopPropagation(event);
          programmaticRef.current = true;
          map.fitBounds(bounds, { padding: [90, 90], maxZoom: 15 });
        })
        .addTo(map);
      cluster.memberIds = members.map((p) => p.id);
      const el = cluster.getElement();
      el?.setAttribute('role', 'button');
      el?.setAttribute(
        'aria-label',
        `${members.length} penyedia: ${members.map((p) => p.name).join(', ')}. Perbesar peta untuk melihat`,
      );
      clustersRef.current.push(cluster);
    });
    highlight();
  };
  const reclusterRef = useRef(recluster);
  reclusterRef.current = recluster;

  // Sinkronkan pin dengan daftar penyedia.
  useEffect(() => {
    const markers = markersRef.current;
    const ids = new Set(providers.map((p) => p.id));
    markers.forEach((marker, id) => {
      if (!ids.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    });
    providers.forEach((provider) => {
      if (markers.has(provider.id) || provider.lat == null) return;
      const marker = L.marker([provider.lat, provider.lng], {
        icon: pinIcon(shortPrice(provider.priceFrom)),
        keyboard: true,
        riseOnHover: true,
      })
        .on('click', (event) => {
          L.DomEvent.stopPropagation(event);
          handlersRef.current.onSelect(provider.id);
        })
        .on('mouseover', () => handlersRef.current.onHover(provider.id))
        .on('mouseout', () => handlersRef.current.onHover(null));
      markers.set(provider.id, marker);
    });
    reclusterRef.current();
  }, [providers]);

  // Pin terpilih dikeluarkan dari kelompok; sorotan mengikuti hover.
  useEffect(() => {
    reclusterRef.current();
  }, [selectedId]);
  useEffect(() => {
    highlight();
  });

  // Bawa pin terpilih ke dalam pandangan.
  useEffect(() => {
    const map = mapRef.current;
    const selected = providers.find((p) => p.id === selectedId);
    if (!map || !selected) return;
    const point = L.latLng(selected.lat, selected.lng);
    if (!map.getBounds().pad(-0.15).contains(point)) {
      programmaticRef.current = true;
      map.panTo(point, { animate: true });
    }
  }, [selectedId, providers]);

  const zoomBy = (delta) => mapRef.current?.setZoom(mapRef.current.getZoom() + delta);
  const resetView = () => {
    programmaticRef.current = true;
    mapRef.current?.fitBounds(JABAR_BOUNDS, { padding: [12, 12] });
    setMoved(false);
    onAreaSearch(null);
  };

  const selected = providers.find((p) => p.id === selectedId);
  let cardStyle = null;
  let cardBelow = false;
  if (selected && mapRef.current) {
    const point = mapRef.current.latLngToContainerPoint([selected.lat, selected.lng]);
    const size = mapRef.current.getSize();
    cardBelow = point.y < 300;
    cardStyle = {
      left: `${Math.min(Math.max(point.x, 150), Math.max(size.x - 150, 150))}px`,
      top: `${point.y}px`,
    };
  }

  return (
    <div className="pm" role="region" aria-label="Peta SIG penyedia layanan di Jawa Barat">
      <div ref={containerRef} className="pm__canvas" />

      <div className="pm__top">
        {moved && !autoSearch ? (
          <button
            type="button"
            className="pm__chip pm__chip--action"
            onClick={() => {
              onAreaSearch(currentArea());
              setMoved(false);
            }}
          >
            <SearchIcon size={16} strokeWidth={2.5} />
            Cari di area ini
          </button>
        ) : (
          <label className="pm__chip">
            <input
              type="checkbox"
              checked={autoSearch}
              onChange={(event) => {
                setAutoSearch(event.target.checked);
                setMoved(false);
                if (event.target.checked) onAreaSearch(currentArea());
              }}
            />
            Cari saat peta digeser
          </label>
        )}
        {areaActive && (
          <button type="button" className="pm__chip" onClick={resetView}>
            <XIcon size={14} strokeWidth={2.5} />
            Hapus area
          </button>
        )}
      </div>

      <div className="pm__controls">
        <button
          type="button"
          className="pm__btn"
          aria-label={expanded ? 'Tampilkan daftar' : 'Perluas peta'}
          title={expanded ? 'Tampilkan daftar' : 'Perluas peta'}
          aria-pressed={expanded}
          onClick={onToggleExpand}
        >
          <ExpandIcon expanded={expanded} />
        </button>
        <div className="pm__group">
          <button
            type="button"
            className="pm__btn"
            aria-label="Perbesar peta"
            onClick={() => zoomBy(1)}
          >
            <PlusIcon size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            className="pm__btn"
            aria-label="Perkecil peta"
            onClick={() => zoomBy(-1)}
          >
            <MinusIcon size={18} strokeWidth={2.5} />
          </button>
        </div>
        <button
          type="button"
          className="pm__btn"
          aria-label="Tampilkan seluruh Jawa Barat"
          title="Tampilkan seluruh Jawa Barat"
          onClick={resetView}
        >
          <CrosshairIcon size={18} strokeWidth={2.25} />
        </button>
      </div>

      {selected && cardStyle && (
        <MapCard
          provider={selected}
          style={cardStyle}
          below={cardBelow}
          onClose={() => onSelect(null)}
        />
      )}

      <p className="pm__count" aria-live="polite">
        {providers.length} penyedia di peta
      </p>
    </div>
  );
}
