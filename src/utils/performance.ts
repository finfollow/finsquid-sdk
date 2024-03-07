import moment from "moment";
import { PercentagePerformance, PerfTick } from "../gateway-api/types";

type TimePeriods = Record<keyof typeof periodToPctPerfMap, string>;

export function diffOfCurrentYearDays() {
  const oneDay = 24 * 60 * 60 * 1000; // hoursminutesseconds*milliseconds
  const current_date = new Date();
  const start_of_year = new Date(current_date.getFullYear(), 0, 1).getTime();

  return Math.round(
    Math.abs((start_of_year - current_date.getTime()) / oneDay)
  );
}

export const getPerformancePeriods = (firstDate?: string): TimePeriods => {
  const currentDate = new Date();
  return {
    today: moment(currentDate).format("YYYY-MM-DD"),
    l1Week: moment(currentDate).subtract(8, "days").format("YYYY-MM-DD"),
    l1Month: moment(currentDate)
      .subtract(1, "days")
      .subtract(1, "months")
      .format("YYYY-MM-DD"),
    l3Month: moment(currentDate)
      .subtract(1, "days")
      .subtract(3, "months")
      .format("YYYY-MM-DD"),
    ytd: moment().subtract(diffOfCurrentYearDays(), "d").format("YYYY-MM-DD"),
    l1Year: moment(currentDate)
      .subtract(1, "days")
      .subtract(1, "years")
      .format("YYYY-MM-DD"),
    l3Year: moment(currentDate)
      .subtract(1, "days")
      .subtract(3, "years")
      .format("YYYY-MM-DD"),
    l5Year: moment(currentDate)
      .subtract(1, "days")
      .subtract(5, "years")
      .format("YYYY-MM-DD"),
    max: moment(firstDate).format("YYYY-MM-DD"),
  };
};

export const isDateInPeriod = (
  date: string,
  startDate: string,
  endDate?: string
) => {
  return moment(date, "YYYY-MM-DD").isBetween(startDate, moment(endDate));
};

const delimiter = ".";
export const periodsLabels = {
  today: {
    indexes: 5,
    format: `HH:mm DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "HH:mm",
  },
  l1Week: {
    indexes: 5,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "DD MMM",
  },
  l1Month: {
    indexes: 4,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "DD MMM",
  },
  l3Month: {
    indexes: 10,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "DD MMM",
  },
  ytd: {
    indexes: 6,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  l1Year: {
    indexes: 12,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  l3Year: {
    indexes: 12,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  l5Year: {
    indexes: 12,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  max: {
    indexes: 100,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
};

export const periodToPctPerfMap: Record<
  keyof PercentagePerformance,
  keyof PercentagePerformance
> = {
  today: "today",
  l1Week: "l1Week",
  l1Month: "l1Month",
  l3Month: "l3Month",
  ytd: "ytd",
  l1Year: "l1Year",
  l3Year: "l3Year",
  l5Year: "l5Year",
  max: "max",
};

export const getFullPerformance = ({
  data = [],
  period,
  type,
}: {
  data?: Array<PerfTick | null>;
  period: keyof typeof periodToPctPerfMap;
  type: "MONETARY" | "PERCENTAGE";
}) => {
  const periods = getPerformancePeriods(data[0]?.date);
  let _data = Array.isArray(data)
    ? period === "max"
      ? data
      : data?.filter(
          (item) => item && isDateInPeriod(item?.date, periods[period])
        )
    : [];

  let result: { date: string; value: number }[] = [];
  const tickIndex =
    period === "max"
      ? type === "MONETARY"
        ? "accMonetaryPerf"
        : "accPctPerf"
      : type === "MONETARY"
      ? "monetaryPerf"
      : "pctPerf";

  for (let index = 0; index < _data.length; index++) {
    let tick = 0;
    const point = _data[index];

    if (period === "max") {
      tick =
        ((point && point[tickIndex]) || 0) * (type === "PERCENTAGE" ? 100 : 1);
    } else {
      if (type === "MONETARY")
        tick =
          index === 0
            ? (point && point[tickIndex]) || 0
            : (result[index - 1]?.value || 0) +
                ((point && point[tickIndex]) || 0) || 0;
      else {
        tick =
          index === 0
            ? 0
            : ((((point && point[tickIndex]) || 0) + 1) *
                ((result[index - 1]?.value || 0) / 100 + 1) -
                1) *
              100;
      }
    }
    result.push({
      date: moment(point?.date).format(periodsLabels[period].format),
      value: tick,
    });
  }

  return result.map((el) => ({ ...el, value: Number(el.value.toFixed(2)) }));
};
