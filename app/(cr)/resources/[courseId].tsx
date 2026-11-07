import { CourseFiles } from "@/components/resources/CourseFiles";

// CR course files: read like students, plus upload and delete (your own files,
// or any file in the level if you are the Main CR).
export default function CRCourseResources() {
  return (
    <CourseFiles
      canManage
      emptyHint="Tap Upload file to share lecture notes, slides or past papers."
    />
  );
}
