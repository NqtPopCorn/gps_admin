import { POI, POIType, Tour } from "../types";

export const initialPOIs: POI[] = [
  {
    id: "poi-1",
    localizedData: {
      vi: {
        name: "Japanese Bridge",
        description: {
          text: "Historic bridge",
        },
      },
    },
    latitude: 15.8787,
    longitude: 108.3288,
    radius: 30,
    type: POIType.MAIN,
    image: "https://picsum.photos/seed/bridge/400/300",
  },
  {
    id: "poi-2",
    localizedData: {
      vi: {
        name: "Tan Ky House",
        description: {
          text: "Old house",
        },
      },
    },
    latitude: 15.8775,
    longitude: 108.327,
    radius: 20,
    type: POIType.MAIN,
    image: "https://picsum.photos/seed/house/400/300",
  },
  {
    id: "poi-3",
    localizedData: {
      vi: {
        name: "Public WC",
        description: {
          text: "Restroom",
        },
      },
    },
    latitude: 15.876,
    longitude: 108.329,
    radius: 10,
    type: POIType.WC,
    image: "https://picsum.photos/seed/wc/400/300",
  },
];

export const initialTours: Tour[] = [
  {
    id: "tour-1",
    name: "Heritage Walk",
    description: "Explore ancient town",
    duration: 120,
    poiIds: ["poi-1", "poi-2"],
    image: "https://picsum.photos/seed/tour/800/300",
    createdAt: new Date().toISOString(),
  },
];
