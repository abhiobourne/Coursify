import Link from "next/link";
import { FavoriteVideo } from "@/lib/courses";
import { Play } from "lucide-react";

interface FavoriteVideoCardProps {
    video: FavoriteVideo;
}

export function FavoriteVideoCard({ video }: FavoriteVideoCardProps) {
    // Format duration (e.g., 1h 30m)
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    return (
        <Link href={`/course/${video.courseId}?v=${video.videoId}&s=${video.startTime || 0}`} className="group block h-full">
            <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col relative group-hover:-translate-y-1 transition-transform duration-300">

                {/* Thumbnail Container */}
                <div className="relative aspect-video overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Overlay Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg backdrop-blur-md transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-75">
                            <Play className="w-6 h-6 ml-1" />
                        </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 z-20 bg-background/80 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-foreground shadow-lg border border-border">
                        {formatDuration(video.duration)}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                    </h3>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute -inset-px rounded-2xl border border-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
            </div>
        </Link>
    );
}
