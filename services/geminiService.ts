import { GoogleGenAI } from "@google/genai";
import { DogProfile, ActivityLevel, Trail, CompletedHike, WeatherData } from "../types";

// Helper to extract JSON from markdown code blocks
const extractJson = (text: string) => {
  try {
    // Try to find JSON inside markdown blocks (relaxed regex)
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    
    // Fallback: Find array or object notation in raw text
    const openBracket = text.indexOf('[');
    const closeBracket = text.lastIndexOf(']');
    if (openBracket !== -1 && closeBracket !== -1 && closeBracket > openBracket) {
      return JSON.parse(text.substring(openBracket, closeBracket + 1));
    }

    const openBrace = text.indexOf('{');
    const closeBrace = text.lastIndexOf('}');
    if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
      return JSON.parse(text.substring(openBrace, closeBrace + 1));
    }

    // Try parsing the whole text
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from model output", text);
    return null;
  }
};

/**
 * Analyzes a breed name to return bio-mechanical data for the "Bio-Engine".
 * Uses Google Search Grounding for accuracy.
 */
export const analyzeBreed = async (breedName: string): Promise<Partial<DogProfile>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";
    const prompt = `
      Search for the dog breed "${breedName}".
      Based on the search results, provide biological and biomechanical data.
      
      Return ONLY a JSON object with this structure (no markdown text outside the JSON):
      {
        "isBrachycephalic": boolean, // true if short-snouted/high heat risk (e.g. Pug, Bulldog)
        "strideLengthMeters": number, // estimated average stride length in meters
        "energyBaseline": "Low" | "Moderate" | "High" | "Working",
        "heatTolerance": number // 0 to 10, where 0 is extremely sensitive, 10 is very tolerant
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is not compatible with tools in some contexts, using manual parse
      },
    });

    if (response.text) {
      const data = extractJson(response.text);
      if (data) {
        return {
          isBrachycephalic: data.isBrachycephalic,
          strideLengthMeters: data.strideLengthMeters,
          energyBaseline: data.energyBaseline as ActivityLevel,
          heatTolerance: data.heatTolerance,
        };
      }
    }
    throw new Error("No structured data returned");
  } catch (error) {
    console.error("Error analyzing breed:", error);
    // Fallback defaults
    return {
      isBrachycephalic: false,
      strideLengthMeters: 0.5,
      energyBaseline: ActivityLevel.Moderate,
      heatTolerance: 5,
    };
  }
};

/**
 * Fetches real-time weather using Open-Meteo API.
 */
export const getCurrentWeather = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    // Using Open-Meteo API for reliable, free, non-key weather data
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=fahrenheit`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Weather API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const current = data.current;

    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    const getCondition = (code: number) => {
        if (code === 0) return "Clear Sky";
        if (code === 1) return "Mainly Clear";
        if (code === 2) return "Partly Cloudy";
        if (code === 3) return "Overcast";
        if ([45, 48].includes(code)) return "Foggy";
        if ([51, 53, 55].includes(code)) return "Drizzle";
        if ([56, 57].includes(code)) return "Freezing Drizzle";
        if ([61, 63, 65].includes(code)) return "Rain";
        if ([66, 67].includes(code)) return "Freezing Rain";
        if ([71, 73, 75].includes(code)) return "Snow";
        if (code === 77) return "Snow Grains";
        if ([80, 81, 82].includes(code)) return "Rain Showers";
        if ([85, 86].includes(code)) return "Snow Showers";
        if ([95, 96, 99].includes(code)) return "Thunderstorm";
        return "Unknown";
    };

    return {
      tempF: current.temperature_2m,
      condition: getCondition(current.weather_code),
      humidity: current.relative_humidity_2m,
      realFeelF: current.apparent_temperature
    };

  } catch (error) {
    console.error("Weather fetch failed", error);
    
    return {
      tempF: 70,
      condition: "Fair",
      humidity: 50,
      realFeelF: 70
    };
  }
};

/**
 * Generates smart trail recommendations using Google Maps Grounding.
 */
export const getSmartTrailRecommendations = async (
  profile: DogProfile,
  location: string,
  weatherTempF: number,
  coords?: { lat: number; lng: number }
): Promise<Trail[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";
    const conditions = profile.medicalConditions.join(", ");
    
    // Updated prompt to explicitly permit estimation and prevent refusals
    const prompt = `
      Task: Find 3 hiking trails near "${location}" and analyze them for a ${profile.breed} dog (Age: ${profile.age}).
      
      1. Use the Google Maps tool to verify the existence and location of trails.
      2. Analyze the trails for "Dog-ability" considering ${weatherTempF}°F and conditions: ${conditions || "None"}.
      
      CRITICAL: The Maps tool may not provide specific metrics like elevation or hazards. You must ESTIMATE these based on your internal knowledge of the trail's terrain and region. 
      - Do NOT refuse the request because "map data is missing".
      - Provide realistic estimates for distance, elevation, and difficulty.
      - Infer tags and hazards (e.g., "Ticks", "Foxtails") based on the environment.

      Return a JSON array of objects. Schema:
      [
        {
          "id": "string",
          "name": "string",
          "distanceMiles": number,
          "elevationGainFeet": number,
          "difficulty": "Easy" | "Moderate" | "Hard",
          "dogAbilityScore": number (0-100),
          "dogAbilityReason": "string (Why fits/doesn't fit this specific dog)",
          "tags": ["string"],
          "hazards": ["string"]
        }
      ]
    `;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (coords) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: coords.lat,
            longitude: coords.lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    let trails: Trail[] = [];
    
    if (response.text) {
      const parsed = extractJson(response.text);
      if (Array.isArray(parsed)) {
        trails = parsed;
      }
    }

    // Enhance trails with grounding chunks (URLs) if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && trails.length > 0) {
      trails = trails.map(trail => {
        // Try to find a chunk with a matching title
        const matchingChunk = chunks.find(chunk => 
          chunk.web?.title?.toLowerCase().includes(trail.name.toLowerCase()) || 
          trail.name.toLowerCase().includes(chunk.web?.title?.toLowerCase() || '')
        );
        
        return {
          ...trail,
          uri: matchingChunk?.web?.uri || matchingChunk?.maps?.uri
        };
      });
    }

    return trails;
  } catch (error) {
    console.error("Error fetching trails:", error);
    return [];
  }
};

/**
 * Generates a detailed physiological analysis of the completed hike.
 * Uses Gemini 2.5 Flash with Thinking Config.
 */
export const generatePostActivityAnalysis = async (
  profile: DogProfile,
  hike: CompletedHike,
  weather: WeatherData
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";
    
    const prompt = `
      You are an expert veterinary sports medicine analyst. Analyze this completed activity for a dog.
      
      **Subject:**
      - Name: ${profile.name}
      - Breed: ${profile.breed}
      - Age: ${profile.age} years
      - Weight: ${profile.weightKg} kg
      - Conditions: ${profile.medicalConditions.length > 0 ? profile.medicalConditions.join(", ") : "None"}

      **Activity Data:**
      - Duration: ${Math.floor(hike.durationSeconds / 60)} minutes
      - Distance: ${hike.distanceMiles.toFixed(2)} miles
      - Estimated Steps: ${Math.floor(hike.dogSteps)}
      - Avg Strain Index: ${hike.strainIndex}/100
      
      **Environment:**
      - Temperature: ${weather.tempF}°F
      - Condition: ${weather.condition}

      **Task:**
      Provide a concise but deep physiological summary of this session.
      1. **Performance Insight:** How did the dog perform based on breed standards (e.g. is this a light warmup for a Husky or a marathon for a Pug?)?
      2. **Caloric Estimation:** Provide a scientific estimate of calories burned.
      3. **Recovery Plan:** Specific advice for the next 24 hours based on age and intensity.

      Format the output as clean, friendly text (2-3 paragraphs max). Do not use JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 } // Enable thinking for deeper physiological analysis
      },
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Error generating post-hike analysis:", error);
    return "Great job! Keep monitoring for any signs of fatigue.";
  }
};