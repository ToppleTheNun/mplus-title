import {
  json,
  type LinksFunction,
  type MetaFunction,
  type SerializeFrom,
  type TypedResponse,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import { SSRProvider } from "react-aria";

import { env } from "~/env/client";
import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: stylesheet },

    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    },
    {
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon.ico",
    },
    { rel: "manifest", href: "/site.webmanifest" },
    {
      rel: "mask-icon",
      href: "/safari-pinned-tab.svg",
      color: "#5bbad5",
    },
  ];
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

const title = "Title Cutoff History & Estimation";

export const meta: MetaFunction = () => {
  const url = "https://mplus-title.vercel.app/";
  const description =
    "Seasonal Mythic+ Title Score History & Estimation, updated hourly.";

  return {
    charset: "utf-8",
    title,
    viewport: "width=device-width,initial-scale=1",
    "og:url": url,
    "twitter:url": url,
    "image:alt": title,
    "og:type": "website",
    "og:title": title,
    "og:image": `${url}logo.webp`,
    "og:image:alt": title,
    "og:description": description,
    "twitter:description": description,
    "twitter:creator": "@gerrit_alex",
    "twitter:title": title,
    "twitter:image": `${url}logo.webp`,
    "og:site_name": title,
    "og:locale": "en_US",
    "twitter:image:alt": title,
    "twitter:card": "summary",
    description,
    name: title,
    author: "Gerrit Alex",
    "revisit-after": "7days",
    distribution: "global",
    "msapplication-TileColor": "#da532c",
    "theme-color": "#ffffff",
  };
};

export default function App(): JSX.Element {
  const { ENV } = useLoaderData<typeof loader>();

  return (
    <html
      lang="en"
      dir="auto"
      className="bg-gray-900 text-gray-200 antialiased"
    >
      <head>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen">
        <div className="flex min-h-screen flex-col">
          <SSRProvider>
            <Outlet />
          </SSRProvider>
        </div>
        <ScrollRestoration />
        <Analytics />
        <Scripts />
        <LiveReload />
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
      </body>
    </html>
  );
}
