import type { VoiceSettings, UserInfo, ApiVoice } from "../types";
import { proxyService } from "./proxyService";

const API_ENDPOINT_BASE = "https://api.elevenlabs.io/v1";

// Global flag to enable/disable proxy
let proxyEnabled = false;

/**
 * Set proxy enabled state
 */
export const setProxyEnabled = (enabled: boolean) => {
  proxyEnabled = enabled;
};

/**
 * Get proxy enabled state
 */
export const getProxyEnabled = () => proxyEnabled;

/**
 * Generates speech by calling the ElevenLabs API.
 * @param text The text to convert to speech.
 * @param settings The voice settings.
 * @param apiKey The user's ElevenLabs API key.
 * @param voiceId The ID of the selected voice.
 * @param modelId The ID of the selected model.
 * @returns A promise that resolves to the generated audio blob.
 */
export const generateSpeech = async (
  text: string,
  settings: VoiceSettings,
  apiKey: string,
  voiceId: string,
  modelId: string
): Promise<Blob> => {
  console.log("Generating speech with:", { text, settings, voiceId, modelId });

  const apiEndpoint = `${API_ENDPOINT_BASE}/text-to-speech/${voiceId}`;

  const headers = {
    Accept: "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
  };

  let voiceSettings: { [key: string]: any } = {};

  if (modelId === "eleven_v3") {
    const stabilityValue = settings.stability; // This is a value from 0-100
    if (stabilityValue < 33) {
      voiceSettings.stability = 0.0; // Creative
    } else if (stabilityValue < 67) {
      voiceSettings.stability = 0.5; // Natural
    } else {
      voiceSettings.stability = 1.0; // Robust
    }
  } else {
    // For all other models, start with base settings
    voiceSettings = {
      stability: settings.stability / 100,
      similarity_boost: settings.similarity / 100,
    };

    // Style and speaker boost are only supported on v1 models.
    if (modelId.includes("v1")) {
      voiceSettings.style = settings.styleExaggeration / 100;
      voiceSettings.use_speaker_boost = settings.speakerBoost;
    }
  }

  const body = JSON.stringify({
    text: text,
    model_id: modelId,
    voice_settings: voiceSettings,
  });

  let response: Response;
  
  if (proxyEnabled) {
    // Use proxy
    const proxyResponse = await proxyService.makeRequest({
      url: apiEndpoint,
      method: "POST",
      headers,
      body: JSON.parse(body),
    });

    // Check if response is error
    if (!proxyResponse.success || proxyResponse.status !== 200) {
      let errorMessage = `API Error: ${proxyResponse.status}`;
      try {
        if (typeof proxyResponse.body === 'string') {
          const errorData = JSON.parse(proxyResponse.body);
          errorMessage = errorData.detail?.message || errorMessage;
        } else if (typeof proxyResponse.body === 'object') {
          errorMessage = proxyResponse.body.detail?.message || errorMessage;
        }
      } catch {
        // Ignore parse errors
      }
      throw new Error(errorMessage);
    }

    // For audio responses, proxyService returns Blob directly
    if (proxyResponse.body instanceof Blob) {
      return proxyResponse.body;
    }
    
    // If body is not a blob, it might be an error response
    // Try to create a Response object for error handling
    const responseBody = typeof proxyResponse.body === 'string' 
      ? proxyResponse.body 
      : JSON.stringify(proxyResponse.body);
    
    response = new Response(responseBody, {
      status: proxyResponse.status,
      statusText: proxyResponse.status === 200 ? 'OK' : 'Error',
      headers: proxyResponse.headers,
    });
  } else {
    // Direct fetch
    response = await fetch(apiEndpoint, {
      method: "POST",
      headers: headers,
      body: body,
    });
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API Key.");
    }
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.detail && errorBody.detail.message) {
        errorMessage = errorBody.detail.message;
      } else if (errorBody.detail) {
        errorMessage = JSON.stringify(errorBody.detail);
      }

      // Handle specific error cases
      if (
        errorBody.detail &&
        errorBody.detail.status === "voice_limit_reached"
      ) {
        errorMessage =
          "Voice limit reached. You have reached your maximum amount of custom voices. Please upgrade your subscription or use a different voice.";
      } else if (
        errorBody.detail &&
        errorBody.detail.status === "character_limit_reached"
      ) {
        errorMessage =
          "Character limit reached. You have used all your available characters for this month.";
      } else if (response.status === 422) {
        errorMessage =
          "Invalid request parameters. Please check your voice settings and model selection.";
      }
    } catch (e) {
      // Could not parse JSON, use the default error message
    }
    throw new Error(errorMessage);
  }

  const audioBlob = await response.blob();
  return audioBlob;
};

/**
 * Fetches user information, including subscription details and character limits.
 * @param apiKey The user's ElevenLabs API key.
 * @returns A promise that resolves to the user's information.
 */
export const getUserInfo = async (apiKey: string): Promise<UserInfo> => {
  const apiEndpoint = `${API_ENDPOINT_BASE}/user`;

  const headers = {
    Accept: "application/json",
    "xi-api-key": apiKey,
  };

  let response: Response;
  
  if (proxyEnabled) {
    // Use proxy
    const proxyResponse = await proxyService.makeRequest({
      url: apiEndpoint,
      method: "GET",
      headers,
    });

    // Convert proxy response to Response-like object
    const jsonBody = typeof proxyResponse.body === 'string' 
      ? JSON.parse(proxyResponse.body)
      : proxyResponse.body;
    
    response = new Response(JSON.stringify(jsonBody), {
      status: proxyResponse.status,
      statusText: proxyResponse.status === 200 ? 'OK' : 'Error',
      headers: { 'Content-Type': 'application/json', ...proxyResponse.headers },
    });
  } else {
    // Direct fetch
    response = await fetch(apiEndpoint, {
      method: "GET",
      headers: headers,
    });
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API Key.");
    }
    throw new Error(
      `Failed to fetch user info: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  if (!data.subscription) {
    throw new Error("Subscription data not found in user info response.");
  }

  return {
    character_count: data.subscription.character_count,
    character_limit: data.subscription.character_limit,
  };
};

/**
 * Fetches the list of all available voices from the ElevenLabs API.
 * @param apiKey The user's ElevenLabs API key.
 * @returns A promise that resolves to an array of voices.
 */
export const getVoices = async (apiKey: string): Promise<ApiVoice[]> => {
  const apiEndpoint = `${API_ENDPOINT_BASE}/voices`;
  const headers = {
    Accept: "application/json",
    "xi-api-key": apiKey,
  };

  let response: Response;
  
  if (proxyEnabled) {
    // Use proxy
    const proxyResponse = await proxyService.makeRequest({
      url: apiEndpoint,
      method: "GET",
      headers,
    });

    // Convert proxy response to Response-like object
    const jsonBody = typeof proxyResponse.body === 'string' 
      ? JSON.parse(proxyResponse.body)
      : proxyResponse.body;
    
    response = new Response(JSON.stringify(jsonBody), {
      status: proxyResponse.status,
      statusText: proxyResponse.status === 200 ? 'OK' : 'Error',
      headers: { 'Content-Type': 'application/json', ...proxyResponse.headers },
    });
  } else {
    // Direct fetch
    response = await fetch(apiEndpoint, {
      method: "GET",
      headers: headers,
    });
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API Key.");
    }
    throw new Error(
      `Failed to fetch voices: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.voices;
};
