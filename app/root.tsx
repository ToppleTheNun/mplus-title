import { type TypedResponse } from "@remix-run/node";
import {
  json,
  type LinksFunction,
  type MetaFunction,
  type SerializeFrom,
} from "@remix-run/node";
import {
  Form,
  Links,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import { type FormEventHandler } from "react";
import { useEffect, useRef } from "react";

import { env } from "~/env/client";
import stylesheet from "~/tailwind.css";

import { seasons } from "./seasons";
import {
  extraOverlayNames,
  isNotNull,
  orderedRegionsBySize,
  overlays,
} from "./utils";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesheet }];
};

export const loader = (): TypedResponse<{ ENV: Record<string, unknown> }> => {
  return json({
    ENV: {
      VERCEL_ANALYTICS_ID: env.VERCEL_ANALYTICS_ID,
    },
  });
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ENV: SerializeFrom<typeof loader>["ENV"];
  }
}

const title = "Mythic+ Estimated Title Cutoff";

export const meta: MetaFunction = () => {
  const url = "https://mplus-title.vercel.app/";
  const description =
    "Displays estimated rank & score required for the seasonal Mythic+ title.";

  return {
    charset: "utf-8",
    title,
    viewport: "width=device-width,initial-scale=1",
    "og:url": url,
    "twitter:url": url,
    "image:alt": title,
    "og:type": "website",
    "og:title": title,
    "og:image:alt": title,
    "og:description": description,
    "twitter:description": description,
    "twitter:creator": "@gerrit_alex",
    "twitter:title": title,
    "og:site_name": title,
    "og:locale": "en_US",
    "twitter:image:alt": title,
    "twitter:card": "summary",
    description,
    name: title,
    author: "Gerrit Alex",
    "revisit-after": "7days",
    distribution: "global",
  };
};

export default function App(): JSX.Element {
  const { ENV } = useLoaderData<typeof loader>();

  return (
    <html lang="en" dir="auto" className="antialiased">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-900 text-gray-200">
        <main className="m-auto max-w-7xl">
          <h1 className="pb-2 pt-8 text-center text-2xl font-semibold">
            {title}
          </h1>

          <p className="pb-4 text-center italic">updates hourly</p>
          <p className="pb-4 text-center italic">
            extrapolation ignores the first FOUR weeks of a season. further
            weeks are weighted relatively to today
          </p>

          <div className="pb-4 text-center">
            <a
              className="cursor-pointer pb-4 underline"
              target="_blank"
              rel="noreferrer noopener"
              href="https://forms.gle/xWwPFGJ5DKyntRgq9"
            >
              help improving the site by answering a couple questions
            </a>
          </div>

          <Nav />
          <Outlet />
          <ScrollRestoration />
          <Analytics />
          <Scripts />
          <LiveReload />
          <Footer />
          <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(ENV)}`,
            }}
          />
        </main>
      </body>
    </html>
  );
}

const linkClassName =
  "flex space-x-2 px-2 py-1 text-white transition-all duration-200 ease-in-out rounded-lg outline-none bg-gray-700 hover:bg-gray-500 focus:outline-none focus:ring-2 focus-ring-gray:500";
const activeLinkClassName = "underline bg-gray-500";

function navLinkClassNameActivity({ isActive }: { isActive: boolean }) {
  return isActive ? `${linkClassName} ${activeLinkClassName}` : linkClassName;
}

function Nav() {
  const now = Date.now();
  const navigation = useNavigation();
  const [params] = useSearchParams();

  const paramsAsString = params ? `?${params.toString()}` : "";

  return (
    <>
      <nav className="flex w-full flex-col flex-wrap justify-between gap-3 md:flex-row md:px-4">
        <ul className="flex flex-col space-y-2 px-4 pt-4 md:flex-row md:space-x-2 md:space-y-0 md:px-0 md:pt-0">
          {seasons.map((season) => {
            const body = (
              <>
                <img
                  src={season.seasonIcon}
                  alt=""
                  loading="lazy"
                  height="24"
                  width="24"
                  className="h-6 w-6"
                />
                <span>{season.name}</span>
              </>
            );

            return (
              <li key={season.slug}>
                {season.startDates.us &&
                now >= season.startDates.us &&
                navigation.state === "idle" ? (
                  <NavLink
                    className={navLinkClassNameActivity}
                    to={`${season.slug}${paramsAsString}`}
                  >
                    {body}
                  </NavLink>
                ) : (
                  <span
                    className={linkClassName
                      .replace("bg-gray-700", "bg-gray-800")
                      .replace(
                        "hover:bg-gray-500",
                        `${
                          navigation.state === "idle"
                            ? "cursor-not-allowed"
                            : "cursor-wait"
                        } grayscale`
                      )}
                  >
                    {body}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <RegionToggle navigationState={navigation.state} />
        <OverlaysToggle navigationState={navigation.state} />
      </nav>
      <CustomExtrapolationForm navigationState={navigation.state} />
    </>
  );
}

type RegionToggleProps = CustomExtrapolationFormProps;

function RegionToggle({ navigationState }: RegionToggleProps) {
  const submit = useSubmit();
  const routeData = useRouteLoaderData("routes/$season/index");

  const ref = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange: FormEventHandler<HTMLInputElement> = () => {
    // By default, "disabled" checkboxes won't have their values sent along when submitting a form. We're getting
    // around that by using refs to get the values. :BearWicked:
    const formData = ref.current
      .filter(isNotNull)
      .filter((ref) => ref.checked)
      .reduce((acc, ref) => {
        acc.set(ref.name, "on");
        return acc;
      }, new FormData());

    submit(formData, { action: "/regions", method: "post", replace: true });
  };

  return (
    <fieldset disabled={navigationState !== "idle"}>
      <ul className="flex flex-col space-y-2 px-4 pt-4 md:flex-row md:space-x-2 md:space-y-0 md:px-0 md:pt-0">
        {orderedRegionsBySize.map((region, index) => {
          // @ts-expect-error type EnhancedSeason
          const checked = routeData.regionsToDisplay.includes(region);
          // @ts-expect-error type EnhancedSeason
          const disabled = routeData.regionsToDisplay.length === 1 && checked;

          return (
            <li
              key={region}
              className={`${
                disabled || navigationState !== "idle"
                  ? linkClassName
                      .replace("bg-gray-700", "bg-gray-800")
                      .replace(
                        "hover:bg-gray-500",
                        `${
                          disabled ? "cursor-not-allowed" : "cursor-wait"
                        } grayscale`
                      )
                  : linkClassName
              }`}
            >
              <label
                className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
                htmlFor={`toggle-${region}`}
              >
                {region.toUpperCase()}
              </label>

              <input
                disabled={disabled}
                type="checkbox"
                className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
                id={`toggle-${region}`}
                defaultChecked={checked}
                aria-labelledby={`toggle-${region}`}
                name={region}
                ref={(node) => {
                  ref.current[index] = node;
                }}
                onChange={handleChange}
              />
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

type OverlaysToggleProps = CustomExtrapolationFormProps;

function OverlaysToggle({ navigationState }: OverlaysToggleProps) {
  const submit = useSubmit();
  const routeData = useRouteLoaderData("routes/$season/index");

  const ref = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange: FormEventHandler<HTMLInputElement> = () => {
    // By default, "disabled" checkboxes won't have their values sent along when submitting a form. We're getting
    // around that by using refs to get the values. :BearWicked:
    const formData = ref.current
      .filter(isNotNull)
      .filter((ref) => ref.checked)
      .reduce((acc, ref) => {
        acc.set(ref.name, "on");
        return acc;
      }, new FormData());

    submit(formData, { action: "/overlays", method: "post", replace: true });
  };

  return (
    <fieldset disabled={navigationState !== "idle"}>
      <ul className="flex flex-col space-y-2 px-4 pt-4 md:flex-row md:space-x-2 md:space-y-0 md:px-0 md:pt-0">
        {overlays.map((overlay, index) => {
          // @ts-expect-error type EnhancedSeason
          const checked = routeData.overlaysToDisplay.includes(overlay);

          return (
            <li
              key={overlay}
              className={`${
                navigationState === "idle"
                  ? linkClassName
                  : linkClassName
                      .replace("bg-gray-700", "bg-gray-800")
                      .replace("hover:bg-gray-500", "cursor-wait grayscale")
              }`}
            >
              <label className="cursor-pointer" htmlFor={`toggle-${overlay}`}>
                {extraOverlayNames[overlay]}
              </label>

              <input
                type="checkbox"
                className="cursor-pointer"
                id={`toggle-${overlay}`}
                defaultChecked={checked}
                aria-labelledby={`toggle-${overlay}`}
                name={overlay}
                ref={(node) => {
                  ref.current[index] = node;
                }}
                onChange={handleChange}
              />
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

type CustomExtrapolationFormProps = {
  navigationState: ReturnType<typeof useNavigation>["state"];
};

function CustomExtrapolationForm({
  navigationState,
}: CustomExtrapolationFormProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeData = useRouteLoaderData("routes/$season/index");
  const ref = useRef<HTMLInputElement | null>(null);

  const customExtrapolationEndDate = (() => {
    try {
      const params = new URL(`https://dummy.com/${location.search}`)
        .searchParams;
      const maybeDate = params.get("extrapolationEndDate");

      return maybeDate ?? null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!customExtrapolationEndDate && ref.current) {
      ref.current.value = "";
    }
  }, [customExtrapolationEndDate]);

  const seasonHasStarted = (() => {
    try {
      // @ts-expect-error return type of the loader within the route
      return Object.values(routeData.startDates).some(
        // @ts-expect-error cba casting, its null|number
        (maybeDate) => maybeDate !== null && maybeDate <= Date.now()
      );
    } catch {
      return false;
    }
  })();

  if (!seasonHasStarted) {
    return null;
  }

  const seasonHasEndedInEveryRegion = (() => {
    try {
      // @ts-expect-error return type of the loader within the route
      return Object.values(routeData.endDates).every(
        // @ts-expect-error cba casting, its null|number
        (maybeDate) => maybeDate !== null && maybeDate <= Date.now()
      );
    } catch {
      return false;
    }
  })();

  const seasonHasEndingDate = seasonHasEndedInEveryRegion
    ? false
    : (() => {
        try {
          // @ts-expect-error return type of the loader within the route
          return Object.values(routeData.endDates).every(
            (maybeDate) => maybeDate !== null
          );
        } catch {
          return false;
        }
      })();

  if (seasonHasEndedInEveryRegion) {
    return null;
  }

  const disabled = seasonHasEndingDate || navigationState !== "idle";

  function createExtrapolationFormButtonClassName(disabled: boolean) {
    const base = linkClassName.replace("flex", "");

    return disabled
      ? linkClassName
          .replace("flex", "")
          .replace("bg-gray-700", "bg-gray-800")
          .replace(
            "hover:bg-gray-500",
            `${
              navigationState === "loading"
                ? "cursor-wait"
                : "cursor-not-allowed"
            } grayscale`
          )
      : base;
  }

  return (
    <>
      <div className="px-4 pt-4">
        <Form
          className="flex flex-col space-y-2 md:inline md:space-x-2 md:space-y-0"
          action={location.pathname}
        >
          <fieldset
            disabled={disabled}
            className="inline-flex  w-full justify-between space-x-2 md:w-auto"
          >
            <label
              className={
                seasonHasEndingDate
                  ? "w-full text-center italic md:text-left"
                  : ""
              }
              htmlFor="date"
              id="date-label"
            >
              Custom Extrapolation{" "}
              {seasonHasEndingDate ? "returns next season." : null}
            </label>
            <input
              aria-labelledby="date-label"
              id="date"
              ref={ref}
              className={`rounded-md border-0 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
                seasonHasEndingDate ? "hidden md:inline-block" : ""
              }`}
              type="date"
              min={new Date().toISOString().split("T")[0]}
              name="extrapolationEndDate"
              required
              disabled={seasonHasEndingDate}
              defaultValue={customExtrapolationEndDate ?? undefined}
            />
          </fieldset>

          <button
            disabled={disabled}
            type="submit"
            className={createExtrapolationFormButtonClassName(disabled)}
          >
            Extrapolate
          </button>
          <button
            disabled={disabled}
            className={createExtrapolationFormButtonClassName(
              disabled || !customExtrapolationEndDate
            )}
            type="reset"
            onClick={() => {
              navigate(window.location.pathname);
            }}
          >
            Reset
          </button>
        </Form>
      </div>
      {customExtrapolationEndDate ? (
        <div className="px-4 pt-4 text-white">
          <div className="flex flex-col rounded-lg bg-red-500 p-2 dark:bg-red-500/40 md:flex-row">
            <div className="flex justify-center" />
            <div className="p-2">
              <b>Warning</b>: you are using a custom extrapolation date. Use at
              your own risk; extrapolation is not perfect and will be inaccurate
              the further the date lies in the future.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Footer() {
  return (
    <footer className="mb-6">
      <nav>
        <ul className="flex justify-center space-x-2">
          <li>
            <a
              href="https://github.com/ljosberinn/mplus-title"
              rel="noopener noreferrer"
              className="underline"
              target="_blank"
            >
              github
            </a>
          </li>
          <li>
            <a
              href="https://twitter.com/gerrit_alex"
              rel="noopener noreferrer"
              className="underline"
              target="_blank"
            >
              twitter
            </a>
          </li>
          <li>
            <a
              href="https://www.patreon.com/warcraftlogs"
              rel="noopener noreferrer"
              className="underline"
              target="_blank"
            >
              patreon (Warcraft Logs)
            </a>
          </li>
          <li>
            <a
              href="https://www.patreon.com/RaiderIO"
              rel="noopener noreferrer"
              className="underline"
              target="_blank"
            >
              patreon (RaiderIO)
            </a>
          </li>
          <li>
            <a
              href="https://raider.io/characters/eu/twisting-nether/Xepheris"
              rel="noopener noreferrer"
              className="underline"
              target="_blank"
            >
              rio
            </a>
          </li>
          <li>
            <span title="discord">Xepheris#6539</span>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
