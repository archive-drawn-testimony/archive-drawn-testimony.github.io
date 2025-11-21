import Link from "next/link";
import Image from "next/image";
import { JSX } from "react";

export function Navbar(): JSX.Element {
  return (
    <nav className="flex items-center justify-between flex-wrap p-2">
      <Link href="/">
        <div className="flex items-center flex-shrink-0 text-white mr-6">
          <Image
            alt="Memorise Logo"
            className="w-auto h-12"
            width={50}
            height={50}
            src="/cropped-logoOctober-1.png"
          />
        </div>
      </Link>
      {/* <div className="block lg:hidden">
        <button className="flex items-center px-3 py-2 border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white">
          <svg
            className="fill-current h-3 w-3"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>
      </div> */}
      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div className="text-sm lg:flex-grow">
          {/* <Link
            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 hover:text-black mr-4"
            href="/model-viewer/scene-1"
          >
            Scene 1
          </Link>
          <Link
            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 hover:text-black mr-4"
            href="/model-viewer/scene-2"
          >
            Scene 2
          </Link> */}
          <Link
            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 hover:text-black mr-4"
            href="/model-viewer/scene-3"
          >
            Barack 56
          </Link>
          <Link
            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 hover:text-black mr-4"
            href="/model-viewer/scene-5"
          >
            Santa Clara
          </Link>
          {/* <Link
            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 hover:text-black mr-4"
            href="/model-viewer/scene-4"
          >
            Bernburg
          </Link> */}
          {/*  <a
            href="#responsive-header"
            className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4"
          >
            Examples
          </a>
          <a
            href="#responsive-header"
            className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white"
          >
            Blog
          </a>
        </div>
        <div>
          <a
            href="#"
            className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal-500 hover:bg-white mt-4 lg:mt-0"
          >
            Download
          </a> */}
        </div>
      </div>
    </nav>
  );
}
