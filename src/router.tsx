import { useEffect, useState } from "react";

/** Returns the current hash route, e.g. "/npm-install" (defaults to "/"). */
export function useHashRoute(): string {
  const read = () => {
    const h = window.location.hash.replace(/^#/, "");
    return h === "" ? "/" : h;
  };
  const [route, setRoute] = useState<string>(read);

  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

/** Programmatic navigation that plays nicely with the hash router. */
export function navigate(route: string) {
  const target = route.startsWith("#") ? route : `#${route}`;
  if (window.location.hash === target) return;
  window.location.hash = target;
}
