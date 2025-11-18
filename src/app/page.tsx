"use client";
import dynamic from "next/dynamic";
import { Provider, useDispatch, useSelector } from "react-redux";
import { State, store } from "../../store/store";
import { setMode, setSelectedPainting } from "../../store/appSlice";
import Image from "next/image";
import title from "../../public/images/SteenTitle_lines.png";
import { CursorArrowRaysIcon } from "@heroicons/react/24/solid";
import Painting from "./2d-painting/painting";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Noto_Serif, Reenie_Beanie } from "next/font/google";
import { PaintingTimeline } from "./2d-painting/PaintingTimeline";

const reenie_beanie = Reenie_Beanie({ weight: "400", subsets: ["latin"] });
const noto_serif = Noto_Serif({ weight: "400", subsets: ["latin"] });

// const Model = dynamic(() => import("@/components/model-viewer/Model"), {
//   loading: () => <p>Loading...</p>,
//   ssr: false,
// });

const paintings = [
  <Painting key={"title"} svgFile={"/images/new/Title page-1.svg"} />,
  <Painting key={"young"} svgFile={"/images/new/Young Steen-1.svg"} />,
  <Painting key={"transport"} svgFile={"/images/new/Transport scene-1.svg"} />,
  <Painting key={"soccer"} svgFile={"/images/new/Soccer scene-1.svg"} />,
  <Painting
    key={"whitebusses"}
    svgFile={"/images/new/White Buses scene-1.svg"}
  />,
];

function MainMenu() {
  const mode = useSelector((state: State) => state.app.mode);
  const dispatch = useDispatch();

  const selectedPainting = useSelector(
    (state: State) => state.app.selectedPainting
  );
  // const [selectedPainting, setSelectedPainting] = useState(0);
  const [storyData, setStoryData] = useState();

  useEffect(() => {
    fetch("/story-data.json")
      .then((res) => res.json())
      .then(function (json) {
        setStoryData(json);
      });
  }, []);

  const painting = useMemo(() => {
    return paintings.filter((e, i) => i === selectedPainting)[0];
  }, [selectedPainting]);

  return (
    <div
      className="grid grid-cols-[80%_20%] grid-rows-1 overflow-hidden size-full painting-main"
      onClick={() => {
        dispatch(setMode("explore"));
      }}
    >
      <div className="relative size-full items-center grid grid-rows-[1fr_auto] grid-cols-1 justify-center">
        <div className="size-full">
          <div className="absolute top-0 left-0 h-16 w-full z-50 flex px-2">
            <Link
              className="relative w-25"
              href={"/"}
              onClick={() => {
                dispatch(setSelectedPainting(0));
              }}
            >
              <Image
                src="/assets/cropped-logoOctober-1.png"
                fill={true}
                style={{ objectFit: "contain" }}
                sizes={"40px 40px"}
                alt="Memorise Logo"
              />
            </Link>
          </div>
          {painting}
          <div
            className="absolute bottom-23 right-3 rounded-md bg-gray-100 px-2 shadow hover:shadow-lg hover:bg-gray-500 hover:text-white cursor-pointer"
            onClick={() => {
              dispatch(
                setSelectedPainting((selectedPainting + 1) % paintings.length)
              );
            }}
          >
            Next
          </div>
          {selectedPainting > 0 && (
            <div
              className="absolute bottom-23 left-3 rounded-md bg-gray-100 px-2 shadow hover:shadow-lg hover:bg-gray-500 hover:text-white cursor-pointer"
              onClick={() => {
                dispatch(
                  setSelectedPainting((selectedPainting - 1) % paintings.length)
                );
              }}
            >
              Previous
            </div>
          )}
        </div>
        <div className="size-full">
          <PaintingTimeline paintings={paintings} />
        </div>
      </div>
      <div className="size-full relative">
        <div className="size-full absolute top-0 left-0">
          {storyData != null && (
            <div className="size-full text-gray-950 relative border-l border-gray-300">
              <div className="size-full overflow-hidden overflow-y-scroll flex items-center">
                <div className="size-full flex gap-4 flex-col p-3 px-6 justify-center text-justify">
                  <div className={`text-xl ${noto_serif.className}`}>
                    {storyData[selectedPainting]?.title ?? "Please add title."}
                  </div>
                  <div
                    className={`text-2xl mt-[-10px] ${reenie_beanie.className}`}
                  >
                    {storyData[selectedPainting]?.subtitle ??
                      "Please add subtitle."}
                  </div>
                  <div className="text-sm flex gap-2 flex-col">
                    {storyData[selectedPainting]?.text ?? "Please add text."}
                  </div>
                  {/* <div className="grid grid-cols-[auto_auto] items-center justify-center gap-2">
                    <CursorArrowRaysIcon
                      width={30}
                      height={30}
                      className="size-8 animate-myping"
                    />
                    <div>Click "Next" to begin Steen's story!</div>
                  </div> */}
                </div>
              </div>
              <svg className="size-full absolute top-0 left-0">
                <filter id="roughpaper-sidebar">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.04"
                    result="noise"
                    numOctaves="5"
                  />

                  <feDiffuseLighting
                    in="noise"
                    lighting-color="#fff"
                    surfaceScale="2"
                  >
                    <feDistantLight azimuth="45" elevation="60" />
                  </feDiffuseLighting>
                </filter>
                <rect
                  width={"100%"}
                  height={"100%"}
                  filter="url(#roughpaper-sidebar)"
                  opacity={0.3}
                  fill="white"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Provider store={store}>
      <MainMenu />
    </Provider>
  );
}
