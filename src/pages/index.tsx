import type { Factions, Regions } from "@prisma/client";
import type { PageConfig } from "next";
import { Fragment } from "react";
import { red, blue } from "tailwindcss/colors";
import type {
  VictoryChartProps,
  VictoryLineProps,
  VictoryScatterProps,
} from "victory";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
} from "victory";

import type { Cutoff, FactionData } from "./api/cron";

export type IndexProps = {
  data: Record<Regions, FactionData>;
  meta: {
    generatedAt: number;
    nextUpdateAt: number;
  };
  history: {
    timestamp: number;
    faction: Factions;
    region: Regions;
    customRank: number;
    customScore: number;
    rioRank: number;
    rioScore: number;
  }[];
};

type RowProps = {
  faction: Factions;
  region: string;
  custom: Cutoff;
  rio: Cutoff;
  history: IndexProps["history"];
};

function Row({ faction, region, custom, rio, history }: RowProps) {
  return (
    <>
      <tr
        className={`text-center text-blue-400 hover:bg-gray-800 ${
          faction === "alliance" ? "text-blue-400" : "text-red-400"
        }`}
      >
        <td>{region}</td>
        <td>{faction}</td>
        <td>
          {custom.rank} ({rio.rank})
        </td>
        <td>
          {custom.score} ({rio.score})
        </td>
      </tr>
      <tr>
        <td className="text-center" colSpan={4}>
          <details>
            <summary className="cursor-pointer">history</summary>
            <Graph history={history} faction={faction} />
          </details>
        </td>
      </tr>
    </>
  );
}

type GraphProps = {
  history: RowProps["history"];
  faction: Factions;
};

const calculateOverallMinMax = (
  data: GraphProps["history"],
  type: "score" | "rank"
): null | { min: number; max: number } => {
  const result = data.reduce<{
    min: number;
    max: number;
  }>(
    (acc, dataset) => {
      const value = type === "score" ? dataset.customScore : dataset.customRank;

      if (value === 0) {
        return acc;
      }

      if (value < acc.min) {
        return {
          ...acc,
          min: Math.floor(value),
        };
      }

      if (value > acc.max) {
        return {
          ...acc,
          max: Math.ceil(value),
        };
      }

      return acc;
    },
    {
      min: Infinity,
      max: -Infinity,
    }
  );

  if (result.min === Infinity || result.max === -Infinity) {
    return null;
  }

  return result;
};

const calculateChunksByDay = (
  data: GraphProps["history"],
  type: "score" | "rank"
) => {
  const isScore = type === "score";

  const someValidator = (
    dataset: typeof data[number],
    compareSet: typeof data[number]
  ) => {
    if (isScore) {
      return dataset.customScore === compareSet.customScore;
    }

    return dataset.customRank === compareSet.customRank;
  };
  // eslint-disable-next-line unicorn/prefer-object-from-entries
  const chunksByDay = data.reduce<Record<string, typeof data>>(
    (acc, dataset) => {
      if (dataset.customScore === 0) {
        return acc;
      }

      const day = new Date(dataset.timestamp * 1000);
      const date = day.toDateString();

      if (
        date in acc &&
        !acc[date].some((stored) => someValidator(stored, dataset))
      ) {
        acc[date].push(dataset);
      } else {
        acc[date] = [dataset];
      }

      return acc;
    },
    {}
  );

  return Object.values(chunksByDay).map((dayData) => {
    return {
      x: dayData[0].timestamp * 1000,
      y: Math.round(
        dayData.reduce((acc, dataset) => {
          return acc + (isScore ? dataset.customScore : dataset.customRank);
        }, 0) / dayData.length
      ),
    };
  });
};

const factionColors: Record<Factions, string> = {
  alliance: blue["400"],
  horde: red["400"],
};

const chartStyle: VictoryChartProps["theme"] = {
  axis: {
    style: {
      tickLabels: {
        fill: "white",
      },
    },
  },
};

const axisStyle = {
  axisLabel: {
    fill: "white",
  },
};

const scale: VictoryChartProps["scale"] = { x: "time" };

function Graph({ history, faction }: GraphProps) {
  const scoreThresholds = calculateOverallMinMax(history, "score");
  const rankThresholds = calculateOverallMinMax(history, "rank");

  const scoreData = calculateChunksByDay(history, "score");
  const rankData = calculateChunksByDay(history, "rank");

  const factionColor = factionColors[faction];

  const scatterStyle: VictoryScatterProps["style"] = {
    data: {
      stroke: factionColor,
      fill: factionColor,
    },
  };

  const lineStyle: VictoryLineProps["style"] = {
    data: {
      stroke: factionColor,
    },
  };

  return (
    <>
      {rankThresholds ? (
        <VictoryChart
          theme={chartStyle}
          minDomain={{
            y: rankThresholds.min - 5,
          }}
          maxDomain={{
            y: rankThresholds.max + 5,
          }}
          scale={scale}
        >
          <VictoryScatter data={rankData} style={scatterStyle} />
          <VictoryLine data={rankData} style={lineStyle} />

          <VictoryAxis label="Day" style={axisStyle} />

          <VictoryAxis
            dependentAxis
            label="Rank"
            style={axisStyle}
            axisLabelComponent={<VictoryLabel dy={-5} />}
          />
        </VictoryChart>
      ) : null}

      {scoreThresholds ? (
        <VictoryChart
          minDomain={{
            y: scoreThresholds.min - 0.0025 * scoreThresholds.min,
          }}
          maxDomain={{
            y: scoreThresholds.max + 0.0025 * scoreThresholds.max,
          }}
          theme={chartStyle}
          scale={scale}
        >
          <VictoryScatter data={scoreData} style={scatterStyle} />
          <VictoryLine data={scoreData} style={lineStyle} />

          <VictoryAxis label="Day" style={axisStyle} />

          <VictoryAxis
            dependentAxis
            label="Score"
            style={axisStyle}
            axisLabelComponent={<VictoryLabel dy={-5} />}
          />
        </VictoryChart>
      ) : null}
    </>
  );
}

export default function Index({
  data,
  meta,
  history,
}: IndexProps): JSX.Element {
  return (
    <main className="max-w-2xl m-auto">
      <h1 className="pt-8 pb-4 text-2xl text-center text-semibold">
        Mythic+ Estimated Title Cutoff
      </h1>
      <table className="w-full">
        <caption className="pb-4">
          if any rank/score is 0, an error occured during loading. wait for the
          next update.
          <br />
          <br />
          numbers in brackets are based on the raider.io api. these seem to lag
          behind my manual calculation, but I've included them for transparency
          reasons.
        </caption>

        <thead>
          <tr>
            <th>Region</th>
            <th>Faction</th>
            <th>Rank</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(data).map(([region, factionData]) => {
            return (
              <Fragment key={region}>
                <Row
                  faction="alliance"
                  region={region}
                  custom={factionData.alliance.custom}
                  rio={factionData.alliance.rio}
                  history={history
                    .filter(
                      (dataset) =>
                        dataset.faction === "alliance" &&
                        dataset.region === region
                    )
                    .reverse()}
                />
                <Row
                  faction="horde"
                  region={region}
                  custom={factionData.horde.custom}
                  rio={factionData.horde.rio}
                  history={history
                    .filter(
                      (dataset) =>
                        dataset.faction === "horde" && dataset.region === region
                    )
                    .reverse()}
                />
              </Fragment>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={4} className="pt-4 text-center">
              last generated at{" "}
              {new Date(meta.generatedAt).toLocaleString("en-US")} <br /> next
              update around{" "}
              {new Date(meta.nextUpdateAt).toLocaleString("en-US")}
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="text-center">
              <a
                href="https://github.com/ljosberinn/mplus-title"
                rel="noopener noreferrer"
                className="underline"
                target="_blank"
              >
                repo
              </a>{" "}
              |{" "}
              <a
                href="https://twitter.com/gerrit_alex"
                rel="noopener noreferrer"
                className="underline"
                target="_blank"
              >
                twitter
              </a>{" "}
              |{" "}
              <a
                href="https://raider.io/characters/eu/blackmoore/Xepheris"
                rel="noopener noreferrer"
                className="underline"
                target="_blank"
              >
                rio
              </a>
            </td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}

export const config: PageConfig = {
  unstable_runtimeJS: false,
};

export { getStaticProps } from "../lib/getStaticProps";
