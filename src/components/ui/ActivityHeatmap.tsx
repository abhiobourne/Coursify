"use client";

import { useEffect, useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { getUserActivity, DailyActivity } from "@/lib/courses";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ActivityHeatmap() {
    const { user } = useAuth();
    const [activity, setActivity] = useState<DailyActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const creationYear = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).getFullYear()
        : new Date().getFullYear();

    useEffect(() => {
        async function loadActivity() {
            if (!user) return;
            try {
                const data = await getUserActivity(user.uid);
                setActivity(data);
            } catch (error) {
                console.error("Failed to load activity", error);
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
    }, [user, selectedYear]);

    if (loading) {
        return (
            <div className="flex justify-center py-20 w-full min-h-[200px] items-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const monthsInYear = Array.from({ length: 12 }, (_, i) => i);

    // Map activity data by date string for O(1) lookups
    const activityMap = new Map<string, number>();
    activity.forEach(a => {
        activityMap.set(a.dateStr, a.secondsStudied);
    });

    const monthsData = monthsInYear.map(monthIndex => {
        const monthStart = new Date(selectedYear, monthIndex, 1);
        const monthEnd = new Date(selectedYear, monthIndex + 1, 0); // last day of month
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        const weeks: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = Array(monthStart.getDay()).fill(null);

        daysInMonth.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) currentWeek.push(null);
            weeks.push(currentWeek);
        }

        return {
            monthIndex,
            monthStr: format(monthStart, "MMM"),
            weeks
        };
    });

    // LeetCode Color Scale logic
    const getColorClass = (seconds: number) => {
        if (seconds === 0) return "bg-zinc-200 dark:bg-zinc-800/50";
        if (seconds < 60 * 15) return "bg-[#9be9a8] dark:bg-[#0e4429]"; // < 15 mins (Level 1)
        if (seconds < 60 * 30) return "bg-[#40c463] dark:bg-[#006d32]"; // < 30 mins (Level 2)
        if (seconds < 60 * 60) return "bg-[#30a14e] dark:bg-[#26a641]"; // < 60 mins (Level 3)
        return "bg-[#216e39] dark:bg-[#39d353]"; // > 60 mins (Level 4)
    };

    const activeDays = Array.from(activityMap.values()).filter(sec => sec > 0).length;

    return (
        <div className="flex flex-col w-full overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 px-2">
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{activeDays} submissions in {selectedYear}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Total active days tracked</p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setSelectedYear(prev => prev - 1)}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        disabled={selectedYear <= creationYear}
                        title="Previous Year"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold min-w-[4ch] text-center">{selectedYear}</span>
                    <button
                        onClick={() => setSelectedYear(prev => prev + 1)}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        disabled={selectedYear >= new Date().getFullYear()}
                        title="Next Year"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col w-full overflow-hidden">
                <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="flex gap-4 md:gap-6 mt-4 min-w-max px-2">

                        {monthsData.map((monthData, mIdx) => (
                            <div key={mIdx} className="flex flex-col gap-2">
                                <span className="text-[10px] md:text-xs font-semibold text-muted-foreground whitespace-nowrap pl-1 h-4">
                                    {monthData.monthStr}
                                </span>
                                <div className="flex gap-1 md:gap-[3px]">
                                    {monthData.weeks.map((week, wIdx) => (
                                        <div key={wIdx} className="relative flex flex-col gap-1 md:gap-[3px]">
                                            {week.map((day, dIdx) => {
                                                if (!day) {
                                                    return <div key={dIdx} className="w-3 h-3 md:w-3.5 md:h-3.5 bg-transparent" />;
                                                }

                                                const dateStr = format(day, "yyyy-MM-dd");
                                                const seconds = activityMap.get(dateStr) || 0;
                                                const minutes = Math.ceil(seconds / 60);
                                                const colorClass = getColorClass(seconds);

                                                return (
                                                    <Tooltip key={dIdx}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-[2px] ${colorClass} hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 hover:ring-offset-background transition-all cursor-pointer`}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-zinc-900 border border-white/10 text-white text-[11px] font-medium rounded-lg px-3 py-1.5 shadow-xl">
                                                            {minutes > 0 ? `${minutes} minutes studied` : 'No study activity'} on {format(day, "MMM d, yyyy")}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Legend */}
            <div className="flex items-center justify-end gap-2 text-xs font-medium text-muted-foreground mt-2 px-2">
                <span>Less</span>
                <div className="flex gap-1.5 items-center">
                    <div className="w-3 h-3 rounded-sm bg-zinc-200 dark:bg-zinc-800/50" />
                    <div className="w-3 h-3 rounded-sm bg-[#9be9a8] dark:bg-[#0e4429]" />
                    <div className="w-3 h-3 rounded-sm bg-[#40c463] dark:bg-[#006d32]" />
                    <div className="w-3 h-3 rounded-sm bg-[#30a14e] dark:bg-[#26a641]" />
                    <div className="w-3 h-3 rounded-sm bg-[#216e39] dark:bg-[#39d353]" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
