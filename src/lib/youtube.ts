import getYouTubeID from 'get-youtube-id';

export interface YouTubeVideoData {
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: number; // in seconds
    startTime?: number; // start time in seconds for segments
}

export interface YouTubeCourseData {
    id: string;
    title: string;
    thumbnailUrl: string;
    description?: string;
    isPlaylist: boolean;
    channelTitle?: string;
    videos: YouTubeVideoData[];
    totalDuration: number;
}

// Helper to parse ISO 8601 duration (e.g., PT1H2M10S) to seconds
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
    const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;

    return hours * 3600 + minutes * 60 + seconds;
}

// Helper to parse timestamps from description (e.g., "01:20 - Intro")
function parseTimestamps(description: string, totalDuration: number): { time: number; label: string }[] {
    const timestamps: { time: number; label: string }[] = [];
    // Match formats like "01:22", "1:22:33", "(01:22)", "[1:22]"
    const regex = /(?:\(|\[)?((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\)|\])?(?:\s+-\s+|\s+|:\s+)(.+)/g;
    let match;

    while ((match = regex.exec(description)) !== null) {
        const timeStr = match[1];
        const label = match[2].trim();

        const parts = timeStr.split(':').map(p => parseInt(p));
        let seconds = 0;
        if (parts.length === 3) {
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            seconds = parts[0] * 60 + parts[1];
        }

        if (seconds < totalDuration) {
            timestamps.push({ time: seconds, label });
        }
    }

    // Sort by time
    return timestamps.sort((a, b) => a.time - b.time);
}

export async function fetchYouTubeData(url: string): Promise<YouTubeCourseData> {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    // Check if it's a playlist
    const urlObj = new URL(url);
    const playlistId = urlObj.searchParams.get('list');
    const videoId = getYouTubeID(url);

    if (!YOUTUBE_API_KEY) {
        throw new Error("YOUTUBE_API_KEY is completely missing from process.env inside the API route!");
    }

    if (playlistId) {
        return await fetchPlaylistData(playlistId, YOUTUBE_API_KEY);
    } else if (videoId) {
        return await fetchSingleVideoData(videoId, YOUTUBE_API_KEY);
    } else {
        throw new Error("Invalid YouTube URL");
    }
}

async function fetchPlaylistData(playlistId: string, apiKey: string): Promise<YouTubeCourseData> {
    // 1. Fetch playlist items
    const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    const itemsRes = await fetch(itemsUrl);

    if (!itemsRes.ok) {
        if (itemsRes.status === 403) throw new Error("Access forbidden. API Key might be invalid or quota exceeded.");
        if (itemsRes.status === 404) throw new Error("Playlist not found. It may be private or deleted.");
        throw new Error(`Failed to fetch playlist: ${itemsRes.statusText}`);
    }

    const itemsData = await itemsRes.json();
    if (!itemsData.items || itemsData.items.length === 0) {
        throw new Error("Playlist is empty or contains only private videos.");
    }

    // Extract video IDs to fetch duration
    const videoIds = itemsData.items.map((item: any) => item.contentDetails.videoId);

    // 2. Fetch video details (for duration)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    if (!videosRes.ok) throw new Error("Failed to fetch video details");
    const videosData = await videosRes.json();

    // Create a map of videoId to duration
    const durationMap = new Map();
    videosData.items.forEach((item: any) => {
        durationMap.set(item.id, parseISO8601Duration(item.contentDetails.duration));
    });

    // 3. Assemble the course data
    const videos: YouTubeVideoData[] = itemsData.items.map((item: any) => {
        const vId = item.contentDetails.videoId;
        return {
            id: vId,
            title: item.snippet.title,
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            duration: durationMap.get(vId) || 0
        };
    });

    // 4. Fetch playlist snippet for title
    const listUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();
    const playlistTitle = listData.items?.[0]?.snippet?.title || "Imported Playlist";
    const playlistThumbnail = listData.items?.[0]?.snippet?.thumbnails?.high?.url || videos[0]?.thumbnailUrl;
    const playlistDescription = listData.items?.[0]?.snippet?.description || "";
    const channelTitle = listData.items?.[0]?.snippet?.channelTitle || "";

    const totalDuration = videos.reduce((acc, v) => acc + v.duration, 0);

    return {
        id: playlistId,
        title: playlistTitle,
        thumbnailUrl: playlistThumbnail,
        description: playlistDescription,
        channelTitle,
        isPlaylist: true,
        videos,
        totalDuration
    };
}

async function fetchSingleVideoData(videoId: string, apiKey: string): Promise<YouTubeCourseData> {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
        if (res.status === 403) throw new Error("Access forbidden. API Key might be invalid or quota exceeded.");
        if (res.status === 404) throw new Error("Video not found. It may be private or deleted.");
        throw new Error(`Failed to fetch video: ${res.statusText}`);
    }

    const data = await res.json();

    if (!data.items || data.items.length === 0) {
        throw new Error("Video not found");
    }

    const item = data.items[0];
    const duration = parseISO8601Duration(item.contentDetails.duration);
    const title = item.snippet.title;
    const description = item.snippet.description || "";
    const channelTitle = item.snippet.channelTitle || "";
    const thumbnailUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url;

    const timestamps = parseTimestamps(description, duration);
    let videos: YouTubeVideoData[] = [];

    if (timestamps.length >= 2) {
        // Create segments
        for (let i = 0; i < timestamps.length; i++) {
            const start = timestamps[i].time;
            const end = (i < timestamps.length - 1) ? timestamps[i + 1].time : duration;
            videos.push({
                id: videoId,
                title: timestamps[i].label,
                thumbnailUrl,
                duration: end - start,
                startTime: start
            });
        }
    } else {
        videos.push({
            id: videoId,
            title,
            thumbnailUrl,
            duration,
            startTime: 0
        });
    }

    return {
        id: videoId,
        title,
        thumbnailUrl,
        description,
        channelTitle,
        isPlaylist: false,
        videos,
        totalDuration: duration
    };
}

