import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/routes/Home";
import Training from "@/routes/Training";
import Execution from "@/routes/Execution";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/execution" element={<Execution />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
