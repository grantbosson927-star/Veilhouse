import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import HouseDreams from "./pages/HouseDreams";
import CuratorAdmin from "./pages/CuratorAdmin";
import CuratorEntry from "./pages/CuratorEntry";
import SpecimenDetail from "./pages/SpecimenDetail";
import Archive from "./pages/Archive";
import CategoryArchive from "./pages/CategoryArchive";
import Manifesto from "./pages/Manifesto";
import Dispatches from "./pages/Dispatches";
import Curator from "./pages/Curator";
import FieldNotes from "./pages/FieldNotes";
import DocumentDetail from "./pages/DocumentDetail";
import SignIn from "./pages/SignIn";
import CuratorSection from "./pages/CuratorSection";
import VeilhouseLightbox from "./components/VeilhouseLightbox";
import "./content-pages.css";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Switch><Route path="/" component={Home} /><Route path="/sign-in" component={SignIn} /><Route path="/archive" component={Archive} /><Route path="/archive/:slug" component={CategoryArchive} /><Route path="/manifesto" component={Manifesto} /><Route path="/dispatches" component={Dispatches} /><Route path="/dispatches/:id" component={DocumentDetail} /><Route path="/curator" component={Curator} /><Route path="/field-notes" component={FieldNotes} /><Route path="/field-notes/:slug" component={DocumentDetail} /><Route path="/dreams" component={HouseDreams} /><Route path="/specimen/:slug" component={SpecimenDetail} /><Route path="/curator-entry" component={CuratorEntry} /><Route path="/curator-admin/:section" component={CuratorSection} /><Route path="/curator-admin" component={CuratorAdmin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><VeilhouseLightbox /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;

  
