import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UrgentCarBuyPage from "./UrgentCarBuyPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auto" element={<UrgentCarBuyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
