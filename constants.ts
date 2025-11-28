import { HistoricalEvent } from './types';

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'pyramids',
    title: 'Giza Construction',
    time: { year: -2560, month: 6, day: 15, hour: 10, minute: 30, second: 0 },
    coordinates: { lat: 29.9792, lng: 31.1342 },
    description: "The Great Pyramid of Giza nearing completion under Pharaoh Khufu."
  },
  {
    id: 'rome-peak',
    title: 'Imperial Rome',
    time: { year: 117, month: 9, day: 1, hour: 14, minute: 0, second: 0 },
    coordinates: { lat: 41.9028, lng: 12.4964 },
    description: "The Roman Forum bustling with activity during the reign of Trajan."
  },
  {
    id: 'edo-tokyo',
    title: 'Edo Period Tokyo',
    time: { year: 1800, month: 5, day: 20, hour: 19, minute: 15, second: 0 },
    coordinates: { lat: 35.6762, lng: 139.6503 },
    description: "Samurai and merchants in the rainy streets of Edo."
  },
  {
    id: 'dino-extinction',
    title: 'Asteroid Impact',
    time: { year: -66000000, month: 1, day: 1, hour: 12, minute: 0, second: 0 },
    coordinates: { lat: 21.2000, lng: -89.5000 },
    description: "Seconds before the Chicxulub asteroid impact in the Yucatan."
  },
  {
    id: 'cyberpunk-future',
    title: 'Neo-Seoul 2150',
    time: { year: 2150, month: 11, day: 14, hour: 23, minute: 45, second: 12 },
    coordinates: { lat: 37.5665, lng: 126.9780 },
    description: "A towering, neon-drenched metropolis with flying vehicles."
  },
  {
    id: 'wild-west',
    title: 'Tombstone 1881',
    time: { year: 1881, month: 10, day: 26, hour: 15, minute: 0, second: 0 }, // Gunfight at O.K. Corral
    coordinates: { lat: 31.7129, lng: -110.0676 },
    description: "Dusty streets and saloons of the Wild West near the O.K. Corral."
  },
  {
    id: 'woodstock',
    title: 'Woodstock 1969',
    time: { year: 1969, month: 8, day: 15, hour: 17, minute: 7, second: 0 },
    coordinates: { lat: 41.7013, lng: -74.8801 },
    description: "Peace, love, and music in the mud of Bethel, New York."
  },
  {
    id: 'atlantis',
    title: 'Lost Atlantis',
    time: { year: -9600, month: 3, day: 21, hour: 6, minute: 0, second: 0 },
    coordinates: { lat: 36.13, lng: -24.22 }, 
    description: "The advanced concentric city of Atlantis before it sank."
  },
  {
    id: 'titanic-dock',
    title: 'Titanic Departure',
    time: { year: 1912, month: 4, day: 10, hour: 12, minute: 0, second: 0 },
    coordinates: { lat: 50.9097, lng: -1.4044 },
    description: "The RMS Titanic departing Southampton dock."
  },
  {
    id: 'mars-colony',
    title: 'Mars Base Alpha',
    time: { year: 2085, month: 7, day: 20, hour: 8, minute: 30, second: 0 },
    coordinates: { lat: -4.5895, lng: 137.4417 }, // Gale Crater
    description: "The first self-sustaining pressurized city on Mars."
  },
  {
    id: 'ice-age-london',
    title: 'Ice Age London',
    time: { year: -20000, month: 1, day: 15, hour: 12, minute: 0, second: 0 },
    coordinates: { lat: 51.5074, lng: -0.1278 },
    description: "Mammoths crossing the frozen tundra where London now stands."
  },
  {
    id: 'tenochtitlan',
    title: 'Aztec Capital',
    time: { year: 1518, month: 11, day: 8, hour: 9, minute: 0, second: 0 },
    coordinates: { lat: 19.4326, lng: -99.1332 },
    description: "The floating city of Tenochtitlan before Spanish conquest."
  },
  {
    id: 'alexandria-library',
    title: 'Library of Alexandria',
    time: { year: -200, month: 5, day: 12, hour: 14, minute: 30, second: 0 },
    coordinates: { lat: 31.2001, lng: 29.9187 },
    description: "Scholars studying scrolls in the greatest library of the ancient world."
  }
];

export const MIN_YEAR = -100000000; // 100 million BC
export const MAX_YEAR = 3000;
