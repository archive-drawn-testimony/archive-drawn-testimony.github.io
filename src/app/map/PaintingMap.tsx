"use client";

import Map, { Layer, Source, type LayerProps, type MapRef } from "@vis.gl/react-maplibre";
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon, Position } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

type LngLatPosition = [number, number];
type TravelBounds = [LngLatPosition, LngLatPosition];
type TravelBoundsFitter = Pick<MapRef, "fitBounds">;
type World1938Properties = {
    NAME?: string;
    [key: string]: unknown;
};
type CountryLabelProperties = World1938Properties & {
    labelArea: number;
    labelTier: "large" | "medium" | "small" | "tiny" | "micro";
};
type CountryLabelFeatureCollection = FeatureCollection<Point, CountryLabelProperties>;

interface PaintingMapProps {
    className?: string;
    start: { lat: number, lon: number }
    end?: { lat: number, lon: number }
    mapyear?: number;
}

const travelAnimationDurationMs = 4500;
const travelReplayPauseMs = 1300;
const singlePointBoundsPaddingDegrees = 2;
const minimumLabelArea = 0.2;
const availableHistoricalMapYears = [1938, 1945];

const emptyCountryLabels: CountryLabelFeatureCollection = {
    type: "FeatureCollection",
    features: [],
};

const transparentMapStyle: StyleSpecification = {
    version: 8,
    name: "Transparent historical borders",
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {},
    layers: [
        {
            id: "map-background",
            type: "background",
            paint: {
                "background-color": "#f2f2f2",
                "background-opacity": 1.0
            },
        },
    ],
};

const world1938BorderLayer: LayerProps = {
    id: "world-1938-borders",
    type: "line",
    paint: {
        "line-color": "#000000",
        "line-width": 1,
    },
};

const world1938FillLayer: LayerProps = {
    id: "world-1938-fill",
    type: "fill",
    paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 1.0
    },
};

function createWorld1938LabelLayer(
    id: string,
    labelTier: CountryLabelProperties["labelTier"],
    minzoom: number
): LayerProps {
    return {
        id,
        type: "symbol",
        minzoom,
        filter: ["==", ["get", "labelTier"], labelTier],
        layout: {
            "text-field": ["get", "NAME"],
            "text-font": ["Noto Sans Regular"],
            "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                1,
                8,
                4,
                13,
            ],
            // "text-transform": "uppercase",
            "text-letter-spacing": 0.08,
            "text-max-width": 8,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
        },
        paint: {
            "text-color": "#3d3d3d",
            "text-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                1,
                0.45,
                3,
                0.85,
            ],
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
            "text-halo-blur": 0.5,
        },
    };
}

const world1938LabelLayers = [
    createWorld1938LabelLayer("world-1938-labels-large", "large", 0),
    createWorld1938LabelLayer("world-1938-labels-medium", "medium", 0),
    createWorld1938LabelLayer("world-1938-labels-small", "small", 0),
    createWorld1938LabelLayer("world-1938-labels-tiny", "tiny", 0),
    createWorld1938LabelLayer("world-1938-labels-micro", "micro", 5),
];

const fullTravelRouteLayer: LayerProps = {
    id: "full-travel-route",
    type: "line",
    paint: {
        "line-color": "#000000",
        "line-opacity": 0.18,
        "line-width": 2,
        "line-dasharray": [2, 2],
    },
};

const animatedTravelRouteLayer: LayerProps = {
    id: "animated-travel-route",
    type: "line",
    paint: {
        "line-color": "#000000",
        "line-width": 3,
        "line-opacity": 0.9,
    },
};

const travelPointLayer: LayerProps = {
    id: "travel-point",
    type: "circle",
    paint: {
        "circle-color": "#000000",
        "circle-radius": 5,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
    },
};

function toPosition(coordinate: { lat: number, lon: number }): LngLatPosition {
    return [coordinate.lon, coordinate.lat];
}

function interpolatePosition(start: LngLatPosition, end: LngLatPosition, progress: number): LngLatPosition {
    return [
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress,
    ];
}

function easeInOut(progress: number) {
    return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

function createLineFeature(coordinates: LngLatPosition[]): Feature<LineString> {
    return {
        type: "Feature",
        properties: {},
        geometry: {
            type: "LineString",
            coordinates,
        },
    };
}

function createPointFeature(coordinate: LngLatPosition): Feature<Point> {
    return {
        type: "Feature",
        properties: {},
        geometry: {
            type: "Point",
            coordinates: coordinate,
        },
    };
}

function isLngLatPosition(position: Position): position is LngLatPosition {
    return typeof position[0] === "number" && typeof position[1] === "number";
}

function getOuterRing(polygon: Position[][]) {
    return polygon[0]?.filter(isLngLatPosition) ?? [];
}

function getSignedRingArea(ring: LngLatPosition[]) {
    if (ring.length < 3) {
        return 0;
    }

    let area = 0;

    for (let i = 0; i < ring.length; i += 1) {
        const current = ring[i];
        const next = ring[(i + 1) % ring.length];
        area += current[0] * next[1] - next[0] * current[1];
    }

    return area / 2;
}

function getRingCentroid(ring: LngLatPosition[]): LngLatPosition {
    const signedArea = getSignedRingArea(ring);

    if (signedArea === 0) {
        const total = ring.reduce<LngLatPosition>(
            (sum, coordinate) => [sum[0] + coordinate[0], sum[1] + coordinate[1]],
            [0, 0]
        );

        return [total[0] / ring.length, total[1] / ring.length];
    }

    let longitude = 0;
    let latitude = 0;

    for (let i = 0; i < ring.length; i += 1) {
        const current = ring[i];
        const next = ring[(i + 1) % ring.length];
        const factor = current[0] * next[1] - next[0] * current[1];
        longitude += (current[0] + next[0]) * factor;
        latitude += (current[1] + next[1]) * factor;
    }

    const scale = 1 / (6 * signedArea);
    return [longitude * scale, latitude * scale];
}

function getLabelTier(labelArea: number): CountryLabelProperties["labelTier"] | undefined {
    if (labelArea >= 100) {
        return "large";
    }

    if (labelArea >= 20) {
        return "medium";
    }

    if (labelArea >= 5) {
        return "small";
    }

    if (labelArea >= 1) {
        return "tiny";
    }

    if (labelArea >= minimumLabelArea) {
        return "micro";
    }

    return undefined;
}

function createCountryLabelFeatures(data: FeatureCollection<Polygon | MultiPolygon, World1938Properties>): CountryLabelFeatureCollection {
    const features: CountryLabelFeatureCollection["features"] = [];

    data.features.forEach((feature) => {
        const name = feature.properties?.NAME;

        if (name == null) {
            return;
        }

        const polygons = feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

        polygons.forEach((polygon) => {
            const ring = getOuterRing(polygon);
            const labelArea = Math.abs(getSignedRingArea(ring));
            const labelTier = getLabelTier(labelArea);

            if (ring.length < 3 || labelTier == null) {
                return;
            }

            features.push({
                type: "Feature",
                properties: {
                    ...feature.properties,
                    labelArea,
                    labelTier,
                },
                geometry: {
                    type: "Point",
                    coordinates: getRingCentroid(ring),
                },
            });
        });
    });

    return {
        type: "FeatureCollection",
        features,
    };
}

function getHistoricalMapYear(mapyear?: number) {
    if (mapyear == null) {
        return availableHistoricalMapYears[0];
    }

    const matchingYear = availableHistoricalMapYears
        .filter((availableYear) => availableYear <= mapyear)
        .at(-1);

    return matchingYear ?? availableHistoricalMapYears[0];
}

function getHistoricalMapUrl(mapyear?: number) {
    return `/maps/world_${getHistoricalMapYear(mapyear)}.geojson`;
}

function createTravelBounds(start: LngLatPosition, end?: LngLatPosition): TravelBounds {
    if (end == null || (start[0] === end[0] && start[1] === end[1])) {
        return [
            [
                start[0] - singlePointBoundsPaddingDegrees,
                start[1] - singlePointBoundsPaddingDegrees,
            ],
            [
                start[0] + singlePointBoundsPaddingDegrees,
                start[1] + singlePointBoundsPaddingDegrees,
            ],
        ];
    }

    return [
        [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
        [Math.max(start[0], end[0]), Math.max(start[1], end[1])],
    ];
}

function fitMapToTravelBounds(map: TravelBoundsFitter, bounds: TravelBounds) {
    map.fitBounds(bounds, {
        padding: 48,
        duration: 900,
        maxZoom: 5,
    });
}

export function PaintingMap(props: PaintingMapProps) {
    const mapRef = useRef<MapRef | null>(null);
    const [animationProgress, setAnimationProgress] = useState(props.end ? 0 : 1);
    const [countryLabels, setCountryLabels] = useState<CountryLabelFeatureCollection>(emptyCountryLabels);

    const startPosition = useMemo(() => toPosition(props.start), [props.start.lat, props.start.lon]);
    const endPosition = useMemo(() => props.end ? toPosition(props.end) : undefined, [props.end?.lat, props.end?.lon]);
    const travelBounds = useMemo(() => createTravelBounds(startPosition, endPosition), [startPosition, endPosition]);
    const historicalMapUrl = useMemo(() => getHistoricalMapUrl(props.mapyear), [props.mapyear]);

    const routeFeature = useMemo(() => {
        if (endPosition == null) {
            return createLineFeature([startPosition, startPosition]);
        }

        return createLineFeature([startPosition, endPosition]);
    }, [startPosition, endPosition]);

    const currentPosition = useMemo(() => {
        if (endPosition == null) {
            return startPosition;
        }

        return interpolatePosition(startPosition, endPosition, animationProgress);
    }, [animationProgress, endPosition, startPosition]);

    const animatedRouteFeature = useMemo(() => {
        return createLineFeature([startPosition, currentPosition]);
    }, [currentPosition, startPosition]);

    const travelPointFeature = useMemo(() => {
        return createPointFeature(currentPosition);
    }, [currentPosition]);

    useEffect(() => {
        let isMounted = true;

        setCountryLabels(emptyCountryLabels);

        fetch(historicalMapUrl)
            .then((response) => response.json())
            .then((data: FeatureCollection<Polygon | MultiPolygon, World1938Properties>) => {
                if (isMounted) {
                    setCountryLabels(createCountryLabelFeatures(data));
                }
            })
            .catch(() => {
                if (isMounted) {
                    setCountryLabels(emptyCountryLabels);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [historicalMapUrl]);

    useEffect(() => {
        if (endPosition == null) {
            setAnimationProgress(1);
            return;
        }

        setAnimationProgress(0);

        let animationFrame = 0;
        let startedAt: number | undefined;

        function animate(timestamp: number) {
            startedAt ??= timestamp;

            const elapsed = timestamp - startedAt;
            const replayDuration = travelAnimationDurationMs + travelReplayPauseMs;
            const replayElapsed = elapsed % replayDuration;
            const linearProgress = Math.min(replayElapsed / travelAnimationDurationMs, 1);
            setAnimationProgress(easeInOut(linearProgress));

            animationFrame = window.requestAnimationFrame(animate);
        }

        animationFrame = window.requestAnimationFrame(animate);

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [endPosition]);

    useEffect(() => {
        const map = mapRef.current;

        if (map == null) {
            return;
        }

        fitMapToTravelBounds(map, travelBounds);
    }, [travelBounds]);

    return (
        <div className={`painting-map size-full bg-transparent z-1 ${props.className ?? ""}`}>
            <Map
                ref={mapRef}
                style={{ width: "100%", height: "100%" }}
                initialViewState={{
                    longitude: 10,
                    latitude: 30,
                    zoom: 1.15,
                }}
                mapStyle={transparentMapStyle}
                minZoom={0.75}
                maxZoom={8}
                projection="mercator"
                attributionControl={false}
                dragPan={false}
                scrollZoom={false}
                boxZoom={false}
                doubleClickZoom={false}
                touchZoomRotate={false}
                dragRotate={false}
                keyboard={false}
                onLoad={(event) => {
                    fitMapToTravelBounds(event.target, travelBounds);
                }}
            >
                <Source id="world1938" type="geojson" data={historicalMapUrl}>
                    <Layer {...world1938FillLayer} />
                    <Layer {...world1938BorderLayer} />
                </Source>
                <Source id="world1938Labels" type="geojson" data={countryLabels}>
                    {world1938LabelLayers.map((layer) => (
                        <Layer key={layer.id} {...layer} />
                    ))}
                </Source>
                <Source id="fullTravelRoute" type="geojson" data={routeFeature}>
                    <Layer {...fullTravelRouteLayer} />
                </Source>
                <Source id="animatedTravelRoute" type="geojson" data={animatedRouteFeature}>
                    <Layer {...animatedTravelRouteLayer} />
                </Source>
                <Source id="travelPoint" type="geojson" data={travelPointFeature}>
                    <Layer {...travelPointLayer} />
                </Source>
            </Map>
        </div>
    );
}
