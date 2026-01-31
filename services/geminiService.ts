import { GoogleGenAI, Type } from "@google/genai";
import { TravelResult, TimeParams, Coordinates } from "../types";
import { getRandomMockResult } from "../src/mocks/data";

// Helper to check and prompt for key
export const checkAndRequestApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      try {
        await window.aistudio.openSelectKey();
        // Per guidelines: Assume success after openSelectKey to mitigate race condition
        return true;
      } catch (e) {
        console.error("User cancelled or failed to select key", e);
        return false;
      }
    }
    return true;
  }
  return !!process.env.API_KEY;
};

export const lookupHistoricalEvent = async (query: string, useMock: boolean = false): Promise<{ coordinates: Coordinates, time: TimeParams, title: string } | null> => {
  if (useMock) {
    // Return a random mock result converted to event format
    const mock = getRandomMockResult();
    // Mock specific coordinates for the mock scenarios
    let coords = { lat: 41.8925, lng: 12.4853 }; // Default Rome
    if (mock.locationName.includes("Tokyo")) coords = { lat: 35.6762, lng: 139.6503 };
    if (mock.locationName.includes("Cretaceous")) coords = { lat: 40.0, lng: -100.0 };
    if (mock.locationName.includes("Moon")) coords = { lat: 0.674, lng: 23.4729 };
    if (mock.locationName.includes("Stirling")) coords = { lat: 56.1229, lng: -3.9446 };

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                title: mock.locationName,
                coordinates: coords,
                time: mock.time
            });
        }, 1000); // Fake delay
    });
  }

  await checkAndRequestApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are a historical temporal database. 
    Analyze the user's query for a historical event or specific moment.
    Return the exact or best estimated Latitude/Longitude and Date/Time for that event.
    
    Rules:
    - If the exact time is unknown, estimate a plausible time of day (e.g., dawn for a battle, noon for a speech).
    - If the date is vague (e.g., "Summer of '69"), pick a representative peak date.
    - Coordinates should be precise.
  `;

  const userPrompt = `Locate event: "${query}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Short official title of the event" },
            latitude: { type: Type.NUMBER, description: "Latitude of the event" },
            longitude: { type: Type.NUMBER, description: "Longitude of the event" },
            year: { type: Type.NUMBER },
            month: { type: Type.NUMBER },
            day: { type: Type.NUMBER },
            hour: { type: Type.NUMBER },
            minute: { type: Type.NUMBER },
            second: { type: Type.NUMBER }
          },
          required: ["title", "latitude", "longitude", "year", "month", "day", "hour", "minute", "second"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    if (!data.latitude || !data.year) return null;

    return {
      title: data.title,
      coordinates: {
        lat: data.latitude,
        lng: data.longitude
      },
      time: {
        year: data.year,
        month: data.month,
        day: data.day,
        hour: data.hour,
        minute: data.minute,
        second: data.second
      }
    };

  } catch (error) {
    console.error("Event lookup failed", error);
    return null;
  }
};

export const executeTimeTravel = async (
  lat: number,
  lng: number,
  time: TimeParams,
  useMock: boolean = false
): Promise<TravelResult> => {
  if (useMock) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getRandomMockResult());
        }, 2000); // Fake processing time
    });
  }

  // Ensure we have a key
  await checkAndRequestApiKey();

  // Initialize client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Step 1: ChronoVisor System Prompt (Using Gemini 3 Pro for high-quality reasoning)
  const systemInstruction = `
    You are the ChronoVisor OS, a quantum-temporal visualization engine.
    Your inputs are strictly defined coordinates (LAT, LNG) and a precise timestamp.
    
    Your directive:
    1. EXTRACT geographic identity: Determine the exact location (City, Region, or Landmark) from coordinates.
    2. ANALYZE temporal context: Access historical or futurological databases for that specific DATE and TIME at that location.
    3. SYNTHESIZE visual parameters: Create a highly specific, atmospheric description for a visual generator.
    
    Crucial: Consider the season (Month), time of day (Hour/Minute), and specific historical context of that exact moment.
    
    Rules:
    - If Year < -3000: Focus on geography, flora, fauna, or ancient neolithic settlements.
    - If Year > 2025: Extrapolate technological, environmental, or societal evolution based on current trends.
    - Be specific. Avoid generic descriptions.
  `;

  const userPrompt = `
    Input Parameters:
    VARIABLE_LAT: ${lat}
    VARIABLE_LNG: ${lng}
    VARIABLE_YEAR: ${time.year}
    VARIABLE_MONTH: ${time.month}
    VARIABLE_DAY: ${time.day}
    VARIABLE_TIME: ${time.hour}:${time.minute}:${time.second}
    
    Execute visualization protocol.
  `;

  const textResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          locationName: { type: Type.STRING, description: "Name of the location" },
          description: { type: Type.STRING, description: "Atmospheric narrative description (2-3 sentences)" },
          visualPrompt: { type: Type.STRING, description: "Detailed image generation prompt including lighting based on time of day" }
        },
        required: ["locationName", "description", "visualPrompt"]
      }
    }
  });

  let locationData;
  try {
     locationData = JSON.parse(textResponse.text || "{}");
  } catch (e) {
    console.error("Failed to parse JSON", e);
    locationData = {
      locationName: "Temporal Flux Error",
      description: "Unable to lock onto spacetime coordinates. The timeline is unstable.",
      visualPrompt: `Abstract glitched time travel visual, coordinates ${lat}, ${lng}, year ${time.year}`
    };
  }

  // Step 2: Generate Image (Using Nano Banana Pro / Gemini 3 Pro Image Preview)
  
  const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalImagePrompt = `
    ${locationData.visualPrompt}
    Cinematic composition, 8k resolution, highly detailed, photorealistic. 
    Mood: Immersive, atmospheric.
    Date: ${time.month}/${time.day}/${time.year} Time: ${time.hour}:${time.minute}. Location: ${locationData.locationName}.
  `;

  let imageUrl: string | null = null;

  try {
    const imageResponse = await imageAi.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: finalImagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (err) {
    console.error("Image generation failed", err);
  }

  return {
    locationName: locationData.locationName || "Unknown Sector",
    description: locationData.description || "No data available.",
    time: time,
    imageUrl: imageUrl
  };
};