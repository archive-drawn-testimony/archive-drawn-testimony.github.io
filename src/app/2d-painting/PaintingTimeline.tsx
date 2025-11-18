"use client";
import { useMemo } from "react";
import SVG from "react-inlinesvg";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { State } from "../../../store/store";
import { setSelectedPainting } from "../../../store/appSlice";

export interface PaintingTimelineProps {
  paintings: Array<any>;
}

export function PaintingTimeline(props: PaintingTimelineProps) {
  const { paintings } = props;
  const dispatch = useDispatch();
  const selectedPainting = useSelector(
    (state: State) => state.app.selectedPainting
  );

  const svgs = useMemo(() => {
    return paintings.map((e) => {
      return e.props.svgFile;
    });
  }, [paintings]);

  return (
    <div
      className="w-full h-22 grid items-center painting-timeline border-t border-gray-300 relative"
      style={{
        gridTemplateColumns: `repeat(${Math.max(
          1,
          svgs.length
        )}, minmax(0, 1fr))`,
      }}
    >
      {svgs.map((e, i) => {
        return (
          <div className="relative items-center justify-between flex pr-5">
            <div className="absolute top-0 left-0 w-full h-full flex items-center">
              <div
                className={`h-1 w-full ${
                  i < selectedPainting ? "bg-amber-800" : "bg-amber-100"
                }`}
              ></div>
            </div>
            <div
              className={`size-18 rounded-full overflow-hidden bg-slate-50 relative cursor-pointer shadow-md items-center ${
                selectedPainting === i ? "border border-gray-400" : ""
              }`}
              key={`timeline-entry-${i}`}
              onClick={() => {
                dispatch(setSelectedPainting(i));
              }}
            >
              <SVG
                src={e}
                className="size-full object-contain absolute"
                // style={{
                //   backgroundImage: "url('/assets/paper-texture.jpg')",
                // }}
                preProcessor={(code) => {
                  return code.replaceAll('id="', 'id="timeline-');
                }}
              />
            </div>
            {selectedPainting === i && (
              <>
                <div
                  className={`size-12 rounded-full overflow-hidden bg-slate-50 relative cursor-pointer shadow-md items-center`}
                  key={`timeline-sub-entry-${i}`}
                  onClick={() => {
                    dispatch(setSelectedPainting(i));
                  }}
                ></div>
                <div
                  className={`size-12 rounded-full overflow-hidden bg-slate-50 relative cursor-pointer shadow-md items-center`}
                  key={`timeline-sub-entry-${i}-2`}
                  onClick={() => {
                    dispatch(setSelectedPainting(i));
                  }}
                ></div>
              </>
            )}
          </div>
        );
      })}
      <svg className="size-full absolute top-0 left-0 pointer-events-none">
        <filter id="roughpaper-timeline">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04"
            result="noise"
            numOctaves="5"
          />

          <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
        </filter>
        <rect
          width={"100%"}
          height={"100%"}
          filter="url(#roughpaper-timeline)"
          opacity={0.3}
          fill="white"
        />
      </svg>
    </div>
  );
}
