"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import SVG from "react-inlinesvg";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { State } from "../../../store/store";
import { setSelectedGroup, setSelectedPainting } from "../../../store/appSlice";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { StoryEntry } from "../page";
import { ThumbnailPainting } from "./ThumbnailPainting";
import { Noto_Serif, Reenie_Beanie } from "next/font/google";

const noto_serif = Noto_Serif({ weight: "400", subsets: ["latin"] });
const reenie_beanie = Reenie_Beanie({ weight: "400", subsets: ["latin"] });

function sameElements(left: Array<string> = [], right: Array<string> = []) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export interface PaintingTimelineProps {
  paintings: Array<any>;
  storyData: Record<string, StoryEntry>;
  discoveredStoryKeys: Array<string>;
}

export function PaintingTimeline(props: PaintingTimelineProps) {
  const { paintings, storyData, discoveredStoryKeys } = props;
  const dispatch = useDispatch();
  const selectedPainting = useSelector(
    (state: State) => state.app.selectedPainting
  );
  const svgRef = useRef(null);

  const selectedGroup = useSelector((state: State) => state.app.selectedGroup);

  const [interactiveElements, setInteractiveElements] = useState<
    Record<string, Array<string>>
  >({});

  const currentInteractiveElements =
    interactiveElements[selectedPainting.toString()] ?? [];

  const selectedGroupIndex =
    selectedGroup != null
      ? currentInteractiveElements.indexOf(selectedGroup)
      : -1;

  const previousInteractiveElements =
    selectedPainting > 0
      ? interactiveElements[(selectedPainting - 1).toString()] ?? []
      : [];

  const canNavigatePrevious = selectedPainting > 0 || selectedGroup != null;
  const canNavigateNext =
    selectedGroupIndex >= 0
      ? selectedGroupIndex + 1 < currentInteractiveElements.length ||
      selectedPainting + 1 < paintings.length
      : currentInteractiveElements.length > 0 ||
      selectedPainting + 1 < paintings.length;

  const discoveredStoryCount = discoveredStoryKeys.length;
  const totalStoryCount = Object.keys(storyData).length;

  function navigatePrevious() {
    if (selectedGroupIndex > 0) {
      dispatch(
        setSelectedGroup(currentInteractiveElements[selectedGroupIndex - 1])
      );
      return;
    }

    if (selectedGroupIndex === 0) {
      dispatch(setSelectedGroup(null));
      return;
    }

    if (selectedPainting > 0) {
      const previousPainting = selectedPainting - 1;
      dispatch(setSelectedPainting(previousPainting));
      dispatch(
        setSelectedGroup(
          previousInteractiveElements[previousInteractiveElements.length - 1] ??
          null
        )
      );
    }
  }

  function navigateNext() {
    if (
      selectedGroupIndex >= 0 &&
      selectedGroupIndex + 1 < currentInteractiveElements.length
    ) {
      dispatch(
        setSelectedGroup(currentInteractiveElements[selectedGroupIndex + 1])
      );
      return;
    }

    if (selectedGroup == null && currentInteractiveElements.length > 0) {
      dispatch(setSelectedGroup(currentInteractiveElements[0]));
      return;
    }

    if (selectedPainting + 1 < paintings.length) {
      dispatch(setSelectedPainting(selectedPainting + 1));
      dispatch(setSelectedGroup(null));
    }
  }

  useEffect(() => {
    if (svgRef.current != null) {
      const image = (svgRef.current as HTMLElement).querySelector(
        "#background"
      );
      // images.forEach((element) => {
      //   if (element.id != null) {
      //     console.log(element.id, element);
      //   }
      // if (inactive !== true) {
      //   element.classList.add("myPath");
      //   element.addEventListener("click", clickHandler);
      // }
      // });
    }
  }, [svgRef.current]);

  return (
    <div className="size-full items-center grid grid-cols-[64px_auto_64px] gap-2 border-t border-gray-300 relative">
      {canNavigatePrevious && (
        <div
          className="rounded-full px-2 size-16 shadow hover:shadow-lg hover:bg-gray-400 hover:text-white cursor-pointer items-center justify-center flex"
          onClick={navigatePrevious}
        >
          <ChevronLeftIcon className="size-7" />
        </div>
      )}
      <div
        className="w-full grid items-center painting-timeline grid-rows-[auto_auto_auto] relative col-start-2"
        style={{
          gridTemplateColumns: `repeat(${Math.max(
            1,
            paintings.length
          )}, minmax(0, 1fr))`,
        }}
      >
        {paintings.map((e, i) => {
          const story = storyData ? storyData[e.key] ?? null : null;
          const paintingDiscovered = discoveredStoryKeys.includes(e.key);
          const previousPaintingDiscovered =
            i < paintings.length - 1 && discoveredStoryKeys.includes(paintings[i + 1].key);
          const connectingLineDiscovered =
            paintingDiscovered && previousPaintingDiscovered;
          let borderStyle = "border-3 border-gray-200";

          if (paintingDiscovered) {
            borderStyle = "border-3 border-gray-400"
          }
          if (selectedPainting === i && selectedGroup == null) {
            borderStyle = "border-3 border-gray-600"
          }

          return (
            <Fragment key={`fragment-${e.key}`}>
              <div
                key={`timeline-title-${i}`}
                className={`text-xs row-start-1 py-1 ${noto_serif.className}`}
              >
                {story?.shorttitle != null ? story.shorttitle : story?.title}
              </div>
              <div
                key={`timeline-image-${i}`}
                className="relative items-center justify-between flex pr-5 row-start-2"
              >
                <div className="absolute top-0 left-0 w-full h-full flex items-center">
                  <div
                    className={`h-1 mt-[4px] w-full ${connectingLineDiscovered ? "bg-gray-400" : "bg-gray-200"
                      }`}
                  ></div>
                </div>
                <div
                  className={`safari-rounded-clip size-18 rounded-full overflow-hidden relative cursor-pointer shadow-md items-center bg-white ${borderStyle} hover:border-gray-500`}
                  key={`timeline-entry-${i}`}
                  onClick={() => {
                    dispatch(setSelectedGroup(null));
                    dispatch(setSelectedPainting(i));
                  }}
                  ref={svgRef}
                >
                  <div className="size-full absolute">
                    <SVG
                      src={e.svgFile}
                      className="size-full object-contain"
                      preProcessor={(code) => {
                        const timelineKey = i.toString();
                        const discoveredElements = Object.keys(storyData).filter(
                          (element) => code.includes(`id="${element}"`)
                        );

                        setInteractiveElements((currentElements) => {
                          if (
                            sameElements(
                              currentElements[timelineKey],
                              discoveredElements
                            )
                          ) {
                            return currentElements;
                          }

                          return {
                            ...currentElements,
                            [timelineKey]: discoveredElements,
                          };
                        });

                        return code.replaceAll('id="', `id="timeline-${i}`);
                      }}
                    />
                  </div>
                </div>
                {selectedPainting === i &&
                  interactiveElements[i.toString()] != null &&
                  interactiveElements[i.toString()].map((ie, i) => (
                    <ThumbnailPainting
                      key={`timeline-thumbnail-${i}`}
                      elementID={ie}
                      svgFile={e.svgFile}
                      discovered={discoveredStoryKeys.includes(ie)}
                    />
                  ))}
              </div>
              <div
                key={`timeline-time-${i}`}
                className={`text-xs row-start-3 py-1 ${noto_serif.className}`}
              >
                {story?.time}
              </div>
            </Fragment>
          );
        })}
      </div>
      <div className="col-start-3 row-start-1 z-10 flex size-full flex-col items-center justify-center gap-1">
        {canNavigateNext && (
          <div
            className="px-2 shadow hover:shadow-lg hover:bg-gray-400 hover:text-white cursor-pointer size-16 rounded-full justify-center items-center flex"
            onClick={navigateNext}
          >
            <ChevronRightIcon className="size-7" />
          </div>
        )}
        <div
          className={`text-xs text-gray-600 ${noto_serif.className}`}
          aria-label={`Discovered ${discoveredStoryCount} of ${totalStoryCount} story entries`}
        >
          {discoveredStoryCount}/{totalStoryCount}
        </div>
      </div>
    </div>
  );
}
