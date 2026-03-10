export enum POIType {
  MAIN = "MAIN",
  WC = "WC",
  TICKET = "TICKET",
  PARKING = "PARKING",
  BOAT = "BOAT",
}

export interface POI {
  id: string;
  localizedData: LocalizedData;
  latitude: number;
  longitude: number;
  radius: number;
  type: POIType;
  image: string;
  distance?: string;
}

export type LocalizedData = {
  [lang_code: string]: {
    name: string;
    description: {
      text: string;
      audio?: string;
    };
  };
};

export interface Tour {
  id: string;
  name: string;
  description?: string;
  duration: number;
  poiIds: string[];
  image?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}
