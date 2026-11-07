import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { ErrorState } from "@/components/shared/States";
import { PostForm } from "@/components/post/PostForm";
import { usePostsStore } from "@/stores/postsStore";

// Edit post (CR only): unknown ids 404; otherwise the shared composer in
// "edit" mode. Deleting lives on the post detail, next to the thread it
// removes.
export default function EditPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const post = usePostsStore((s) => s.posts.find((p) => p.id === id));

  if (!post) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Edit post" showBack />
        <ErrorState
          title="Post not found"
          message="This update may have been deleted."
          actionLabel="Back to posts"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return <PostForm post={post} />;
}
