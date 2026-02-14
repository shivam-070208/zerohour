"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkflowPage() {
  const params = useSearchParams();
  const router = useRouter();
  const scope = params.get("scope");
  const id = params.get("id");

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const query =
          scope === "individual" ? `userId=${id}` : `communityId=${id}`;
        const res = await fetch(`/api/recommendation/search?${query}`);
        const data = await res.json();
        if (data.id) {
          router.replace(`/recommendation/${data.id}`);
        }
      } catch (e) {
        console.error("Redirect error:", e);
      }
    };

    if (scope && id) {
      fetchAndRedirect();
    }
  }, [scope, id, router]);

  return (
    <div className="p-8 text-center">
      <p>Redirecting to workflow editor...</p>
    </div>
  );
}
