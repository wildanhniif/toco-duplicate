import ArticleForm from "@/views/admin/articles/form";

interface PageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PageProps) {
  return <ArticleForm articleId={params.id} />;
}
