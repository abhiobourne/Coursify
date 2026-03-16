import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    serverTimestamp,
    increment,
    writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { YouTubeCourseData } from './youtube';

export interface Course {
    id: string; // YouTube playlist ID or Video ID
    userId: string;
    title: string;
    sourceUrl: string;
    thumbnailUrl: string;
    totalDuration: number;
    completedDuration: number;
    createdAt: any;
    updatedAt: any;
    tags?: string[];
}

export interface CourseVideo {
    id: string; // YouTube Video ID
    courseId: string;
    title: string;
    thumbnailUrl: string;
    duration: number;
    isCompleted: boolean;
    isFavorite?: boolean;
    order: number;
}

export interface FavoriteVideo {
    id: string; // Composite: userId_courseId_videoId
    userId: string;
    courseId: string;
    videoId: string;
    title: string;
    thumbnailUrl: string;
    duration: number;
    createdAt: any;
}

export interface Note {
    id: string;
    userId: string;
    courseId: string;
    videoId: string;
    content: string;
    updatedAt: any;
}

export interface DailyActivity {
    id: string;
    userId: string;
    dateStr: string; // YYYY-MM-DD
    secondsStudied: number;
    updatedAt: any;
}

// Helper to get YouTube ID from URL
export function getYouTubeIdFromUrl(url: string): string | null {
    let parsedUrl = url;
    if (!parsedUrl.startsWith('http')) {
        parsedUrl = 'https://' + parsedUrl;
    }

    try {
        const urlObj = new URL(parsedUrl);
        const playlistId = urlObj.searchParams.get('list');
        if (playlistId) return playlistId;

        const videoIdMatch = parsedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
        if (videoIdMatch && videoIdMatch[1]) return videoIdMatch[1];
    } catch (e) {
        return null;
    }
    return null;
}

// Get a single course by ID
export async function getCourse(courseId: string): Promise<Course | null> {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
        return { id: courseSnap.id, ...courseSnap.data() } as Course;
    }
    return null;
}

// Full import flow
export async function importCourse(userId: string, url: string): Promise<string> {
    const ytId = getYouTubeIdFromUrl(url);
    if (!ytId) throw new Error("Invalid YouTube URL");

    // 1. Check if course already exists
    const courseId = `${userId}_${ytId}`;
    const existing = await getCourse(courseId);
    if (existing) return existing.id;

    // 2. Fetch metadata from API
    const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to parse YouTube URL");
    }

    const ytData = await res.json();

    // 3. Create the course in Firestore
    return await createCourseFromYouTube(userId, url, ytData);
}

// Save a new course from YouTube Data
export async function createCourseFromYouTube(
    userId: string,
    sourceUrl: string,
    ytData: YouTubeCourseData
): Promise<string> {
    // Use the YouTube ID directly or a composite to prevent duplicates
    const courseId = `${userId}_${ytData.id}`;

    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    // If it already exists, return it
    if (courseSnap.exists()) {
        return courseId;
    }

    // Use a batch to ensure everything saves together
    const batch = writeBatch(db);

    // 1. Save Course Metadata
    batch.set(courseRef, {
        id: courseId,
        originalId: ytData.id,
        userId,
        title: ytData.title,
        sourceUrl,
        thumbnailUrl: ytData.thumbnailUrl,
        totalDuration: ytData.totalDuration,
        completedDuration: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // 2. Save Videos
    ytData.videos.forEach((video, index) => {
        // We use a composite ID for videos to ensure uniqueness within a course
        const videoRef = doc(db, 'course_videos', `${courseId}_${video.id}`);
        batch.set(videoRef, {
            id: video.id,
            courseId: courseId,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            isCompleted: false,
            isFavorite: false,
            order: index
        });
    });

    await batch.commit();
    return courseId;
}

// Get all courses for a user
export async function getUserCourses(userId: string): Promise<Course[]> {
    const q = query(
        collection(db, 'courses'),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const courses = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));

    // Sort in memory to avoid Firestore composite index requirement
    return courses.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA; // Descending
    });
}



// Get all videos for a course
export async function getCourseVideos(courseId: string): Promise<CourseVideo[]> {
    const q = query(
        collection(db, 'course_videos'),
        where('courseId', '==', courseId)
    );

    const snapshot = await getDocs(q);
    const videos = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id } as any));

    // Sort in memory to avoid Firestore composite index requirement
    return videos.sort((a, b) => a.order - b.order); // Ascending
}

// Mark video as completed/uncompleted
export async function toggleVideoCompletion(
    userId: string,
    courseId: string,
    videoId: string,
    currentStatus: boolean,
    duration: number
): Promise<void> {
    const videoRef = doc(db, 'course_videos', `${courseId}_${videoId}`);
    const courseRef = doc(db, 'courses', courseId);

    const batch = writeBatch(db);

    // Update video status
    batch.update(videoRef, { isCompleted: !currentStatus });

    // Update total completed duration in course
    const durationChange = currentStatus ? -duration : duration;
    batch.update(courseRef, {
        completedDuration: increment(durationChange),
        updatedAt: serverTimestamp()
    });

    // Update Daily Activity
    if (userId) {
        const todayStr = new Date().toISOString().split('T')[0];
        const activityRef = doc(db, 'activity', `${userId}_${todayStr}`);

        // We use set with merge:true because the document might not exist yet
        batch.set(activityRef, {
            id: `${userId}_${todayStr}`,
            userId,
            dateStr: todayStr,
            secondsStudied: increment(durationChange),
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    await batch.commit();
}

// Save note for a video
export async function saveVideoNote(
    userId: string,
    courseId: string,
    videoId: string,
    content: string
): Promise<void> {
    const noteId = `${userId}_${videoId}`;
    const noteRef = doc(db, 'notes', noteId);

    await setDoc(noteRef, {
        id: noteId,
        userId,
        courseId,
        videoId,
        content,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// Get note for a video
export async function getVideoNote(userId: string, videoId: string): Promise<Note | null> {
    const noteId = `${userId}_${videoId}`;
    const noteRef = doc(db, 'notes', noteId);
    const docSnap = await getDoc(noteRef);

    if (docSnap.exists()) {
        return { ...docSnap.data() } as Note;
    }
    return null;
}

// Delete a course and all its videos
export async function deleteCourse(courseId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Delete the course document
    const courseRef = doc(db, 'courses', courseId);
    batch.delete(courseRef);

    // 2. Query and delete all videos for the course
    const q = query(
        collection(db, 'course_videos'),
        where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 3. (Optional) Notes are left orphaned, but we could delete them as well if needed.

    await batch.commit();
}

// Toggle Favorite Video
export async function toggleVideoFavorite(
    userId: string,
    courseId: string,
    video: CourseVideo,
    isCurrentlyFavorite: boolean
): Promise<void> {
    const favId = `${userId}_${courseId}_${video.id}`;
    const favRef = doc(db, 'favorites', favId);

    const videoRef = doc(db, 'course_videos', `${courseId}_${video.id}`);
    const batch = writeBatch(db);

    batch.update(videoRef, { isFavorite: !isCurrentlyFavorite });

    if (isCurrentlyFavorite) {
        batch.delete(favRef);
    } else {
        batch.set(favRef, {
            id: favId,
            userId,
            courseId,
            videoId: video.id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            createdAt: serverTimestamp()
        });
    }

    await batch.commit();
}

// Get user's favorite videos
export async function getFavoriteVideos(userId: string): Promise<FavoriteVideo[]> {
    const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const favs = snapshot.docs.map(doc => doc.data() as FavoriteVideo);

    // Sort in memory
    return favs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
    });
}

// Update course tags
export async function updateCourseTags(courseId: string, tags: string[]): Promise<void> {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
        tags,
        updatedAt: serverTimestamp()
    });
}

// Get user activity
export async function getUserActivity(userId: string): Promise<DailyActivity[]> {
    const q = query(
        collection(db, 'activity'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => doc.data() as DailyActivity);
    return activities.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}
