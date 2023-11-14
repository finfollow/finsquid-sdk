import moment from "moment";
import { PercentagePerformance, PerfTick } from "../gateway-api/types";

type TimePeriods = Record<keyof typeof PerfTimePeriod, string>;

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
    TODAY: moment(currentDate).format("YYYY-MM-DD"),
    WEEK: moment(currentDate).subtract(8, "days").format("YYYY-MM-DD"),
    MONTH: moment(currentDate)
      .subtract(1, "days")
      .subtract(1, "months")
      .format("YYYY-MM-DD"),
    MONTH_3: moment(currentDate)
      .subtract(1, "days")
      .subtract(3, "months")
      .format("YYYY-MM-DD"),
    YTD: moment().subtract(diffOfCurrentYearDays(), "d").format("YYYY-MM-DD"),
    YEAR: moment(currentDate)
      .subtract(1, "days")
      .subtract(1, "years")
      .format("YYYY-MM-DD"),
    YEAR_3: moment(currentDate)
      .subtract(1, "days")
      .subtract(3, "years")
      .format("YYYY-MM-DD"),
    YEAR_5: moment(currentDate)
      .subtract(1, "days")
      .subtract(5, "years")
      .format("YYYY-MM-DD"),
    ALL: moment(firstDate).format("YYYY-MM-DD"),
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
  TODAY: {
    indexes: 5,
    format: `HH:mm DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "HH:mm",
  },
  WEEK: {
    indexes: 5,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "DD MMM",
  },
  MONTH: {
    indexes: 4,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "DD MMM",
  },
  MONTH_3: {
    indexes: 10,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "DD MMM",
  },
  YTD: {
    indexes: 6,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  YEAR: {
    indexes: 12,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  YEAR_3: {
    indexes: 12,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  YEAR_5: {
    indexes: 12,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
  ALL: {
    indexes: 100,
    format: `DD${delimiter}MM${delimiter}YYYY`,
    chartFormat: "MMM YY",
  },
};

export enum PerfTimePeriod {
  TODAY = "TODAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  MONTH_3 = "MONTH_3",
  YTD = "YTD",
  YEAR = "YEAR",
  YEAR_3 = "YEAR_3",
  YEAR_5 = "YEAR_5",
  ALL = "ALL",
}

export const periodToPctPerfMap: Record<
  keyof typeof PerfTimePeriod,
  keyof PercentagePerformance
> = {
  TODAY: "today",
  WEEK: "l1Week",
  MONTH: "l1Month",
  MONTH_3: "l3Month",
  YTD: "ytd",
  YEAR: "l1Year",
  YEAR_3: "l3Year",
  YEAR_5: "l5Year",
  ALL: "max",
};

export const getFullPerformance = ({
  data = [],
  period,
  type,
}: {
  data?: Array<PerfTick | null>;
  period: keyof typeof PerfTimePeriod;
  type: "MONETARY" | "PERCENTAGE";
}) => {
  const periods = getPerformancePeriods(data[0]?.date);
  let _data =
    period === "ALL"
      ? data
      : data.filter(
          (item) => item && isDateInPeriod(item?.date, periods[period])
        );

  let result: { date: string; value: number }[] = [];
  const tickIndex =
    period === "ALL"
      ? type === "MONETARY"
        ? "accMonetaryPerf"
        : "accPctPerf"
      : type === "MONETARY"
      ? "monetaryPerf"
      : "pctPerf";

  for (let index = 0; index < _data.length; index++) {
    let tick = 0;
    const point = _data[index];

    if (period === "ALL") {
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
          ((((point && point[tickIndex]) || 0) + 1) *
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
