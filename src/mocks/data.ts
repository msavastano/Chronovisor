import { TravelResult } from '../../types';

export const MOCK_TRAVEL_RESULTS: TravelResult[] = [
  {
    locationName: "Forum Romanum, Rome",
    description: "The sun sets over the marble columns of the Forum. Senators in white togas debate fiercely near the Curia, while merchants sell exotic spices from the East. The air smells of dust and olive oil. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nulla lacus, aliquam vitae turpis sit amet, porttitor dignissim ex. Pellentesque quis arcu ipsum. Morbi id quam mi. Integer finibus hendrerit risus ut laoreet",
    time: { year: 50, month: 6, day: 15, hour: 18, minute: 30, second: 0 },
    imageUrl: "/mock_assets/forum.png"
  },
  {
    locationName: "Neo-Shibuya, Tokyo",
    description: "Neon rain falls on the holographic advertisements towering above. Flying cars weave through the skyscrapers as cybernetically enhanced citizens hurry through the wet streets. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nulla lacus, aliquam vitae turpis sit amet, porttitor dignissim ex. Pellentesque quis arcu ipsum. Morbi id quam mi. Integer finibus hendrerit risus ut laoreet",
    time: { year: 2077, month: 11, day: 3, hour: 23, minute: 15, second: 0 },
    imageUrl: "/mock_assets/japan.jpeg"
  },
  {
    locationName: "Cretaceous Basin",
    description: "A dense, humid jungle teems with life. Massive ferns brush against your legs as the ground shakes with the footsteps of a distant Titanosaur. The roar of a T-Rex echoes through the mist. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nulla lacus, aliquam vitae turpis sit amet, porttitor dignissim ex. Pellentesque quis arcu ipsum. Morbi id quam mi. Integer finibus hendrerit risus ut laoreet",
    time: { year: -66000000, month: 5, day: 1, hour: 9, minute: 0, second: 0 },
    imageUrl: "/mock_assets/dino3.jpg"
  },
  {
    locationName: "Sea of Tranquility, Moon",
    description: "Absolute silence. The Earth hangs like a fragile blue marble in the ink-black sky. The lunar regolith crunches beneath your boots as you gaze at the Eagle lander. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nulla lacus, aliquam vitae turpis sit amet, porttitor dignissim ex. Pellentesque quis arcu ipsum. Morbi id quam mi. Integer finibus hendrerit risus ut laoreet",
    time: { year: 1969, month: 7, day: 20, hour: 20, minute: 17, second: 0 },
    imageUrl: "/mock_assets/moon.png"
  },
  {
    locationName: "Siege of Stirling Castle",
    description: "Arrows darken the sky as trebuchets launch massive stones against the castle walls. The clash of steel and the shouts of soldiers fill the air in a chaotic symphony of medieval warfare. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nulla lacus, aliquam vitae turpis sit amet, porttitor dignissim ex. Pellentesque quis arcu ipsum. Morbi id quam mi. Integer finibus hendrerit risus ut laoreet",
    time: { year: 1304, month: 4, day: 10, hour: 14, minute: 0, second: 0 },
    imageUrl: "/mock_assets/midevil.png"
  }
];

export const getRandomMockResult = (): TravelResult => {
  return MOCK_TRAVEL_RESULTS[Math.floor(Math.random() * MOCK_TRAVEL_RESULTS.length)];
};
