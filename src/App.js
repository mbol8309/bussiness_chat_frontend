import logo from './logo.svg';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import Chat from './routes/chatwidget/Chat';
import NotFound from './routes/NotFound';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/chatwidget" element={<Chat />} />
        <Route path='*' exact={true} element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
