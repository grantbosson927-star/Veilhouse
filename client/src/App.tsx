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
function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Switch><Route path="/" component={Home} /><Route path="/dreams" component={HouseDreams} /><Route path="/specimen/:slug" component={SpecimenDetail} /><Route path="/curator-entry" component={CuratorEntry} /><Route path="/curator-admin" component={CuratorAdmin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;

  
