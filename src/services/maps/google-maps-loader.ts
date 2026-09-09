/**
 * Loads the Google Maps JavaScript API on **web** and hands back the `google.maps`
 * namespace.
 *
 * Web-only: `MapView.native.tsx` uses `react-native-maps` and never imports this.
 * The call is a singleton — the `<script>` is injected once, every caller shares
 * the same promise, and a second call after a successful load resolves
 * immediately.
 *
 * The key is a **browser** key (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`), restricted by
 * HTTP referrer in the Google Cloud console — it is meant to be public, the same
 * way every Maps-JS site ships its key in page source.
 */

// The slice of `google.maps` this app actually touches. Kept local so the app
// needs no `@types/google.maps` dependency.
export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleMapsApi {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMap;
  Marker: new (opts: Record<string, unknown>) => GoogleMapObject;
  Polyline: new (opts: Record<string, unknown>) => GoogleMapObject;
  LatLngBounds: new () => {
    extend(point: GoogleLatLngLiteral): void;
    isEmpty(): boolean;
  };
  SymbolPath: { CIRCLE: number };
  event: { removeListener(handle: unknown): void };
}

export interface GoogleMap {
  setCenter(point: GoogleLatLngLiteral): void;
  setZoom(zoom: number): void;
  fitBounds(bounds: unknown, padding?: number): void;
  getBounds(): { toJSON(): { north: number; south: number; east: number; west: number } } | undefined;
  getCenter(): { lat(): number; lng(): number } | undefined;
  addListener(event: string, handler: (arg: GoogleMapMouseEvent) => void): unknown;
}

export interface GoogleMapMouseEvent {
  latLng?: { lat(): number; lng(): number };
}

export interface GoogleMapObject {
  setMap(map: GoogleMap | null): void;
}

type MapsWindow = Window & {
  google?: { maps?: GoogleMapsApi };
  __rakebGoogleMapsReady?: () => void;
};

const SCRIPT_ID = 'rakeb-google-maps-js';
const CALLBACK = '__rakebGoogleMapsReady';
const LOAD_TIMEOUT_MS = 15000;

let loader: Promise<GoogleMapsApi> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  if (loader) return loader;

  loader = new Promise<GoogleMapsApi>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      loader = null;
      reject(new Error('Google Maps JS is web-only'));
      return;
    }
    const win = window as MapsWindow;

    if (win.google?.maps?.Map) {
      resolve(win.google.maps);
      return;
    }
    if (!apiKey) {
      loader = null;
      reject(new Error('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set'));
      return;
    }

    const timer = setTimeout(() => {
      loader = null;
      reject(new Error('Google Maps JS load timed out'));
    }, LOAD_TIMEOUT_MS);

    const settle = () => {
      clearTimeout(timer);
      const maps = win.google?.maps;
      if (maps?.Map) resolve(maps);
      else {
        loader = null;
        reject(new Error('Google Maps JS loaded without a usable maps namespace'));
      }
    };
    const fail = () => {
      clearTimeout(timer);
      loader = null;
      reject(new Error('Google Maps JS failed to load'));
    };

    // The `callback` query param is Google's guarantee that `google.maps` is
    // fully constructable — more reliable than the script's own `load` event.
    win[CALLBACK] = settle;

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
        `&v=weekly&callback=${CALLBACK}`;
      script.addEventListener('error', fail);
      document.head.appendChild(script);
    } else {
      // Script already in the DOM (HMR / a previous mount) — it may have loaded
      // already, or its callback is still pending and now points at us.
      script.addEventListener('error', fail);
      if (win.google?.maps?.Map) settle();
    }
  });

  return loader;
}
