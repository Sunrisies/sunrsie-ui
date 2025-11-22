import { CesiumTerrainProvider } from "cesium";

export interface ICalculateLocationType {
    longitude: number;
    latitude: number;
    heading: number;
    terrainProvider: CesiumTerrainProvider;
}