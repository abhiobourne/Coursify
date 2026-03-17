import { getCourse, getCourseVideos } from "@/lib/courses";
import CoursePlayerClient from "@/components/course/CoursePlayerClient";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const course = await getCourse(id);

    if (!course) {
        return {
            title: "Course Not Found | YT Course Player",
        };
    }

    return {
        title: `${course.title} | YT Course Player`,
        description: course.description || `Learn from ${course.title} with structured chapters and study notes.`,
        openGraph: {
            title: course.title,
            description: course.description || `Structured learning path for ${course.title}.`,
            images: [course.thumbnailUrl],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: course.title,
            description: course.description || `Structured learning path for ${course.title}.`,
            images: [course.thumbnailUrl],
        },
    };
}

export default async function CoursePage({ params, searchParams }: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ v?: string, s?: string }>
}) {
    const { id } = await params;
    const { v: initialVideoId, s: initialStartTimeStr } = await searchParams;
    const initialStartTime = initialStartTimeStr ? parseInt(initialStartTimeStr) : undefined;

    const courseData = await getCourse(id);

    if (!courseData) {
        notFound();
    }

    const videosData = await getCourseVideos(id);

    // Deeply serialize the data to ensure only plain objects are passed to Client Components
    // Handle Firestore Timestamps by converting them to ISO strings
    const serialize = (obj: any) => {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                return new Date(value.seconds * 1000).toISOString();
            }
            return value;
        }));
    };

    const course = serialize(courseData);
    const videos = serialize(videosData);

    return (
        <CoursePlayerClient
            course={course}
            initialVideos={videos}
            initialVideoId={initialVideoId}
            initialStartTime={initialStartTime}
        />
    );
}
