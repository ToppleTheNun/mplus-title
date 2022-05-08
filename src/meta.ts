import type { Factions, Regions } from "@prisma/client";

export const orderedReasonsBySize: Regions[] = ["eu", "us", "tw", "kr"];

export const seasonStartDates: Record<string, Record<Regions, number>> = {
  "sl-season-3": {
    us: 1_646_146_800_000,
    eu: 1_646_190_000_000,
    kr: 1_646_258_400_000,
    tw: 1_646_258_400_000,
  },
  "sl-season-2": {
    us: 1_625_583_600_000,
    eu: 1_625_626_800_000,
    kr: 1_625_695_200_000,
    tw: 1_625_695_200_000,
  },
};

export const seasonEndings = Object.entries(seasonStartDates).reduce<
  Record<string, Record<Regions, number>>
>((acc, [, regionEndingTimestampMap], index, arr) => {
  const prevSeasonName = arr[index + 1]?.[0];

  if (!prevSeasonName) {
    return acc;
  }

  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

  acc[prevSeasonName] = {
    eu: regionEndingTimestampMap.eu - oneWeekInMs,
    us: regionEndingTimestampMap.eu - oneWeekInMs,
    tw: regionEndingTimestampMap.eu - oneWeekInMs,
    kr: regionEndingTimestampMap.eu - oneWeekInMs,
  };

  return acc;
}, {});

export const [latestSeason] = Object.keys(seasonStartDates);

export const confirmedCutoffs: Record<
  string,
  Record<Regions, Record<Factions, number>>
> = {
  "sl-season-3": {
    eu: {
      horde: 0,
      alliance: 0,
    },
    us: {
      horde: 0,
      alliance: 0,
    },
    kr: {
      horde: 0,
      alliance: 0,
    },
    tw: {
      horde: 0,
      alliance: 0,
    },
  },
  "sl-season-2": {
    eu: {
      horde: 0,
      alliance: 0,
    },
    // https://us.forums.blizzard.com/en/wow/t/m-tormented-hero-title-score-updated-daily/1184111
    us: {
      horde: 2847,
      alliance: 2768,
    },
    kr: {
      horde: 0,
      alliance: 0,
    },
    tw: {
      horde: 0,
      alliance: 0,
    },
  },
};

export const affixRotations: Record<
  string,
  [number, number, number, number][]
> = {
  "sl-season-3": [
    [9, 7, 13, 130], // Tyrannical, Bolstering, Explosive
    [10, 11, 124, 130], // Fortified, Bursting, Storming
    [9, 6, 3, 130], // Tyrannical, Raging, Volcanic
    [10, 122, 12, 130], // Fortified, Inspiring, Grievous
    [9, 123, 4, 130], // Tyrannical, Spiteful, Necrotic
    [10, 7, 14, 130], // Fortified, Bolstering, Quaking
    [9, 8, 124, 130], // Tyrannical, Sanguine, Storming
    [10, 6, 13, 130], // Fortified, Raging Explosive
    [9, 11, 3, 130], // Tyrannical, Bursting, Volcanic
    [10, 123, 4, 130], // Fortified, Spiteful, Necrotic
  ],
};
