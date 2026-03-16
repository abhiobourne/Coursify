import { cn } from "@/lib/utils";

interface ProgressBarProps {
    progress: number; // 0 to 100
    className?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function ProgressBar({
    progress,
    className,
    size = "md",
    showLabel = true
}: ProgressBarProps) {

    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    const hSize = {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4"
    }[size];

    return (
        <div className={cn("w-full flex flex-col gap-2", className)}>
            {showLabel && (
                <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-zinc-400">Progress</span>
                    <span className={cn(
                        "text-right",
                        clampedProgress === 100 ? "text-green-400" : "text-white"
                    )}>
                        {Math.round(clampedProgress)}%
                    </span>
                </div>
            )}
            <div className={cn("w-full bg-zinc-800 rounded-full overflow-hidden", hSize)}>
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        clampedProgress === 100
                            ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                            : "bg-gradient-to-r from-primary to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                    )}
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
        </div>
    );
}
