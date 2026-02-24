"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function SignInToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fired = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-mount firing the toast twice
    if (fired.current) return;
    if (searchParams.get("welcome") === "1") {
      fired.current = true;
      toast.success("Signed in successfully!", {
        description: "Welcome back to your workspace.",
        duration: 4000,
      });
      router.replace(pathname, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function SignInToast() {
  return (
    <Suspense>
      <SignInToastInner />
    </Suspense>
  );
}
