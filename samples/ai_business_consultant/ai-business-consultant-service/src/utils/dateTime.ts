import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
  subMonths,
  startOfYear,
  addDays,
  endOfWeek,
  addWeeks,
  isBefore,
  isSameWeek,
  isAfter,
} from "date-fns";

export const getTodayStart = async () => {
  const now = new Date();
  //今天
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  return {
    start: todayStart,
    end: todayEnd,
  };
};

export const getYesterdayStart = async () => {
  const now = new Date();
  //昨天
  const yesterday = subDays(now, 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayEnd = endOfDay(yesterday);
  return {
    start: yesterdayStart,
    end: yesterdayEnd,
  };
};

export const getLast7DaysStart = async () => {
  const now = new Date();
  //最近7天
  const last7DaysStart = startOfDay(subDays(now, 6)); // 6天前的0点
  const last7DaysEnd = endOfDay(now); // 今天的23:59:59
  return {
    start: last7DaysStart,
    end: last7DaysEnd,
  };
};

export const getLast30DaysStart = async () => {
  const now = new Date();
  //最近30天
  const last30DaysStart = startOfDay(subDays(now, 29)); // 从29天前（含）开始
  const last30DaysEnd = endOfDay(now);
  return {
    start: last30DaysStart,
    end: last30DaysEnd,
  };
};

export const getLast90DaysStart = async () => {
  const now = new Date();
  //最近90天
  const last30DaysStart = startOfDay(subDays(now, 89)); // 从89天前（含）开始
  const last30DaysEnd = endOfDay(now);
  return {
    start: last30DaysStart,
    end: last30DaysEnd,
  };
};

export const getThisWeekStart = async () => {
  const now = new Date();

  // 本周（默认以周一为一周的第一天）
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfDay(now);
  return {
    start: thisWeekStart,
    end: thisWeekEnd,
  };
};

export const getThisMonthStart = async () => {
  const now = new Date();

  // 本月
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfDay(now);
  return {
    start: thisMonthStart,
    end: thisMonthEnd,
  };
};

export const getThreeMonthStart = async () => {
  const now = new Date();

  // 三个月
  // 获取3个月前的月初
  const threeMonthsAgoStart = startOfMonth(subMonths(now, 2)); // 包含本月在内，减2个月
  const thisMonthEnd = endOfDay(now);
  return {
    start: threeMonthsAgoStart,
    end: thisMonthEnd,
  };
};


export const getThisYearStart = async () => {
  const now = new Date();

  // 今年
  const yearStart = startOfYear(now);
  const thisMonthEnd = endOfDay(now);
  return {
    start: yearStart,
    end: thisMonthEnd,
  };
};

//获取本周每一天的开始时间和结束时间
export const getThisWeekDaysUntilToday = async () => {
  const now = new Date();

  // 本周开始时间（以周一为起点）
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  const result = [];
  const todayIndex = now.getDay() === 0 ? 7 : now.getDay(); // 周日是0，改为7

  for (let i = 0; i < todayIndex; i++) {
    const day = addDays(thisWeekStart, i);
    result.push({
      start: startOfDay(day),
      end: endOfDay(day),
    });
  }

  return result;
};

//获取本月每一周时间
export const getWeeksOfThisMonthUntilNow = async () => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weeks = [];

  let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  while (isBefore(weekStart, now) || isSameWeek(weekStart, now, { weekStartsOn: 1 })) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    // 截止到今天，防止本周未结束时包含未来日期
    weeks.push({
      start: weekStart,
      end: isAfter(weekEnd, now) ? endOfDay(now) : weekEnd,
    });
    weekStart = addWeeks(weekStart, 1);
  }

  return weeks;
};


