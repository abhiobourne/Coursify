import { NextResponse } from 'next/server';
import { fetchYouTubeData } from '@/lib/youtube';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const data = await fetchYouTubeData(url);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("YouTube API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch YouTube data" },
            { status: 500 }
        );
    }
}
