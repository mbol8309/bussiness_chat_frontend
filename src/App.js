// import logo from './logo.svg';
import * as React from "react";
import { Admin, ListGuesser, Resource, useAuthState } from 'react-admin';

import { AdminLayout } from "./Layout";
// import { createNetworkInterface } from 'react-apollo';

import { Backdrop, CircularProgress } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./routes/adminRoute";
import NotFound from "./routes/NotFound";
import Chat from "./routes/chatwidget/Chat";

// import './App.css';
// import { Route, Routes } from 'react-router-dom';
// import Chat from './routes/chatwidget/Chat';
// import NotFound from './routes/NotFound';

function App() {

  return (
    <BrowserRouter>
        <Routes>
          <Route path={'/'} element={<NotFound />} />
          <Route path={'/widget'} element={<Chat/>} />
          <Route path={'/admin/*'} element={
            <React.Suspense fallback={
              <Backdrop open={true}>
                <CircularProgress style={{ color: '#FFF' }} />
              </Backdrop>}>
              <AdminRoute />
            </React.Suspense>} />
        </Routes>
      </BrowserRouter>
    
    // <div className="App">
    //   <Routes>
    //     <Route path="/chatwidget" element={<Chat />} />
    //     <Route path='*' exact={true} element={<NotFound />} />
    //   </Routes>
    // </div>
  );
}

export default App;
