import { BrowserRouter as Router } from "react-router-dom";
import GiveProvider from "./context/GiveProvider";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <Router>
      <GiveProvider>
        <AppLayout />
      </GiveProvider>
    </Router>
  );
}

export default App;
