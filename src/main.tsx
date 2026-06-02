import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { useHashRoute } from "./router.tsx";
import { Nav } from "./components/Nav.tsx";
import { Footer } from "./components/Footer.tsx";
import { Home } from "./pages/Home.tsx";
import { NpmInstall } from "./pages/NpmInstall.tsx";
import { DriftCalculator } from "./pages/DriftCalculator.tsx";
import { ComingSoon } from "./components/ComingSoon.tsx";
import { projectBySlug } from "./data/content.ts";

function App() {
  const route = useHashRoute();
  const slug = route.replace(/^\//, "").split("/")[0];

  let page: React.ReactNode;
  if (route === "/" || slug === "") {
    page = <Home />;
  } else if (slug === "npm-install") {
    page = <NpmInstall />;
  } else if (slug === "drift-calculator") {
    page = <DriftCalculator />;
  } else {
    const project = projectBySlug(slug);
    page = project ? (
      <ComingSoon project={project} />
    ) : (
      <ComingSoon notFound />
    );
  }

  return (
    <>
      <Nav route={route} />
      {page}
      <Footer />
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
