export const getDistanceFromLatLonInMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in miles
  return d;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

// Added SimpleKalmanFilter class for GPS noise smoothing
export class SimpleKalmanFilter {
  private _err_measure: number;
  private _err_estimate: number;
  private _q: number;
  private _current_estimate: number;
  private _last_estimate: number;
  private _kalman_gain: number;

  constructor(process_noise: number = 1, measurement_noise: number = 1, estimated_error: number = 1, initial_value: number = 0) {
    this._q = process_noise;
    this._err_measure = measurement_noise;
    this._err_estimate = estimated_error;
    this._current_estimate = initial_value;
    this._last_estimate = initial_value;
    this._kalman_gain = 0;
  }

  public setState(value: number) {
    this._current_estimate = value;
    this._last_estimate = value;
  }

  public filter(measurement: number, control_vector: number = 0, measurement_noise?: number): number {
    if (measurement_noise) {
        this._err_measure = measurement_noise;
    }
    
    // Prediction update
    const prediction = this._last_estimate + control_vector;
    const prediction_error = this._err_estimate + this._q;

    // Measurement update
    this._kalman_gain = prediction_error / (prediction_error + this._err_measure);
    this._current_estimate = prediction + this._kalman_gain * (measurement - prediction);
    this._err_estimate = (1 - this._kalman_gain) * prediction_error;
    
    this._last_estimate = this._current_estimate;

    return this._current_estimate;
  }
}