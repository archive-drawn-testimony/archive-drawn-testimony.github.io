import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedGroup } from "../../../store/appSlice";
import { State } from "../../../store/store";

interface ThumbnailPaintingProps {
  elementID: string;
  svgFile: string;
}

export function ThumbnailPainting(props: ThumbnailPaintingProps) {
  const { elementID, svgFile } = props;
  const dispatch = useDispatch();

  const [image, setImage] = useState<string | null>(null);

  const selectedGroup = useSelector((state: State) => state.app.selectedGroup);

  useEffect(() => {
    fetch(svgFile)
      .then((res) => res.text())
      .then(function (svgtext) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgtext, "image/svg+xml");
        const originalSvg = doc.querySelector("svg");

        const group = originalSvg?.querySelector(`#${elementID}`) ?? null;

        if (group != null) {
          const image = (group as SVGElement).querySelector("image");
          if (image != null) {
            setImage(image.getAttribute("xlink:href"));
          }
        }
      });
  }, [svgFile, elementID]);

  return (
    <div
      className={`size-12 rounded-full overflow-hidden bg-slate-50 relative cursor-pointer shadow-md items-center ${
        selectedGroup === elementID ? "border-3 border-gray-400" : ""
      }`}
      key={`timeline-sub-entry-${elementID}`}
      onClick={(e) => {
        dispatch(setSelectedGroup(elementID));
      }}
    >
      {image && (
        <div className="size-full flex items-center justify-center">
          <img
            style={{ filter: "drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 5px)" }}
            src={image}
          />
        </div>
      )}
    </div>
  );
}
