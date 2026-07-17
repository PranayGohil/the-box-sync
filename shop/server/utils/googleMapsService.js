const axios = require("axios");

/**
 * Centralized service to interact with the Google Maps Platform APIs.
 */
class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("WARNING: GOOGLE_MAPS_API_KEY is not defined in the environment variables.");
    }
  }

  /**
   * Helper to parse address components from Google Geocoding response
   */
  extractAddressComponents(components) {
    const extract = (types) => {
      const found = components.find(c => types.some(t => c.types.includes(t)));
      return found ? found.long_name : "";
    };

    return {
      city: extract(["locality", "administrative_area_level_2"]),
      state: extract(["administrative_area_level_1"]),
      country: extract(["country"]),
      postal_code: extract(["postal_code"]),
      locality: extract(["sublocality_level_1", "neighborhood"]),
      sublocality: extract(["sublocality_level_2", "sublocality"])
    };
  }

  /**
   * Reverse Geocodes coordinates to address components
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  async reverseGeocode(lat, lng) {
    if (!this.apiKey) throw new Error("Google Maps API Key is missing.");

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
    const response = await axios.get(url);

    if (response.data.status !== "OK" || !response.data.results || response.data.results.length === 0) {
      throw new Error(`Geocoding failed with status: ${response.data.status}`);
    }

    const firstResult = response.data.results[0];
    const parsedComponents = this.extractAddressComponents(firstResult.address_components);

    return {
      place_id: firstResult.place_id,
      formatted_address: firstResult.formatted_address,
      ...parsedComponents
    };
  }

  /**
   * Computes driving route road distance and duration using Google Routes API
   * @param {object} origin - { latitude, longitude, placeId }
   * @param {object} destination - { latitude, longitude, placeId }
   */
  async computeRoadDistance(origin, destination) {
    if (!this.apiKey) throw new Error("Google Maps API Key is missing.");

    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

    // Setup origin
    const originPayload = {};
    if (origin.placeId) {
      originPayload.placeId = origin.placeId;
    } else {
      originPayload.location = {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude
        }
      };
    }

    // Setup destination
    const destinationPayload = {};
    if (destination.placeId) {
      destinationPayload.placeId = destination.placeId;
    } else {
      destinationPayload.location = {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude
        }
      };
    }

    const payload = {
      origin: originPayload,
      destination: destinationPayload,
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      computeAlternativeRoutes: false,
      languageCode: "en-US",
      units: "METRIC"
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": this.apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"
    };

    const response = await axios.post(url, payload, { headers });

    if (!response.data || !response.data.routes || response.data.routes.length === 0) {
      throw new Error("No driving route found between origin and destination.");
    }

    const route = response.data.routes[0];
    const distanceMeters = route.distanceMeters || 0;
    const duration = route.duration || "0s"; // e.g. "620s"

    // Convert meters to kilometers
    const distanceKm = distanceMeters / 1000;

    // Convert duration seconds to human readable minutes
    const seconds = parseInt(duration.replace("s", ""), 10) || 0;
    const minutes = Math.ceil(seconds / 60);
    const durationDesc = `${minutes} min`;

    return {
      road_distance: parseFloat(distanceKm.toFixed(2)),
      duration: durationDesc
    };
  }
}

module.exports = new GoogleMapsService();
