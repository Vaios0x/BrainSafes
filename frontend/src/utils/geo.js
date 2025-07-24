import axios from "axios";

export async function getCountry() {
  try {
    const res = await axios.get("https://ipinfo.io/json?token=YOUR_TOKEN");
    return res.data.country;
  } catch {
    return null;
  }
} 