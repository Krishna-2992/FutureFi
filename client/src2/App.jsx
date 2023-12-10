import { Route, Routes } from 'react-router-dom/dist/umd/react-router-dom.development';
import { useState } from 'react'
import './App.css'
import { ContextProvider, useCustomContext } from './ContextProvider'
import Navbar from './components/Navbar'

function App() {

    return (
        <ContextProvider>
            <Navbar />
            {/* <Route path="/mint" element={<Mint/>}/> */}
        </ContextProvider>
    )
}

export default App
