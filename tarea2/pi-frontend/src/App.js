import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import UploadFile from './components/UploadFile';
import MyFiles from './components/MyFiles';
import '@fontsource/inter'; // Importa la fuente Inter

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/uploadfile" element={<UploadFile />} />
          <Route path="/my-files" element={<MyFiles />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
