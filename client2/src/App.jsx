import './App.css'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Navbar from './components/Navbar'
import Home from './pages/Home'
import Mint from './pages/Mint'
import History from './pages/History'
import Docs from './pages/Docs'

function App() {
    return (
        <div className='w-full'>
            <Navbar />
            <Routes>
                <Route path='/' element={<Home />}></Route>
                <Route path='/mint usdc' element={<Mint />}></Route>
                <Route path='/history' element={<History />}></Route>
                <Route path='/docs' element={<Docs />}></Route>
            </Routes>
            <ToastContainer />
        </div>
    )
}

export default App
